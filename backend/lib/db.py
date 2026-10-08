"""Local persistence layer — replaces MongoDB so the backend starts instantly, with no
external service and no connection wait (the "Conectando ao seu PC…" fix).

Routers keep the exact awaitable surface they used with motor:
    await db.users.find_one({...})                       # equality / {"$in": [...]}
    await db.history.find({...}).sort("created_at", -1).to_list(200)
    await db.sessions.insert_one({...}) / insert_many([...])
    await db.user_states.update_one({...}, {"$set": ..., "$setOnInsert": ...}, upsert=True)
    await db.alerts.update_many({...}, {"$set": ...})
    await db.sessions.delete_one({...})

Supabase swap (the plan): everything that knows how data is stored lives HERE and only
here — replacing this module with a Supabase-backed implementation of the same methods
touches one file and zero routers. Ids stay string uuid4 either way.

Behaviour:
    - Documents live in memory; every mutation flushes atomically to backend/data/store.json,
      so state survives backend restarts and --reload cycles.
    - Datetimes are stored as ISO strings on disk and decoded back into datetime objects on
      load, so expiry checks, cleanup catch-up math and sorts behave exactly as with motor.
    - Query language is the subset this app uses: field equality and {"$in": [...]};
      updates support {"$set": ...} and {"$setOnInsert": ...}.
"""

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from types import SimpleNamespace

DATA_FILE = (
    Path(os.environ["STORE_PATH"])
    if os.environ.get("STORE_PATH")
    else Path(__file__).parent.parent / "data" / "store.json"
)

_ISO = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$")
_FLOOR = datetime.min.replace(tzinfo=timezone.utc)


def _decode(value):
    """JSON round-trips datetimes as ISO strings — decode them so expiry checks and date
    math see datetime objects again, the way motor handed them back."""
    if isinstance(value, str) and _ISO.match(value):
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return value
    if isinstance(value, dict):
        return {k: _decode(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_decode(v) for v in value]
    return value


def _encode(value):
    """Inverse of _decode, used by the JSON flush."""
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _encode(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_encode(v) for v in value]
    return value


def _sort_key(field: str):
    def key(doc: dict):
        value = doc.get(field)
        return (1, _FLOOR) if value is None else (0, value)

    return key


class _Cursor:
    def __init__(self, docs: list[dict]) -> None:
        self._docs = list(docs)

    def sort(self, field: str, direction: int = 1) -> "_Cursor":
        self._docs.sort(key=_sort_key(field), reverse=direction < 0)
        return self

    async def to_list(self, limit: int | None = None) -> list[dict]:
        out = list(self._docs)
        return out[:limit] if limit is not None else out


class Collection:
    """Mongo-flavoured async facade over one list of dicts."""

    def __init__(self, store: "Database", name: str) -> None:
        self._store = store
        self._name = name

    @property
    def docs(self) -> list[dict]:
        return self._store.buckets.setdefault(self._name, [])

    @staticmethod
    def _matches(doc: dict, query: dict) -> bool:
        for key, cond in query.items():
            value = doc.get(key)
            if isinstance(cond, dict):
                for op, arg in cond.items():
                    if op == "$in":
                        if value not in arg:
                            return False
                    elif op == "$ne":
                        if value == arg:
                            return False
                    else:
                        return False  # unsupported operator — never silently match
            elif value != cond:
                return False
        return True

    @staticmethod
    def _apply(doc: dict, update: dict) -> None:
        for key, value in update.get("$set", {}).items():
            doc[key] = value
        for key, value in update.items():  # operator-less keys set fields, like Mongo
            if not key.startswith("$"):
                doc[key] = value

    async def find_one(self, query: dict | None = None, sort: list | None = None) -> dict | None:
        found = [d for d in self.docs if self._matches(d, query or {})]
        if sort:
            for field, direction in reversed(sort):
                found.sort(key=_sort_key(field), reverse=direction < 0)
        return found[0] if found else None

    def find(self, query: dict | None = None) -> _Cursor:
        return _Cursor([d for d in self.docs if self._matches(d, query or {})])

    async def insert_one(self, doc: dict) -> SimpleNamespace:
        self.docs.append(doc)
        self._store.flush()
        return SimpleNamespace(inserted_id=doc.get("id"))

    async def insert_many(self, docs: list[dict]) -> SimpleNamespace:
        self.docs.extend(docs)
        self._store.flush()
        return SimpleNamespace(inserted_ids=[d.get("id") for d in docs])

    async def update_one(self, query: dict, update: dict, upsert: bool = False) -> SimpleNamespace:
        for doc in self.docs:
            if self._matches(doc, query):
                self._apply(doc, update)
                self._store.flush()
                return SimpleNamespace(matched_count=1, modified_count=1, upserted_id=None)
        if upsert:
            doc = {k: v for k, v in query.items() if not k.startswith("$")}
            doc.update(update.get("$setOnInsert", {}))
            doc.update(update.get("$set", {}))
            self.docs.append(doc)
            self._store.flush()
            return SimpleNamespace(matched_count=0, modified_count=1, upserted_id=doc.get("id"))
        return SimpleNamespace(matched_count=0, modified_count=0, upserted_id=None)

    async def update_many(self, query: dict, update: dict) -> SimpleNamespace:
        matched = 0
        for doc in self.docs:
            if self._matches(doc, query):
                self._apply(doc, update)
                matched += 1
        if matched:
            self._store.flush()
        return SimpleNamespace(matched_count=matched, modified_count=matched)

    async def delete_one(self, query: dict) -> SimpleNamespace:
        for i, doc in enumerate(self.docs):
            if self._matches(doc, query):
                del self.docs[i]
                self._store.flush()
                return SimpleNamespace(deleted_count=1)
        return SimpleNamespace(deleted_count=0)

    async def count_documents(self, query: dict | None = None) -> int:
        return sum(1 for d in self.docs if self._matches(d, query or {}))


class Database:
    """The `db` handle every router imports. Attribute access creates collections lazily,
    exactly like motor's `db.users` did."""

    def __init__(self) -> None:
        self.buckets: dict[str, list[dict]] = {}
        self._collections: dict[str, Collection] = {}
        self._load()

    def __getattr__(self, name: str) -> Collection:
        # Only reached when normal attribute lookup fails, i.e. collection names.
        collection = self._collections.get(name)
        if collection is None:
            collection = Collection(self, name)
            self._collections[name] = collection
        return collection

    def _load(self) -> None:
        if not DATA_FILE.exists():
            return
        try:
            raw = json.loads(DATA_FILE.read_text())
            self.buckets = {name: [_decode(d) for d in docs] for name, docs in raw.items()}
        except Exception:
            # A corrupted store must never block boot — start clean, next flush rewrites it.
            self.buckets = {}

    def flush(self) -> None:
        DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
        tmp = DATA_FILE.with_suffix(".tmp")
        tmp.write_text(json.dumps(self.buckets, default=_encode, ensure_ascii=False))
        os.replace(tmp, DATA_FILE)


db = Database()


async def ensure_indexes() -> None:
    """Kept for bootstrap compatibility; a local JSON store needs no indexes."""
    return None

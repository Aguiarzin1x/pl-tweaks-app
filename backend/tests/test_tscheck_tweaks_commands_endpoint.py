"""Covers acceptance criterion: GET /api/tweaks/commands exposes declarative Windows
command metadata for a future native executable (kind/apply/revert/requires_admin/
requires_reboot), a specific key returns kind='registry' with a 'reg add' apply command,
and an invalid key returns 404.
"""

import httpx


def test_commands_list_has_total_50_and_required_fields(client: httpx.Client):
    resp = client.get("/tweaks/commands")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["total"] == 50, f"expected total=50, got {body.get('total')}"
    items = body["tweaks"]
    assert len(items) == 50

    required_fields = {"kind", "apply", "revert", "requires_admin", "requires_reboot"}
    for item in items:
        missing = required_fields - set(item.keys())
        assert not missing, f"item {item.get('key')} missing fields: {missing}"


def test_commands_single_item_game_bar_dvr_off(client: httpx.Client):
    resp = client.get("/tweaks/commands/game-bar-dvr-off")
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert body["kind"] == "registry"
    assert any("reg add" in cmd for cmd in body["apply"]), body["apply"]


def test_commands_invalid_key_returns_404(client: httpx.Client):
    resp = client.get("/tweaks/commands/chave-invalida")
    assert resp.status_code == 404, resp.text

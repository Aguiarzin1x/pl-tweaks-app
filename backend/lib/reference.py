"""Reference FPS data per hardware tier, used by the "Comparar Máquinas" block.

There is no public benchmark feed here, so the cohort is modelled: each game's catalog
baseline is the reference for an *intermediate* PC, scaled per tier, then spread into a
percentile curve. Deterministic — the same tier + game always yields the same cohort.
"""

from lib.catalog import GAME_BY_ID

# Where each tier sits relative to the game's catalog baseline (intermediate = 1.0).
TIER_FACTOR: dict[str, float] = {
    "entrada": 0.62,
    "intermediario": 1.0,
    "avancado": 1.45,
    "topo": 1.95,
}

TIER_LABEL: dict[str, str] = {
    "entrada": "PCs de entrada",
    "intermediario": "PCs intermediários",
    "avancado": "PCs avançados",
    "topo": "PCs topo de linha",
}

# Percentile curve of a tier's cohort, as multipliers of that tier's median.
CURVE: list[tuple[float, float]] = [
    (5.0, 0.64),
    (10.0, 0.72),
    (25.0, 0.86),
    (50.0, 1.00),
    (75.0, 1.18),
    (90.0, 1.38),
    (95.0, 1.52),
]


def normalise_tier(tier: str | None) -> str:
    return tier if tier in TIER_FACTOR else "intermediario"


def cohort_curve(game_id: str, tier: str) -> list[tuple[float, int]]:
    """[(percentile, fps)] for this game + tier."""
    game = GAME_BY_ID.get(game_id)
    baseline = game["baseline_fps"] if game else 90
    median = baseline * TIER_FACTOR[normalise_tier(tier)]
    return [(pct, int(round(median * mult))) for pct, mult in CURVE]


def percentile_of(fps: int, game_id: str, tier: str) -> float:
    """Where `fps` lands inside the cohort, linearly interpolated and clamped to 1..99."""
    curve = cohort_curve(game_id, tier)
    if fps <= curve[0][1]:
        return 1.0
    if fps >= curve[-1][1]:
        return 99.0
    for i in range(1, len(curve)):
        prev_pct, prev_fps = curve[i - 1]
        pct, fps_at = curve[i]
        if fps <= fps_at:
            if fps_at == prev_fps:
                return pct
            ratio = (fps - prev_fps) / (fps_at - prev_fps)
            return round(prev_pct + ratio * (pct - prev_pct), 1)
    return 99.0


def median_fps(game_id: str, tier: str) -> int:
    return next(fps for pct, fps in cohort_curve(game_id, tier) if pct == 50.0)


def top_fps(game_id: str, tier: str) -> int:
    return next(fps for pct, fps in cohort_curve(game_id, tier) if pct == 90.0)


def verdict(percentile: float, tier: str) -> str:
    label = TIER_LABEL[normalise_tier(tier)].lower()
    if percentile >= 90:
        return f"Sua máquina está no topo dos {label}. Pouca gente chega nesse número."
    if percentile >= 70:
        return f"Você está bem acima da média dos {label}. Dá para arrancar mais com os ajustes que faltam."
    if percentile >= 45:
        return f"Você está na média dos {label}. Aplicar mais ajustes de alto impacto coloca você na frente."
    if percentile >= 20:
        return f"Você está abaixo da média dos {label} — tem bastante FPS na mesa esperando ajuste."
    return f"Sua máquina está entre as menos otimizadas dos {label}. O RIP Mode faz a maior diferença aqui."

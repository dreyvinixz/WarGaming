from __future__ import annotations

from .state import Region, Territory


DEFAULT_TERRITORIES_RAW = {
    "N1": {"id": "N1", "name": "Portal do Norte", "region": "northlands", "terrain": "jump_gate", "neighbors": ["N2", "C1"], "x": 20, "y": 20},
    "N2": {"id": "N2", "name": "Passagem Boreal", "region": "northlands", "terrain": "ice_world", "neighbors": ["N1", "N3", "C2"], "x": 40, "y": 18},
    "N3": {"id": "N3", "name": "Porto Branco", "region": "northlands", "terrain": "orbital_station", "neighbors": ["N2", "I1"], "x": 60, "y": 20},
    "I1": {"id": "I1", "name": "Porto de Ferro", "region": "iron_coast", "terrain": "shipyard", "neighbors": ["N3", "I2", "C3"], "x": 75, "y": 35},
    "I2": {"id": "I2", "name": "Baía de Aço", "region": "iron_coast", "terrain": "industrial_world", "neighbors": ["I1", "I3"], "x": 82, "y": 55},
    "I3": {"id": "I3", "name": "Penhasco Negro", "region": "iron_coast", "terrain": "fortress_moon", "neighbors": ["I2", "S3"], "x": 72, "y": 75},
    "C1": {"id": "C1", "name": "Campo Verde", "region": "central_plains", "terrain": "terraformed_world", "neighbors": ["N1", "C2", "S1"], "x": 25, "y": 45},
    "C2": {"id": "C2", "name": "Travessia do Rio", "region": "central_plains", "terrain": "nebula", "neighbors": ["N2", "C1", "C3", "S2"], "x": 45, "y": 45},
    "C3": {"id": "C3", "name": "Ponte de Pedra", "region": "central_plains", "terrain": "trade_hub", "neighbors": ["C2", "C4", "I1"], "x": 60, "y": 48},
    "C4": {"id": "C4", "name": "Farol da Rota Antiga", "region": "central_plains", "terrain": "beacon", "neighbors": ["C3", "S3"], "x": 55, "y": 65},
    "S1": {"id": "S1", "name": "Colônia do Sol", "region": "sun_desert", "terrain": "solar_world", "neighbors": ["C1", "S2"], "x": 25, "y": 78},
    "S2": {"id": "S2", "name": "Cinturão Âmbar", "region": "sun_desert", "terrain": "asteroid_belt", "neighbors": ["S1", "C2", "S3"], "x": 42, "y": 82},
    "S3": {"id": "S3", "name": "Oásis Vermelho", "region": "sun_desert", "terrain": "oasis_station", "neighbors": ["S2", "C4", "I3"], "x": 60, "y": 85},
}

DEFAULT_REGIONS_RAW = {
    "northlands": {"id": "northlands", "name": "Fronteira Boreal", "bonus_troops": 2, "territory_ids": ["N1", "N2", "N3"]},
    "iron_coast": {"id": "iron_coast", "name": "Costa de Ferro", "bonus_troops": 2, "territory_ids": ["I1", "I2", "I3"]},
    "central_plains": {"id": "central_plains", "name": "Eixo Central", "bonus_troops": 3, "territory_ids": ["C1", "C2", "C3", "C4"]},
    "sun_desert": {"id": "sun_desert", "name": "Deserto do Sol", "bonus_troops": 2, "territory_ids": ["S1", "S2", "S3"]},
}


def load_default_map() -> tuple[dict[str, Territory], dict[str, Region]]:
    territories = {tid: Territory(**data) for tid, data in DEFAULT_TERRITORIES_RAW.items()}
    regions = {rid: Region(**data) for rid, data in DEFAULT_REGIONS_RAW.items()}
    validate_map_graph(territories)
    validate_regions(territories, regions)
    return territories, regions


def validate_map_graph(territories: dict[str, Territory]) -> None:
    if not territories:
        raise ValueError("Map must contain territories")
    seen, pending = set(), [next(iter(territories))]
    while pending:
        tid = pending.pop()
        if tid in seen:
            continue
        seen.add(tid)
        pending.extend(n for n in territories[tid].neighbors if n in territories and n not in seen)
    if len(seen) != len(territories):
        raise ValueError("Map graph is disconnected")
    for tid, territory in territories.items():
        for neighbor_id in territory.neighbors:
            if neighbor_id not in territories:
                raise ValueError(f"Territory {tid} has unknown neighbor {neighbor_id}")
            if tid not in territories[neighbor_id].neighbors:
                raise ValueError(f"Neighbor relationship {tid}<->{neighbor_id} is not symmetric")


def validate_regions(territories: dict[str, Territory], regions: dict[str, Region]) -> None:
    for rid, region in regions.items():
        for tid in region.territory_ids:
            if tid not in territories:
                raise ValueError(f"Region {rid} references unknown territory {tid}")
            if territories[tid].region != rid:
                raise ValueError(f"Territory {tid} region mismatch: {territories[tid].region} != {rid}")


# Original board: six regional blocks, each with six adjacent territories.
WORLD_REGIONS = [
    ("aurora", "Aurora", ["Alvorada", "Baía Fria", "Pinhal", "Lago Azul", "Terras Altas", "Cabo Norte"]),
    ("occidente", "Ocidente", ["Costa Verde", "Vale Longo", "Serra Clara", "Rios Unidos", "Planície Dourada", "Ponta Oeste"]),
    ("meridia", "Merídia", ["Ilha Branca", "Colinas", "Estreito", "Campo Central", "Vale do Sol", "Costa Sul"]),
    ("oriente", "Oriente", ["Montes Cinzentos", "Rio Antigo", "Passagem Alta", "Bosque Real", "Planície Oriental", "Porto Leste"]),
    ("sahara", "Sahara", ["Mar de Areia", "Pedra Vermelha", "Oásis", "Dunas", "Vale Seco", "Cabo Âmbar"]),
    ("austral", "Austral", ["Arquipélago", "Terra Nova", "Baía Serena", "Planícies Austrais", "Costa Coral", "Ilha do Sul"]),
]

def load_world_map() -> tuple[dict[str, Territory], dict[str, Region]]:
    territories = {}
    regions = {}
    for r, (rid, name, names) in enumerate(WORLD_REGIONS):
        ids = []
        for n, territory_name in enumerate(names):
            row, col = divmod(n, 3)
            tid = f"W{r * 6 + n + 1:02}"
            ids.append(tid)
            x, y = (r % 3) * 3 + col, (r // 3) * 2 + row
            neighbors = []
            for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < 9 and 0 <= ny < 4:
                    nr = (ny // 2) * 3 + nx // 3
                    nn = (ny % 2) * 3 + nx % 3
                    neighbors.append(f"W{nr * 6 + nn + 1:02}")
            territories[tid] = Territory(id=tid, name=territory_name, region=rid, terrain="land", neighbors=neighbors, x=x, y=y)
        regions[rid] = Region(id=rid, name=name, bonus_troops=3, territory_ids=ids)
    validate_map_graph(territories)
    validate_regions(territories, regions)
    return territories, regions


def load_geographic_map() -> tuple[dict[str, Territory], dict[str, Region]]:
    import json
    from pathlib import Path
    data = json.loads(Path(__file__).with_name("world_v2.json").read_text(encoding="utf-8"))
    territories = {item["id"]: Territory(**item) for item in data["territories"]}
    regions = {item["id"]: Region(**item) for item in data["regions"]}
    validate_map_graph(territories)
    validate_regions(territories, regions)
    return territories, regions

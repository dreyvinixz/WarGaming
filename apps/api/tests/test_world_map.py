from app.game_engine.map import load_world_map
from app.game_engine.reducer import start_match

def test_world_map_and_initial_distribution():
    territories, regions = load_world_map()
    assert len(territories) == 36 and len(regions) == 6
    assert len({(t.x, t.y) for t in territories.values()}) == 36
    assert {tid for r in regions.values() for tid in r.territory_ids} == set(territories)
    state = start_match(["A", "B"], map_id="atlas_world_v1", player_ids=["a", "b"])
    assert state.map_id == "atlas_world_v1"
    assert [sum(t.owner_id == p for t in state.territories.values()) for p in state.player_order] == [18, 18]

def test_legacy_default():
    state = start_match()
    assert state.map_id == "atlas_legacy_v1" and len(state.territories) == 13


def test_geographic_map_graph_and_geometry_correspond():
    import json
    from pathlib import Path
    from app.game_engine.map import load_geographic_map
    territories, regions = load_geographic_map()
    geometry_path = Path(__file__).resolve().parents[2] / "web/src/components/map/world_v2.json"
    geometry = json.loads(geometry_path.read_text(encoding="utf-8"))
    assert len(territories) == 36 and len(regions) == 6
    assert set(geometry) == set(territories)
    assert all(item["paths"] and all(path["d"] for path in item["paths"]) for item in geometry.values())
    assert all(182 <= item["x"] <= 902 and 114 <= item["y"] <= 634 for item in geometry.values())
    assert {tid for region in regions.values() for tid in region.territory_ids} == set(territories)
    state = start_match(["A", "B"], map_id="atlas_world_v2")
    assert state.map_version == 2 and len(state.territories) == 36
    assert all(region in state.regions for region in state.objectives["control_iron_and_sun"].params["regions"])

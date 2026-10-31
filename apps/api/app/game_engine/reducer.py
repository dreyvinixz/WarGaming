from __future__ import annotations

import random
from math import floor
from datetime import datetime, timedelta, timezone
from uuid import uuid4

from .combat import resolve_combat
from .map import load_default_map, load_world_map, load_geographic_map
from .objectives import check_objective_completed, controlled_regions, load_default_objectives
from .state import GameLogEntry, GamePhase, MatchState, Player
from .validators import (
    GameActionError,
    validate_attack_action,
    validate_current_player,
    validate_end_turn_action,
    validate_movement_action,
    validate_reinforcement_action,
)

PLAYER_COLORS = ["blue", "red", "green", "yellow"]
PHASE_TIMEOUT_SECONDS = 90


def _next_phase_deadline() -> datetime:
    return datetime.now(timezone.utc) + timedelta(seconds=PHASE_TIMEOUT_SECONDS)


def _log(state: MatchState, type_: str, player_id: str, message: str, payload: dict | None = None) -> None:
    state.action_log.append(GameLogEntry(type=type_, player_id=player_id, message=message, payload=payload or {}))


def calculate_reinforcement_pool(state: MatchState, player_id: str) -> int:
    owned_count = sum(1 for t in state.territories.values() if t.owner_id == player_id)
    base = max(3, floor(owned_count / 3))
    bonus = sum(state.regions[rid].bonus_troops for rid in controlled_regions(state, player_id))
    return base + bonus


def create_players(names: list[str], colors: list[str] | None = None) -> dict[str, Player]:
    players: dict[str, Player] = {}
    objectives = list(load_default_objectives().keys())
    for i, name in enumerate(names):
        pid = f"p{i + 1}"
        players[pid] = Player(
            id=pid,
            name=name,
            color=(colors[i] if colors and i < len(colors) else PLAYER_COLORS[i % len(PLAYER_COLORS)]),
            is_host=(i == 0),
            objective_id=objectives[i % len(objectives)],
        )
    return players


def start_match(player_names: list[str] | None = None, room_code: str = "TEST01", rng: random.Random | None = None, map_id: str = "atlas_legacy_v1", player_ids: list[str] | None = None, player_colors: list[str] | None = None) -> MatchState:
    player_names = player_names or ["Andrey", "Maria"]
    if not (2 <= len(player_names) <= 4):
        raise ValueError("Atlas War MVP requires 2 to 4 players")
    rng = rng or random.Random(7)
    if player_colors is not None and (len(player_colors) != len(player_names) or any(not color.startswith("#") or len(color) != 7 for color in player_colors)):
        raise ValueError("Invalid player colors")
    players = create_players(player_names, player_colors)
    if player_ids is not None:
        if len(player_ids) != len(player_names) or len(set(player_ids)) != len(player_ids):
            raise ValueError("Invalid player identities")
        players = {pid: player.model_copy_update(id=pid) for pid, player in zip(player_ids, players.values())}
    player_order = list(players.keys())
    if map_id not in ("atlas_legacy_v1", "atlas_world_v1", "atlas_world_v2"):
        raise ValueError("Unknown map")
    territories, regions = load_geographic_map() if map_id == "atlas_world_v2" else load_world_map() if map_id == "atlas_world_v1" else load_default_map()

    # Deterministic initial distribution designed to produce useful adjacent pairs in tests.
    tids = list(territories.keys())
    if len(player_order) == 2 and map_id == "atlas_legacy_v1":
        p1, p2 = player_order[0], player_order[1]
        p1_tids = ["N1", "N2", "C2", "C3", "S1", "S2"]
        for tid in tids:
            owner = p1 if tid in p1_tids else p2
            initial_troops = 2 if tid == "C1" else 1
            territories[tid] = territories[tid].model_copy_update(owner_id=owner, troops=initial_troops)
    else:
        shuffled = tids[:]
        rng.shuffle(shuffled)
        for index, tid in enumerate(shuffled):
            owner = player_order[index % len(player_order)]
            territories[tid] = territories[tid].model_copy_update(owner_id=owner, troops=1)

    current_player_id = player_order[0]
    state = MatchState(
        match_id=str(uuid4()),
        map_id=map_id,
        map_version=2 if map_id == "atlas_world_v2" else 1,
        room_code=room_code,
        current_player_id=current_player_id,
        players=players,
        player_order=player_order,
        territories=territories,
        regions=regions,
        objectives=load_default_objectives(),
        phase=GamePhase.REINFORCEMENT,
        phase_deadline_at=_next_phase_deadline(),
    )
    if map_id in ("atlas_world_v1", "atlas_world_v2"):
        state.objectives["control_7_territories"] = state.objectives["control_7_territories"].model_copy_update(
            title="Expansão", description="Controle pelo menos 24 territórios ao final do seu turno.", params={"count": 24})
        state.objectives["control_iron_and_sun"] = state.objectives["control_iron_and_sun"].model_copy_update(
            title="Domínio regional", description="Controle Aurora e Austral ao final do seu turno.", params={"regions": ["aurora", "austral"]})
    if map_id == "atlas_world_v2":
        state.objectives["control_iron_and_sun"] = state.objectives["control_iron_and_sun"].model_copy_update(
            description="Controle a América do Sul e a Oceania ao final do seu turno.", params={"regions": ["america_sul", "oceania"]})
    pool = calculate_reinforcement_pool(state, current_player_id)
    state.players[current_player_id] = state.players[current_player_id].model_copy_update(reinforcement_pool=pool)
    _log(state, "match_started", current_player_id, "A partida começou", {"room_code": room_code})
    _log(state, "turn_started", current_player_id, "Novo turno iniciado", {"round": state.round_number, "reinforcement_pool": pool})
    return state


def place_reinforcement(state: MatchState, player_id: str, territory_id: str, troops: int) -> MatchState:
    validate_reinforcement_action(state, player_id, territory_id, troops)
    new_state = state.model_copy(deep=True)
    territory = new_state.territories[territory_id]
    player = new_state.players[player_id]
    new_state.territories[territory_id] = territory.model_copy_update(troops=territory.troops + troops)
    new_state.players[player_id] = player.model_copy_update(reinforcement_pool=player.reinforcement_pool - troops)
    _log(new_state, "reinforcement", player_id, f"{troops} tropa(s) enviada(s) para {territory.name}", {"territory_id": territory_id, "troops": troops})
    return new_state


def advance_phase(state: MatchState, player_id: str) -> MatchState:
    validate_current_player(state, player_id)
    if state.phase == GamePhase.REINFORCEMENT:
        if state.players[player_id].reinforcement_pool > 0:
            raise GameActionError("You must place all reinforcement troops before advancing")
        next_phase = GamePhase.ATTACK
    elif state.phase == GamePhase.ATTACK:
        next_phase = GamePhase.MOVEMENT
    elif state.phase == GamePhase.MOVEMENT:
        return end_turn(state, player_id)
    else:
        raise GameActionError(f"Phase advance is not allowed in phase {state.phase.value}")
    new_state = state.model_copy(deep=True)
    new_state.phase = next_phase
    new_state.phase_deadline_at = _next_phase_deadline()
    _log(new_state, "phase_changed", player_id, f"Advanced to {next_phase.value}", {"phase": next_phase.value})
    return new_state


def _player_has_territories(state: MatchState, player_id: str) -> bool:
    return any(t.owner_id == player_id for t in state.territories.values())


def attack(state: MatchState, player_id: str, source_id: str, target_id: str, attacking_troops: int) -> MatchState:
    validate_attack_action(state, player_id, source_id, target_id, attacking_troops)
    new_state = state.model_copy(deep=True)
    source = new_state.territories[source_id]
    target = new_state.territories[target_id]
    defender_id = target.owner_id
    if defender_id is None:
        raise GameActionError("Cannot attack neutral territory")

    result = resolve_combat(attacking_troops, target.troops)
    if result.attacker_won:
        new_state.territories[source_id] = source.model_copy_update(troops=source.troops - attacking_troops)
        new_state.territories[target_id] = target.model_copy_update(owner_id=player_id, troops=attacking_troops)
        attacker = new_state.players[player_id]
        new_state.players[player_id] = attacker.model_copy_update(territories_conquered_this_turn=attacker.territories_conquered_this_turn + 1)
        _log(new_state, "attack_success", player_id, f"Território conquistado: {target.name}", result.model_dump() | {"source_id": source_id, "target_id": target_id})
        if not _player_has_territories(new_state, defender_id):
            defender = new_state.players[defender_id]
            new_state.players[defender_id] = defender.model_copy_update(eliminated=True)
            attacker = new_state.players[player_id]
            new_state.players[player_id] = attacker.model_copy_update(players_eliminated=attacker.players_eliminated + 1)
            _log(new_state, "player_eliminated", player_id, f"Eliminated {defender.name}", {"eliminated_player_id": defender_id})
    else:
        new_state.territories[source_id] = source.model_copy_update(troops=source.troops - attacking_troops)
        _log(new_state, "attack_failed", player_id, f"Ataque repelido em {target.name}", result.model_dump() | {"source_id": source_id, "target_id": target_id})
    return new_state


def move_troops(state: MatchState, player_id: str, source_id: str, target_id: str, troops: int) -> MatchState:
    validate_movement_action(state, player_id, source_id, target_id, troops)
    new_state = state.model_copy(deep=True)
    source = new_state.territories[source_id]
    target = new_state.territories[target_id]
    new_state.territories[source_id] = source.model_copy_update(troops=source.troops - troops)
    new_state.territories[target_id] = target.model_copy_update(troops=target.troops + troops)
    new_state.movement_used_this_turn = True
    _log(new_state, "troop_movement", player_id, f"{troops} tropa(s) movida(s)", {"source_id": source_id, "target_id": target_id, "troops": troops})
    return new_state


def _active_players(state: MatchState) -> list[str]:
    return [pid for pid in state.player_order if not state.players[pid].eliminated and _player_has_territories(state, pid)]


def _find_next_player(state: MatchState, current_player_id: str) -> tuple[str, bool]:
    order = state.player_order
    current_index = order.index(current_player_id)
    active = set(_active_players(state))
    if not active:
        return current_player_id, False
    for step in range(1, len(order) + 1):
        index = (current_index + step) % len(order)
        pid = order[index]
        if pid in active:
            return pid, index <= current_index
    return current_player_id, False


def end_turn(state: MatchState, player_id: str) -> MatchState:
    validate_end_turn_action(state, player_id)
    new_state = state.model_copy(deep=True)
    new_state.players[player_id] = new_state.players[player_id].model_copy_update(reinforcement_pool=0)
    _log(new_state, "turn_ended", player_id, "Turn ended", {"round": new_state.round_number})

    active = _active_players(new_state)
    if len(active) == 1:
        winner = active[0]
        new_state.phase = GamePhase.FINISHED
        new_state.status = "finished"
        new_state.winner_player_id = winner
        new_state.phase_deadline_at = None
        _log(new_state, "match_finished", winner, "Match finished: last faction standing", {"winner_player_id": winner})
        return new_state

    if check_objective_completed(new_state, player_id):
        new_state.phase = GamePhase.FINISHED
        new_state.status = "finished"
        new_state.winner_player_id = player_id
        new_state.phase_deadline_at = None
        _log(new_state, "match_finished", player_id, "Match finished: secret objective completed", {"winner_player_id": player_id})
        return new_state

    next_player_id, wrapped = _find_next_player(new_state, player_id)
    if wrapped:
        new_state.round_number += 1
    new_state.current_player_id = next_player_id
    new_state.phase = GamePhase.REINFORCEMENT
    new_state.phase_deadline_at = _next_phase_deadline()
    new_state.movement_used_this_turn = False
    pool = calculate_reinforcement_pool(new_state, next_player_id)
    new_state.players[next_player_id] = new_state.players[next_player_id].model_copy_update(
        reinforcement_pool=pool,
        territories_conquered_this_turn=0,
    )
    _log(new_state, "turn_started", next_player_id, "Novo turno iniciado", {"round": new_state.round_number, "reinforcement_pool": pool})
    return new_state


def timeout_phase(state: MatchState) -> MatchState:
    """Advance an expired phase and forfeit any reinforcement pool left unused."""
    if state.phase == GamePhase.FINISHED or state.phase_deadline_at is None:
        raise GameActionError("No active phase timer")
    deadline = state.phase_deadline_at
    if deadline.tzinfo is None:
        deadline = deadline.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) + timedelta(seconds=2) < deadline:
        raise GameActionError("Phase timer has not expired")

    player_id = state.current_player_id
    if state.phase == GamePhase.REINFORCEMENT:
        new_state = state.model_copy(deep=True)
        remaining = new_state.players[player_id].reinforcement_pool
        new_state.players[player_id] = new_state.players[player_id].model_copy_update(reinforcement_pool=0)
        if remaining:
            _log(new_state, "reinforcement_timeout", player_id, "Reforços não distribuídos foram perdidos", {"troops": remaining})
        state = new_state

    if state.phase == GamePhase.MOVEMENT:
        return end_turn(state, player_id)
    return advance_phase(state, player_id)

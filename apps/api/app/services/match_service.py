from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.models.match import Match
from app.game_engine.state import MatchState
from app.game_engine.validators import GameActionError

# Pure functions from the engine
from app.game_engine.reducer import (
    place_reinforcement,
    advance_phase,
    attack,
    move_troops,
    end_turn,
    timeout_phase,
)

def handle_player_action(db: Session, room_code: str, player_id: str, action_data: dict) -> dict:
    match = db.query(Match).filter(Match.room_id == room_code).first()
    if not match:
        raise ValueError("Match not found")

    # Deserialize pure game state
    current_state = MatchState(**match.state_json)

    if player_id not in current_state.players:
        raise ValueError("Player not found in this match")

    action_type = action_data.get("type")
    payload = action_data.get("payload", {})

    try:
        deadline = current_state.phase_deadline_at
        if deadline is not None and deadline.tzinfo is None:
            deadline = deadline.replace(tzinfo=timezone.utc)
        expired = deadline is not None and datetime.now(timezone.utc) >= deadline

        if action_type == "phase_timeout" and not expired:
            # A delayed/duplicate timeout request is harmless after another client advanced the phase.
            new_state = current_state
        elif action_type != "phase_timeout" and expired:
            # Enforce the deadline on the server even if the browser timer fires late.
            new_state = timeout_phase(current_state)
        elif action_type == "place_reinforcement":
            new_state = place_reinforcement(current_state, player_id, **payload)
        elif action_type == "advance_phase":
            new_state = advance_phase(current_state, player_id)
        elif action_type == "attack":
            new_state = attack(current_state, player_id, **payload)
        elif action_type == "move_troops":
            new_state = move_troops(current_state, player_id, **payload)
        elif action_type == "end_turn":
            new_state = end_turn(current_state, player_id)
        elif action_type == "phase_timeout":
            new_state = timeout_phase(current_state)
        else:
            raise ValueError(f"Unknown or forbidden action type: {action_type}")
    except (GameActionError, TypeError) as e:
        # Business logic validation failure from the engine
        raise ValueError(str(e))

    # Persist the new state
    new_state_json = new_state.model_dump(mode="json")
    match.state_json = new_state_json
    db.commit()

    return new_state_json


def state_for_player(state: dict, player_id: str) -> dict:
    """Strip all secret objectives other than the recipient's."""
    import copy
    visible = copy.deepcopy(state)
    own = visible["players"].get(player_id, {})
    objective_id = own.get("objective_id")
    visible["objectives"] = {key: value for key, value in visible.get("objectives", {}).items() if key == objective_id}
    for pid, player in visible["players"].items():
        if pid != player_id:
            player["objective_id"] = None
    return visible

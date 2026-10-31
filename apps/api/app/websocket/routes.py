from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.room import RoomPlayer
from app.models.match import Match
from app.websocket.manager import manager
from app.services import match_service

router = APIRouter(tags=["WebSocket"])

@router.websocket("/ws/rooms/{room_code}")
async def websocket_endpoint(websocket: WebSocket, room_code: str, token: str = "", db: Session = Depends(get_db)):
    room_code = room_code.upper()
    player = db.query(RoomPlayer).filter_by(room_id=room_code, token=token).first() if token else None
    if not player:
        await websocket.close(code=1008)
        return
    match = db.query(Match).filter_by(room_id=room_code).first()
    # Older persisted matches used engine IDs rather than room IDs.
    player_id = player.id
    if match and player_id not in match.state_json.get("players", {}):
        player_id = next((pid for pid, p in match.state_json["players"].items() if p["name"] == player.player_name), player_id)
    await manager.connect(websocket, room_code, player_id)
    if match:
        await manager.send_personal_message({"event": "match_state_updated", "state": match_service.state_for_player(match.state_json, player_id)}, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if not isinstance(data, dict) or data.get("type") not in ("place_reinforcement", "advance_phase", "attack", "move_troops", "end_turn") or not isinstance(data.get("payload", {}), dict):
                await manager.send_personal_message({"event": "action_rejected", "reason": "Unknown or forbidden action."}, websocket)
                continue
            try:
                state = match_service.handle_player_action(db, room_code, player_id, data)
                await manager.broadcast_state(state, room_code)
            except ValueError as exc:
                await manager.send_personal_message({"event": "action_rejected", "reason": str(exc)}, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, room_code)

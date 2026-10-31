from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, dict[WebSocket, str]] = {}

    async def connect(self, websocket: WebSocket, room_code: str, player_id: str):
        await websocket.accept()
        self.active_connections.setdefault(room_code, {})[websocket] = player_id

    def disconnect(self, websocket: WebSocket, room_code: str):
        connections = self.active_connections.get(room_code, {})
        connections.pop(websocket, None)
        if not connections:
            self.active_connections.pop(room_code, None)

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast_to_room(self, message: dict, room_code: str):
        for connection in list(self.active_connections.get(room_code, {})):
            await connection.send_json(message)

    async def broadcast_state(self, state: dict, room_code: str):
        from app.services.match_service import state_for_player
        for connection, player_id in list(self.active_connections.get(room_code, {}).items()):
            await connection.send_json({"event": "match_state_updated", "state": state_for_player(state, player_id)})

manager = ConnectionManager()

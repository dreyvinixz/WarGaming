import string
import random
from uuid import uuid4
from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.room import Room, RoomPlayer
from app.models.match import Match
from app.game_engine.reducer import start_match

def _generate_room_code(length=6) -> str:
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=length))

class RoomService:
    @classmethod
    def create_room(cls, db: Session, host_name: str, max_players: int = 6, map_id: str = "atlas_world_v2", color: str = "#CF3630") -> tuple[Room, RoomPlayer]:
        if map_id not in ("atlas_world_v1", "atlas_world_v2"):
            raise HTTPException(status_code=400, detail="Unknown map")
        room_code = _generate_room_code()
        
        # Ensure unique code
        while db.query(Room).filter(Room.id == room_code).first() is not None:
            room_code = _generate_room_code()
            
        new_room = Room(
            id=room_code,
            max_players=max_players,
            map_id=map_id,
            status="waiting"
        )
        db.add(new_room)
        
        host_player = RoomPlayer(
            id=str(uuid4()),
            room_id=room_code,
            player_name=host_name,
            is_host=True,
            token=str(uuid4()),
            color=color.upper(),
        )
        db.add(host_player)
        
        db.commit()
        db.refresh(new_room)
        db.refresh(host_player)
        
        return new_room, host_player

    @classmethod
    def list_waiting_rooms(cls, db: Session) -> list[Room]:
        return db.query(Room).filter(Room.status == "waiting").all()

    @classmethod
    def get_room(cls, db: Session, room_code: str) -> Room:
        room = db.query(Room).filter(Room.id == room_code).first()
        if not room:
            raise HTTPException(status_code=404, detail="Room not found")
        return room

    @classmethod
    def join_room(cls, db: Session, room_code: str, player_name: str, color: str = "#49A3D9") -> tuple[Room, RoomPlayer]:
        room = cls.get_room(db, room_code)
        
        if room.status != "waiting":
            raise HTTPException(status_code=400, detail="Room has already started")
            
        if len(room.players) >= room.max_players:
            raise HTTPException(status_code=400, detail="Room is full")
            
        if any(p.player_name == player_name for p in room.players):
            raise HTTPException(status_code=400, detail="Name already taken in this room")
            
        new_player = RoomPlayer(
            id=str(uuid4()),
            room_id=room_code,
            player_name=player_name,
            is_host=False,
            token=str(uuid4()),
            color=color.upper(),
        )
        db.add(new_player)
        db.commit()
        db.refresh(room)
        db.refresh(new_player)
        
        return room, new_player

    @classmethod
    def leave_waiting_room(cls, db: Session, room_code: str, token: str) -> None:
        room = cls.get_room(db, room_code)
        player = next ( (p for p in room.players if p.token == token), None )
        if not player:
            raise HTTPException(status_code=403, detail="Invalid player token")
        if room.status != "waiting":
            raise HTTPException(status_code=409, detail="Match has already started")
        remaining = [p for p in room.players if p.id != player.id]
        if not remaining:
            db.delete(room)
        else:
            if player.is_host:
                remaining[0].is_host = True
            db.delete(player)
        db.commit()

    @classmethod
    def start_match(cls, db: Session, room_code: str, player_token: str) -> str:
        room = cls.get_room(db, room_code)
        
        if room.status != "waiting":
            raise HTTPException(status_code=400, detail="Room is not in waiting state")
            
        if len(room.players) < 2:
            raise HTTPException(status_code=400, detail="Need at least 2 players to start")
            
        host = next((p for p in room.players if p.is_host), None)
        if not host or host.token != player_token:
            raise HTTPException(status_code=403, detail="Only the host can start the match")
            
        # Initialize pure game engine match state
        player_names = [p.player_name for p in room.players]
        match_state = start_match(player_names=player_names, room_code=room.id, map_id=room.map_id, player_ids=[p.id for p in room.players], player_colors=[p.color or "#49A3D9" for p in room.players])
        
        # Save Match state as JSON
        new_match = Match(
            id=match_state.match_id,
            room_id=room.id,
            state_json=match_state.model_dump(mode="json")
        )
        db.add(new_match)
        
        # Update room status
        room.status = "started"
        room.match_id = match_state.match_id
        
        db.commit()
        return match_state.match_id

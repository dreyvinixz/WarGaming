from pydantic import BaseModel, Field

class RoomCreateRequest(BaseModel):
    player_name: str = Field(..., min_length=2, max_length=20)
    max_players: int = Field(default=4, ge=2, le=4)
    map_id: str = Field(default="atlas_world_v2")
    color: str = Field(default="#CF3630", pattern=r"^#[0-9A-Fa-f]{6}$")

class RoomJoinRequest(BaseModel):
    player_name: str = Field(..., min_length=2, max_length=20)
    color: str = Field(default="#49A3D9", pattern=r"^#[0-9A-Fa-f]{6}$")

class PlayerResponse(BaseModel):
    id: str
    name: str
    is_host: bool
    color: str = "#49A3D9"

class RoomResponse(BaseModel):
    room_code: str
    status: str
    max_players: int
    map_id: str
    players: list[PlayerResponse]

class JoinResponse(BaseModel):
    room_code: str
    player_id: str
    player_token: str

class StartMatchResponse(BaseModel):
    match_id: str

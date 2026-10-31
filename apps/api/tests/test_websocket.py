import pytest
from fastapi.testclient import TestClient
from starlette.websockets import WebSocketDisconnect
from app.main import app
from app.database import Base, get_db
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

engine = create_engine("sqlite:///:memory:", connect_args={"check_same_thread": False}, poolclass=StaticPool)
SessionLocal = sessionmaker(bind=engine)

@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    previous = app.dependency_overrides.get(get_db)
    def override_db():
        with SessionLocal() as db:
            yield db
    app.dependency_overrides[get_db] = override_db
    yield
    if previous is None:
        app.dependency_overrides.pop(get_db, None)
    else:
        app.dependency_overrides[get_db] = previous
    Base.metadata.drop_all(bind=engine)

def test_authorization_reconnect_and_private_objectives():
    client = TestClient(app)
    host = client.post("/api/v1/rooms", json={"player_name": "P1"}).json()
    code = host["room_code"]
    guest = client.post(f"/api/v1/rooms/{code}/join", json={"player_name": "P2"}).json()
    assert client.post(f"/api/v1/rooms/{code}/start", headers={"Authorization": f"Bearer {guest['player_token']}"}).status_code == 403
    assert client.post(f"/api/v1/rooms/{code}/start", headers={"Authorization": f"Bearer {host['player_token']}"}).status_code == 200
    with pytest.raises(WebSocketDisconnect):
        with client.websocket_connect(f"/ws/rooms/{code}?player_name=P1"):
            pass
    with client.websocket_connect(f"/ws/rooms/{code}?token={host['player_token']}") as first:
        state = first.receive_json()["state"]
        assert len(state["territories"]) == 36
        assert len(state["objectives"]) == 1
        assert state["players"][guest["player_id"]]["objective_id"] is None
        own = next(t for t in state["territories"].values() if t["owner_id"] == host["player_id"])
        with client.websocket_connect(f"/ws/rooms/{code}?token={guest['player_token']}") as second:
            other = second.receive_json()["state"]
            assert other["players"][host["player_id"]]["objective_id"] is None
            second.send_json({"type": "place_reinforcement", "payload": {"territory_id": own["id"], "troops": 1}})
            assert second.receive_json()["event"] == "action_rejected"
            first.send_json({"type": "place_reinforcement", "payload": {"territory_id": own["id"], "troops": 1}})
            a, b = first.receive_json()["state"], second.receive_json()["state"]
            assert a["territories"][own["id"]]["troops"] == b["territories"][own["id"]]["troops"] == 2
    with client.websocket_connect(f"/ws/rooms/{code}?token={host['player_token']}") as reconnected:
        assert reconnected.receive_json()["state"]["territories"][own["id"]]["troops"] == 2

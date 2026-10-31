from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import health
from app.routers.rooms import router as rooms_router
from app.websocket import routes as websocket_routes

from contextlib import asynccontextmanager
from app.database import Base, engine
from sqlalchemy import inspect, text

@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    if "color" not in {column["name"] for column in inspect(engine).get_columns("room_players")}:
        with engine.begin() as connection:
            connection.execute(text("ALTER TABLE room_players ADD COLUMN color VARCHAR NOT NULL DEFAULT '#49A3D9'"))
    yield

app = FastAPI(
    title='Atlas War API',
    version='0.1.0',
    lifespan=lifespan
)

# Set up CORS. During local development Vite may be opened as either
# localhost or 127.0.0.1, so accept both forms without requiring a second
# manual environment change.
origins = {origin.strip() for origin in settings.cors_origins.split(',') if origin.strip()}
is_development = settings.app_env.lower() in {'dev', 'development', 'local'}
if is_development:
    origins.update({'http://localhost:5173', 'http://127.0.0.1:5173'})

app.add_middleware(
    CORSMiddleware,
    allow_origins=sorted(origins),
    allow_origin_regex=r'^https?://(localhost|127\.0\.0\.1)(:\d+)?$' if is_development else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix='/api/v1')
app.include_router(rooms_router, prefix='/api/v1')
app.include_router(websocket_routes.router)

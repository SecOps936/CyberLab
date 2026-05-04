import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from contextlib import asynccontextmanager
import os

from backend.core.config import settings
from backend.core.database import engine, Base
from backend.routers import auth, labs, users, tournament, staff, flags
from backend.services.scheduler import check_expired_sessions

# Import models to register them with SQLAlchemy
from backend.models.user import User
from backend.models.lab import Lab, LabSession
from backend.models.activity import Activity
from backend.models.badge import Badge
from backend.models.user_badge import UserBadge
from backend.models.tournament import Tournament, TournamentChallenge, TournamentParticipant, TournamentSubmission
from backend.models.tournament_flag import TournamentFlag, LabFlag  # Import from separate file

# Create uploads directory
os.makedirs("uploads/challenges", exist_ok=True)

# Create DB tables
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def startup_event(app: FastAPI):
    # Start scheduler
    task = asyncio.create_task(check_expired_sessions())
    yield
    # Cleanup if needed

app = FastAPI(lifespan=startup_event)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Session Middleware
app.add_middleware(SessionMiddleware, secret_key=settings.SECRET_KEY)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5175", "http://127.0.0.1:5175"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router)
app.include_router(labs.router)
app.include_router(users.router)
app.include_router(tournament.router)
app.include_router(staff.router)
app.include_router(flags.router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)

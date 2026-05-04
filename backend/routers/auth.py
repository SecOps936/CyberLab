from datetime import timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import httpx
from pydantic import BaseModel
import secrets
import hashlib

from backend.core.database import get_db
from backend.core.config import settings
from backend.core.security import create_access_token, get_current_user
from backend.models.user import User

router = APIRouter()

# ============ AUTH SCHEMAS ============
class UserRegister(BaseModel):
    username: str
    email: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

# ============ PASSWORD HASHING ============
def hash_password(password: str) -> str:
    """Simple password hashing"""
    salt = secrets.token_hex(16)
    return salt + ":" + hashlib.sha256((password + salt).encode()).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    """Verify password against hash"""
    if not hashed or ":" not in hashed:
        return False
    salt, hash_value = hashed.split(":")
    return hash_value == hashlib.sha256((password + salt).encode()).hexdigest()

# ============ REGISTER ENDPOINT ============
@router.post("/auth/register")
async def register_user(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user with username and password"""
    print(f" Registration attempt: {user_data.username}")

    existing_username = db.query(User).filter(User.username == user_data.username).first()
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")

    existing_email = db.query(User).filter(User.email == user_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    # Create new user with default role 'user'
    new_user = User(
        id=secrets.token_hex(8),
        username=user_data.username,
        email=user_data.email,
        xps=0,
        labs_completed=0,
        current_streak=0,
        longest_streak=0,
        auth_provider="local",
        joined_at=datetime.utcnow(),
        last_login=datetime.utcnow(),
        hashed_password=hash_password(user_data.password),
        role="user"  # Default role for regular users
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    print(f"User created: {new_user.username}, Role: {new_user.role}")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": new_user.id, "email": new_user.email, "username": new_user.username, "role": new_user.role},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "xps": new_user.xps,
            "labs_completed": new_user.labs_completed,
            "current_streak": new_user.current_streak,
            "avatar_url": new_user.avatar_url,
            "role": new_user.role  # Include role
        }
    }

# ============ LOGIN ENDPOINT ============
@router.post("/auth/login")
async def login_user(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login with username and password"""
    print(f"Login attempt: {user_data.username}")

    user = db.query(User).filter(User.username == user_data.username).first()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not user.hashed_password:
        raise HTTPException(status_code=401, detail="Use Google/GitHub login for this account")

    if not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    user.last_login = datetime.utcnow()
    db.commit()

    print(f" User logged in: {user.username}, Role: {user.role}")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "email": user.email, "username": user.username, "role": user.role},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "avatar_url": user.avatar_url,
            "xps": user.xps or 0,
            "labs_completed": user.labs_completed or 0,
            "current_streak": user.current_streak or 0,
            "role": user.role  # Include role
        }
    }

# ============ GET CURRENT USER ============
@router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user), db: Session = Depends(get_db)):
    """Get current user info"""
    user = db.query(User).filter(User.id == current_user.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "xps": user.xps or 0,
        "labs_completed": user.labs_completed or 0,
        "current_streak": user.current_streak or 0,
        "longest_streak": user.longest_streak or 0,
        "role": user.role  # Include role
    }

# ============ LOGOUT ============
@router.post("/auth/logout")
async def logout():
    """Logout endpoint"""
    return {"message": "Logged out successfully"}

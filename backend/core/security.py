from datetime import datetime, timedelta
from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from sqlalchemy.orm import Session

from backend.core.config import settings
from backend.core.database import get_db
from backend.models.user import User

security = HTTPBearer()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token for authentication"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Extract and validate JWT token from Authorization header
    Returns user information from the token
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the JWT token using the secret key
        payload = jwt.decode(credentials.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        username: str = payload.get("username")
        email: str = payload.get("email")
        role: str = payload.get("role", "user")

        if user_id is None:
            raise credentials_exception
        return {"sub": user_id, "username": username, "email": email, "role": role}
    except JWTError:
        raise credentials_exception

def get_current_user_object(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get the full User database object for the current user
    Returns the User model instance from database
    """
    current_user = get_current_user(credentials)
    user_id = current_user.get("sub")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

def get_current_staff_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get current user and verify they have staff/admin privileges
    Raises 403 Forbidden if user is not staff
    """
    # First get the token data
    current_user = get_current_user(credentials)
    user_id = current_user.get("sub")

    # Fetch full user from database to check role
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if user has staff role
    user_role = getattr(user, 'role', 'user')
    if user_role != 'staff':
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff access required"
        )

    return current_user

def get_current_staff_user_object(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    """
    Get the full User database object for staff/admin users only
    Returns User model instance for staff users
    """
    current_user = get_current_staff_user(credentials, db)
    user_id = current_user.get("sub")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return user

# ============ OAUTH SETUP FOR SOCIAL LOGIN ============
config_data = {
    "GOOGLE_CLIENT_ID": settings.GOOGLE_CLIENT_ID,
    "GOOGLE_CLIENT_SECRET": settings.GOOGLE_CLIENT_SECRET,
    "GITHUB_CLIENT_ID": settings.GITHUB_CLIENT_ID,
    "GITHUB_CLIENT_SECRET": settings.GITHUB_CLIENT_SECRET
}
starlette_config = Config(environ=config_data)

oauth = OAuth(starlette_config)

# Register Google OAuth provider
oauth.register(
    name='google',
    client_id=settings.GOOGLE_CLIENT_ID,
    client_secret=settings.GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={"scope": "openid email profile"}
)

# Register GitHub OAuth provider
oauth.register(
    name='github',
    client_id=settings.GITHUB_CLIENT_ID,
    client_secret=settings.GITHUB_CLIENT_SECRET,
    access_token_url='https://github.com/login/oauth/access_token',
    access_token_params=None,
    authorize_url='https://github.com/login/oauth/authorize',
    authorize_params=None,
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'}
)

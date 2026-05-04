from fastapi import FastAPI, Depends, HTTPException,Request,status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse,RedirectResponse
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, String, Integer, DateTime, ForeignKey, Boolean
# from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, relationship, Session
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.middleware.sessions import SessionMiddleware
from authlib.integrations.httpx_client import AsyncOAuth2Client
from uuid import uuid4
import docker
import random
# import datetime
import os
import asyncio
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from jose import jwt, JWTError
from datetime import datetime, timedelta
from typing import Optional
import httpx



load_dotenv()

app = FastAPI()

# Enable CORS (adjust origins as needed)
app.add_middleware(
    
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    
)


# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth settings
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")

security = HTTPBearer()

# Docker client
client = docker.from_env()
app.add_middleware(SessionMiddleware, secret_key=SECRET_KEY)


# ---------- Database Setup ----------
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./snowdenlabs.db")
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ---------- OAuth Setup ----------
config = Config(environ={
    "GOOGLE_CLIENT_ID": os.getenv("GOOGLE_CLIENT_ID"),
    "GOOGLE_CLIENT_SECRET": os.getenv("GOOGLE_CLIENT_SECRET"),
    "GITHUB_CLIENT_ID": os.getenv("GITHUB_CLIENT_ID"),
    "GITHUB_CLIENT_SECRET": os.getenv("GITHUB_CLIENT_SECRET")
})

oauth = OAuth(config)
oauth.register(
    name='google',
    client_id=config('GOOGLE_CLIENT_ID'),
    client_secret=config('GOOGLE_CLIENT_SECRET'),
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={"scope": "openid email profile"}
)
oauth.register(
    name='github',
    client_id=config('GITHUB_CLIENT_ID'),
    client_secret=config('GITHUB_CLIENT_SECRET'),
    access_token_url='https://github.com/login/oauth/access_token',
    access_token_params=None,
    authorize_url='https://github.com/login/oauth/authorize',
    authorize_params=None,
    api_base_url='https://api.github.com/',
    client_kwargs={'scope': 'user:email'}
)

# In-memory store for simplicity (replace with DB in prod)
# running_sessions = {}

# ---------- Database Models ----------


class OAuthCallback(BaseModel):
    code: str
    state: Optional[str] = None

class Token(BaseModel):
    access_token: str
    token_type: str

class Announcement(Base):
    __tablename__ = 'announcements'
    id = Column(String, primary_key=True, index=True)
    title= Column(String)
    content= Column(String)
    time = Column(String)
    type = Column(String)  # e.g., 'info', 'warning'
    url = Column(String, nullable=True)

class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String)
    auth_provider = Column(String)
    avatar_url= Column(String, nullable=True)
    labs_completed = Column(Integer, default=0)
    xps = Column(Integer, default=0)
    last_login = Column(DateTime, default=datetime.utcnow)
    joined_at = Column(DateTime, default=datetime.utcnow)
    auth_provider = Column(String, nullable=True)  # e.g., 'google', 'github'

class Lab(Base):
    __tablename__ = 'labs'
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    category = Column(String)
    difficulty = Column(String)
    time = Column(String)
    points = Column(Integer)
    participants = Column(Integer)
    description = Column(String)
    docker_image = Column(String)
    docker_port = Column(Integer, default=5200)
    tags = Column(String)  # stored as comma-separated string, or use relationship/JSON
    completed = Column(Boolean)
    featured = Column(Boolean)

class LabSession(Base):
    __tablename__ = 'lab_sessions'
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey('users.id'))
    lab_id = Column(String, ForeignKey('labs.id'))
    container_id = Column(String)
    port = Column(Integer)
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    status = Column(String, default='running')

Base.metadata.create_all(bind=engine)


# ---------- Pydantic Schemas ----------
class LabOut(BaseModel):
    id: str
    title: str
    description: str
    docker_image: str

    class Config:
        # orm_mode = True
        from_attributes = True

class LabCreate(BaseModel):
    id: str
    title: str
    category: str
    difficulty: str
    time: str
    points: int
    participants: int
    description: str
    docker_image: str
    port: int
    tags: list[str]
    completed: bool
    featured: bool

class AnnouncementCreate(BaseModel):
    id: str
    title: str
    content: str
    time :str
    type: str
    url: Optional[str] = None
# # Example lab list
# labs = [
#     Lab(
#         id=1,
#         title="SQL Injection",
#         category="Web Security",
#         difficulty="Intermediate",
#         time="30 minutes",
#         points=100,
#         participants=0,
#         description="Exploit a vulnerable login page.",
#         docker_image="sql-injection-lab:latest",
#         tags=["sql", "injection", "web"],
#         completed=False,
#         featured=True
#     ),
#     Lab(
#         id=2,
#         title="XSS Lab",
#         category="Web Security",
#         difficulty="Beginner",
#         time="20 minutes",
#         points=50,
#         participants=0,
#         description="Practice Cross Site Scripting.",
#         docker_image="xss-lab",
#         tags=["xss", "web", "security"],
#         completed=False,
#         featured=False
#     ),
# ]





    #Helper function to get the current user
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception



# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ---------- OAuth Routes ----------
@app.get("/auth/google")
async def google_login():
    """Initiate Google OAuth login"""
    client = AsyncOAuth2Client(
        GOOGLE_CLIENT_ID,
        redirect_uri="https://cyber.yit-agency.com/auth/callback/google"
    )
    
    authorization_url, state = client.create_authorization_url(
        "https://accounts.google.com/o/oauth2/auth",
        scope=["openid", "email", "profile"]
    )
    
    return {"authorization_url": authorization_url, "state": state}

@app.get("/auth/github")
async def github_login():
    """Initiate GitHub OAuth login"""
    client = AsyncOAuth2Client(
        GITHUB_CLIENT_ID,
        redirect_uri="https://cyber.yit-agency.com/auth/callback/github"
    )
    
    authorization_url, state = client.create_authorization_url(
        "https://github.com/login/oauth/authorize",
        scope=["user:email"]
    )
    
    return {"authorization_url": authorization_url, "state": state}

@app.post("/auth/callback/google")
async def google_callback(callback_data: OAuthCallback,db: Session = Depends(get_db)):
    """Handle Google OAuth callback"""
    print(callback_data.code)
 
    try:
        client = AsyncOAuth2Client(
            GOOGLE_CLIENT_ID,
            GOOGLE_CLIENT_SECRET,
            redirect_uri="https://cyber.yit-agency.com/auth/callback/google"
        )
        
        # Exchange code for token
        token = await client.fetch_token(
            "https://oauth2.googleapis.com/token",
            code=callback_data.code
        )
        try:
        # Get user info
            async with httpx.AsyncClient() as http_client:
                resp = await http_client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {token['access_token']}"}
                )
                print("User data from Google:", resp.json())
                user_data = resp.json()
        except Exception as e:
            print("Error fetching user data:", e)
            raise HTTPException(status_code=400, detail="Failed to fetch user data from Google")
        
        user = User(
            id=user_data["id"],
            email=user_data["email"],
            username=user_data["name"],
            avatar_url=user_data.get("picture"),
            auth_provider="google"
        )

         # print("User data from GitHub:", user.avatar_url)
        existing_user = db.query(User).filter(User.email == user.email).first()
        if not existing_user:
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user = existing_user
        
        # Create JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email, "provider": "google"},
            expires_delta=access_token_expires
        )
        print("sending current user:", user)
        return {"access_token": access_token, "token_type": "bearer", "user": user}
        
    except Exception as e:
        print("Error in Google callback:", e)
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/callback/github")
async def github_callback(callback_data: OAuthCallback,db: Session = Depends(get_db)):
    """Handle GitHub OAuth callback"""
    print(callback_data.code, callback_data.state)
    try:
        client = AsyncOAuth2Client(
            GITHUB_CLIENT_ID,
            GITHUB_CLIENT_SECRET,
            redirect_uri="https://cyber.yit-agency.com/auth/callback/github"
        )
        # print("GitHub callback received with code:", client)
        
        try:
        # Exchange code for token
            token = await client.fetch_token(
            "https://github.com/login/oauth/access_token",
            code=callback_data.code
            )
        except Exception as e:
            print("Error fetching token:", e)
            raise HTTPException(status_code=400, detail="Failed to fetch token from GitHub")
        
        # Get user info
        async with httpx.AsyncClient() as http_client:
            # Get user profile
            user_resp = await http_client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {token['access_token']}"}
            )
            user_data = user_resp.json()
            print("User data from GitHub:", user_data)

            
            # Get user email (might be private)
            email_resp = await http_client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {token['access_token']}"}
            )
            emails = email_resp.json()
            primary_email = next((email["email"] for email in emails if email["primary"]), None)
        
        user = User(
            id=str(user_data["id"]),
            email=primary_email or user_data.get("email", ""),
            username=user_data.get("name") or user_data["login"],
            avatar_url=user_data.get("avatar_url"),
            auth_provider="github"
        )

        # print("User data from GitHub:", user.avatar_url)
        existing_user = db.query(User).filter(User.email == user.email).first()
        if not existing_user:
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            user = existing_user
        # db.add(user)
        # db.commit()
        # db.refresh(user)
        
        # Create JWT token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": user.id, "email": user.email, "provider": "github"},
            expires_delta=access_token_expires
        )
        
        return {"access_token": access_token, "token_type": "bearer", "user": user}
        
    except Exception as e:
        print("Error in GitHub callback:", e)
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info"""
    return current_user

@app.post("/auth/logout")
async def logout():
    """Logout endpoint (client should remove token)"""
    return {"message": "Logged out successfully"}


@app.get("/labs")
def list_labs():
    db = SessionLocal()
    return db.query(Lab).all()
    # return labs

@app.put("/labs/start/{lab_id}")
def start_lab(lab_id: str,request: Request):
    user_id = request.session.get('user')
    # if not user_id:
    #     raise HTTPException(status_code=401, detail="Unauthorized")
    
    db = SessionLocal()
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    # lab = next((lab for lab in labs if lab.id == lab_id), None)
    # if not lab:
    #     raise HTTPException(status_code=404, detail="Lab not found")
   
    port = random.randint(30000, 40000)
    # container_name = f"lab-{lab.docker_image}-{uuid4().hex[:6]}"
    try:
        container = client.containers.run(
            image=lab.docker_image,
            name=lab.title.replace(" ", "-").lower() + "-" + uuid4().hex[:6],
            ports={"{lab.docker_port}": port},
            detach=True,
            labels={"lab": lab.title},
            auto_remove=True
        )
        lab.participants += 1
        db.commit()



           # Save session info (replace with DB insert)
        session_id = uuid4().hex
        session = LabSession(
        id=session_id,
        user_id=user_id,
        lab_id=lab.id,
        container_id=container.id,
        port=port,
        expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        db.add(session)
        db.commit() 
    except docker.errors.ContainerError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"session_id": session_id, "url": f"http://cyber.yit-agency.com:{port}", "expires_in": 3600}

@app.post("/labs/stop/{session_id}")
def stop_lab(session_id: str):
    db = SessionLocal()
    session = db.query(LabSession).filter(LabSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        container = client.containers.get(session.container_id)
        container.stop()
    except docker.errors.NotFound:
        pass

    session.status = 'stopped'
    db.commit()
    return {"message": "Lab stopped."}

@app.get("/labs/session/{session_id}")
def session_status(session_id: str):
    db = SessionLocal()
    session = db.query(LabSession).filter(LabSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "lab_id": session.lab_id,
        "port": session.port,
        "status": session.status,
        "expires_at": session.expires_at
    }


@app.post("/create-lab/", status_code=201)
def create_lab(lab: LabCreate, db: Session = Depends(get_db)):
    existing = db.query(Lab).filter(Lab.id == lab.id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Lab with this ID already exists")

    db_lab = Lab(
        id=lab.id,
        title=lab.title,
        category=lab.category,
        difficulty=lab.difficulty,
        time=lab.time,
        points=lab.points,
        participants=lab.participants,
        description=lab.description,
        docker_image=lab.docker_image,
        port=lab.port,
        tags=",".join(lab.tags),  # store as comma-separated string
        completed=lab.completed,
        featured=lab.featured,
    )

    db.add(db_lab)
    db.commit()
    db.refresh(db_lab)
    return {"message": "Lab created successfully", "lab_id": db_lab.id}


@app.get("/announcements")
def get_announcements():
    """Get all announcements"""
    pass

@app.get("/rankings")
def get_rankings():
    """Get user rankings based on XP"""
    db = SessionLocal()
    users = db.query(User).order_by(User.xps.desc()).all()
    return [{"username": user.username, "xps": user.xps,"avatar":user.avatar_url} for user in users]


# ---------- Background Scheduler ----------
async def check_expired_sessions():
    while True:
        db = SessionLocal()
        now = datetime.utcnow()
        expired = db.query(LabSession).filter(LabSession.expires_at < now, LabSession.status == 'running').all()
        for s in expired:
            try:
                container = client.containers.get(s.container_id)
                container.stop()
            except docker.errors.NotFound:
                pass
            s.status = 'expired'
        db.commit()
        await asyncio.sleep(60) 




@asynccontextmanager
async def startup_event(app: FastAPI):
    asyncio.create_task(check_expired_sessions())


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)

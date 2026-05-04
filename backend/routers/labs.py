from datetime import datetime, timedelta
from uuid import uuid4
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
import json

from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.models.lab import Lab, LabSession
from backend.models.user import User
from backend.schemas.lab import LabCreate, LabOut
from backend.services.docker_service import start_lab_container, stop_lab_container

router = APIRouter()

@router.get("/labs", response_model=list[LabOut])
def list_labs(db: Session = Depends(get_db)):
    """Get all available labs"""
    return db.query(Lab).all()

@router.get("/labs/{lab_id}", response_model=LabOut)
def get_lab_detail(lab_id: str, db: Session = Depends(get_db)):
    """Get details of a specific lab"""
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")
    return lab

@router.put("/labs/start/{lab_id}")
def start_lab(
    lab_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  #  FIXED: current_user is a DICT, not a User object
):
    """
    Start a lab container for the user
    Uses JWT token for authentication
    """
    # FIXED: Get user ID from dictionary using .get()
    user_id = current_user.get("sub")

    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid user authentication")

    # Find the lab
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    # Check if user already has an active session for this lab
    existing_session = db.query(LabSession).filter(
        LabSession.user_id == user_id,
        LabSession.lab_id == lab_id,
        LabSession.status == 'running'
    ).first()

    if existing_session:
        return {
            "session_id": existing_session.id,
            "url": f"http://127.0.0.1:{existing_session.port}",
            "expires_in": int((existing_session.expires_at - datetime.utcnow()).total_seconds()),
            "message": "Lab already running"
        }

    try:
        # Start the Docker container
        container_id, port = start_lab_container(lab)

        # Increment participants count
        lab.participants += 1
        db.commit()

        # Create session record
        session_id = uuid4().hex
        session = LabSession(
            id=session_id,
            user_id=user_id,
            lab_id=lab.id,
            container_id=container_id,
            port=port,
            expires_at=datetime.utcnow() + timedelta(hours=1),
            status='running'
        )
        db.add(session)
        db.commit()

        return {
            "session_id": session_id,
            "url": f"http://127.0.0.1:{port}",
            "expires_in": 3600,
            "container_id": container_id,
            "port": port
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start lab: {str(e)}")

@router.post("/labs/stop/{session_id}")
def stop_lab(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # FIXED: current_user is a DICT
):
    """Stop a running lab session"""
    session = db.query(LabSession).filter(LabSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # FIXED: Get user ID from dictionary
    user_id = current_user.get("sub")

    # Verify ownership
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to stop this lab")

    if session.status != 'running':
        return {"message": "Lab already stopped"}

    try:
        # Stop the Docker container
        stop_lab_container(session.container_id)

        # Update session status
        session.status = 'stopped'
        db.commit()

        return {"message": "Lab stopped successfully"}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to stop lab: {str(e)}")

@router.get("/labs/session/{session_id}")
def session_status(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # FIXED: current_user is a DICT
):
    """Get status of a lab session"""
    session = db.query(LabSession).filter(LabSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # FIXED: Get user ID from dictionary
    user_id = current_user.get("sub")

    # Verify ownership
    if session.user_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized")

    return {
        "lab_id": session.lab_id,
        "port": session.port,
        "status": session.status,
        "expires_at": session.expires_at,
        "remaining_seconds": int((session.expires_at - datetime.utcnow()).total_seconds()) if session.expires_at else 0
    }

@router.get("/labs/my/sessions")
def get_my_sessions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)  # FIXED: current_user is a DICT
):
    """Get all active lab sessions for the current user"""
    # FIXED: Get user ID from dictionary
    user_id = current_user.get("sub")

    sessions = db.query(LabSession).filter(
        LabSession.user_id == user_id,
        LabSession.status == 'running'
    ).all()

    return [
        {
            "session_id": s.id,
            "lab_id": s.lab_id,
            "port": s.port,
            "expires_at": s.expires_at,
            "remaining_seconds": int((s.expires_at - datetime.utcnow()).total_seconds()) if s.expires_at else 0
        }
        for s in sessions
    ]

@router.post("/create-lab/", status_code=201)
def create_lab(lab: LabCreate, db: Session = Depends(get_db)):
    """Create a new lab (admin only in production)"""
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
        docker_port=lab.docker_port,
        tags=",".join(lab.tags),
        completed=lab.completed,
        featured=lab.featured,
        long_description=lab.long_description,
        objectives=json.dumps(lab.objectives) if lab.objectives else None,
        prerequisites=json.dumps(lab.prerequisites) if lab.prerequisites else None,
        hints=json.dumps(lab.hints) if lab.hints else None,
        tools=json.dumps(lab.tools) if lab.tools else None,
        environment=lab.environment,
    )

    db.add(db_lab)
    db.commit()
    db.refresh(db_lab)
    return {"message": "Lab created successfully", "lab_id": db_lab.id}

# backend/routers/staff.py - COMPLETE FULL UPDATED CODE

import uuid
import os
import bcrypt
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Optional
import json

from backend.core.database import get_db
from backend.core.security import get_current_staff_user
from backend.models.tournament import Tournament, TournamentChallenge, TournamentParticipant, TournamentSubmission
from backend.models.tournament_flag import TournamentFlag
from backend.models.user import User
from backend.models.lab import Lab
from backend.models.lab import LabSession
from backend.models.lab_flag import LabFlag
from backend.schemas.lab import LabCreate

router = APIRouter(prefix="/staff", tags=["staff"])

# Helper function to hash flags
def hash_flag(flag: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(flag.encode('utf-8'), salt)
    return hashed.decode('utf-8')

# ============ VERIFY ENDPOINT ============

@router.get("/verify")
def verify_admin_access(current_user: dict = Depends(get_current_staff_user)):
    """Verify that the current user has admin access"""
    return {"verified": True, "user": current_user}

# ============ LABS ENDPOINTS ============

@router.get("/labs/all")
def get_all_labs(
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Get all labs for admin view"""
    labs = db.query(Lab).all()
    result = []
    for lab in labs:
        result.append({
            "id": lab.id,
            "title": lab.title,
            "category": lab.category,
            "difficulty": lab.difficulty,
            "points": lab.points,
            "participants": lab.participants or 0,
            "description": lab.description or ""
        })
    return result

@router.post("/labs/create")
def create_lab(
    lab_data: LabCreate,
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Create a new lab"""
    try:
        lab_id = lab_data.id or str(uuid.uuid4())

        new_lab = Lab(
            id=lab_id,
            title=lab_data.title,
            category=lab_data.category,
            difficulty=lab_data.difficulty,
            points=lab_data.points,
            description=lab_data.description,
            long_description=lab_data.long_description or lab_data.description,
            docker_image=lab_data.docker_image,
            docker_port=lab_data.docker_port,
            tags=','.join(lab_data.tags) if lab_data.tags else '',
            time=lab_data.time,
            participants=lab_data.participants,
            completed=lab_data.completed,
            featured=lab_data.featured,
            objectives=json.dumps(lab_data.objectives) if lab_data.objectives else None,
            prerequisites=json.dumps(lab_data.prerequisites) if lab_data.prerequisites else None,
            hints=json.dumps(lab_data.hints) if lab_data.hints else None,
            tools=json.dumps(lab_data.tools) if lab_data.tools else None,
            environment=lab_data.environment
        )
        db.add(new_lab)
        db.commit()
        return {"message": "Lab created successfully", "lab_id": new_lab.id}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/labs/{lab_id}")
def delete_lab(
    lab_id: str,
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Delete a lab"""
    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    # Delete lab sessions
    db.query(LabSession).filter(LabSession.lab_id == lab_id).delete()

    db.delete(lab)
    db.commit()

    return {"message": "Lab deleted successfully"}

@router.post("/labs/{lab_id}/flag")
def add_lab_flag(
    lab_id: str,
    request: dict,
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Add or update a flag for a lab"""
    flag_value = request.get("flag")
    if not flag_value:
        raise HTTPException(status_code=400, detail="Flag is required")

    lab = db.query(Lab).filter(Lab.id == lab_id).first()
    if not lab:
        raise HTTPException(status_code=404, detail="Lab not found")

    # Check if flag already exists for this lab
    existing_flag = db.query(LabFlag).filter(LabFlag.lab_id == lab_id).first()

    if existing_flag:
        # Update existing flag
        existing_flag.flag = flag_value
        existing_flag.flag_hash = hash_flag(flag_value)
        db.commit()
        return {"message": "Lab flag updated successfully"}
    else:
        # Create new flag
        flag_record = LabFlag(
            id=str(uuid.uuid4()),
            lab_id=lab_id,
            flag=flag_value,
            flag_hash=hash_flag(flag_value),
            is_active=True,
            created_at=datetime.utcnow(),
            created_by=current_user.get("sub")
        )
        db.add(flag_record)
        db.commit()
        return {"message": "Lab flag added successfully"}

# ============ USERS ENDPOINTS ============

@router.get("/users/all")
def get_all_users(
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Get all users for admin view"""
    users = db.query(User).all()
    result = []
    for user in users:
        total_xp = getattr(user, 'total_xp', None) or getattr(user, 'xps', 0)
        labs_completed = getattr(user, 'labs_completed', 0)
        joined_at = getattr(user, 'joined_at', None) or getattr(user, 'created_at', datetime.utcnow())

        result.append({
            "id": user.id,
            "username": user.username,
            "email": user.email,
            "role": user.role,
            "total_xp": total_xp,
            "labs_completed": labs_completed,
            "challenges_solved": 0,
            "joined_at": joined_at.isoformat() if joined_at else datetime.utcnow().isoformat()
        })
    return result

@router.get("/users/{user_id}/challenges")
def get_user_challenges(
    user_id: str,
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Get challenges solved by a specific user"""
    submissions = db.query(TournamentSubmission).filter(
        TournamentSubmission.user_id == user_id,
        TournamentSubmission.is_correct == True
    ).all()

    result = []
    for sub in submissions:
        challenge = db.query(TournamentChallenge).filter(
            TournamentChallenge.id == sub.challenge_id
        ).first()
        if challenge:
            result.append({
                "id": challenge.id,
                "title": challenge.title,
                "category": challenge.category,
                "points": challenge.points
            })
    return result

# ============ TOURNAMENT ENDPOINTS ============

@router.post("/tournaments/create")
def create_tournament(
    tournament_data: dict,
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Create a new tournament"""
    try:
        tournament_id = str(uuid.uuid4())

        start_date_str = tournament_data.get('start_date')
        end_date_str = tournament_data.get('end_date')

        start_date_str = start_date_str.replace('Z', '+00:00')
        end_date_str = end_date_str.replace('Z', '+00:00')

        start_date = datetime.fromisoformat(start_date_str)
        end_date = datetime.fromisoformat(end_date_str)

        new_tournament = Tournament(
            id=tournament_id,
            title=tournament_data.get('title'),
            description=tournament_data.get('description', 'Cybersecurity tournament'),
            start_date=start_date,
            end_date=end_date,
            prize_pool=tournament_data.get('prize_pool', 0),
            is_active=True,
            has_started=False,
            created_at=datetime.utcnow()
        )
        db.add(new_tournament)
        db.commit()

        return {"message": "Tournament created successfully", "tournament_id": tournament_id}
    except Exception as e:
        db.rollback()
        print(f"Error creating tournament: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/tournaments/{tournament_id}")
def delete_tournament(
    tournament_id: str,
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Delete a tournament and all associated data"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    # Delete submissions
    db.query(TournamentSubmission).filter(TournamentSubmission.tournament_id == tournament_id).delete()

    # Delete participants
    db.query(TournamentParticipant).filter(TournamentParticipant.tournament_id == tournament_id).delete()

    # Get challenges and delete flags
    challenges = db.query(TournamentChallenge).filter(TournamentChallenge.tournament_id == tournament_id).all()
    for challenge in challenges:
        db.query(TournamentFlag).filter(TournamentFlag.challenge_id == challenge.id).delete()

    # Delete challenges
    db.query(TournamentChallenge).filter(TournamentChallenge.tournament_id == tournament_id).delete()

    # Delete tournament
    db.delete(tournament)
    db.commit()

    return {"message": "Tournament deleted successfully"}

@router.delete("/tournaments/challenges/{challenge_id}")
def delete_challenge(
    challenge_id: str,
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Delete a challenge and its flag"""
    challenge = db.query(TournamentChallenge).filter(TournamentChallenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")

    # Delete submissions
    db.query(TournamentSubmission).filter(TournamentSubmission.challenge_id == challenge_id).delete()

    # Delete flag
    db.query(TournamentFlag).filter(TournamentFlag.challenge_id == challenge_id).delete()

    # Delete challenge
    db.delete(challenge)
    db.commit()

    return {"message": "Challenge deleted successfully"}

@router.get("/tournaments/active")
def get_active_tournament_admin(
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Get active tournament for admin view"""
    # Get the most recent tournament (any status)
    tournament = db.query(Tournament).filter(
        Tournament.is_active == True
    ).order_by(Tournament.created_at.desc()).first()

    if not tournament:
        return None

    total_participants = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament.id
    ).count()

    total_submissions = db.query(TournamentSubmission).filter(
        TournamentSubmission.tournament_id == tournament.id
    ).count()

    correct_submissions = db.query(TournamentSubmission).filter(
        TournamentSubmission.tournament_id == tournament.id,
        TournamentSubmission.is_correct == True
    ).count()

    return {
        "tournament": {
            "id": tournament.id,
            "title": tournament.title,
            "description": tournament.description,
            "start_date": tournament.start_date.isoformat(),
            "end_date": tournament.end_date.isoformat(),
            "prize_pool": tournament.prize_pool,
            "has_started": tournament.has_started,
            "is_active": tournament.is_active
        },
        "stats": {
            "total_participants": total_participants,
            "total_submissions": total_submissions,
            "correct_submissions": correct_submissions,
            "success_rate": round((correct_submissions / total_submissions * 100) if total_submissions > 0 else 0, 2)
        }
    }

@router.post("/tournaments/{tournament_id}/start")
def start_tournament(
    tournament_id: str,
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Start a tournament"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    tournament.has_started = True
    db.commit()

    return {"message": "Tournament started successfully", "has_started": True}

@router.post("/tournaments/{tournament_id}/extend")
def extend_tournament(
    tournament_id: str,
    request: dict,
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Extend tournament end date"""
    tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")

    new_end_date_str = request.get('new_end_date').replace('Z', '+00:00')
    new_end_date = datetime.fromisoformat(new_end_date_str)
    tournament.end_date = new_end_date
    db.commit()

    return {"message": "Tournament extended successfully", "new_end_date": new_end_date.isoformat()}

@router.post("/tournaments/challenges_with_file")
async def create_tournament_challenge_with_file(
    tournament_id: str = Form(...),
    title: str = Form(...),
    category: str = Form(...),
    difficulty: str = Form(...),
    points: int = Form(...),
    description: str = Form(...),
    objectives: str = Form(...),
    flag: str = Form(...),
    author_name: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Create a tournament challenge with optional file and author name"""
    try:
        tournament = db.query(Tournament).filter(Tournament.id == tournament_id).first()
        if not tournament:
            raise HTTPException(status_code=404, detail="Tournament not found")

        challenge_id = str(uuid.uuid4())

        file_url = None
        file_name = None
        if file:
            os.makedirs("uploads/challenges", exist_ok=True)
            file_path = f"uploads/challenges/{challenge_id}_{file.filename}"
            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)
            file_url = f"/uploads/challenges/{challenge_id}_{file.filename}"
            file_name = file.filename

        order_count = db.query(TournamentChallenge).filter(
            TournamentChallenge.tournament_id == tournament_id
        ).count()

        challenge = TournamentChallenge(
            id=challenge_id,
            tournament_id=tournament_id,
            title=title,
            category=category,
            difficulty=difficulty,
            points=points,
            description=description,
            objectives=objectives,
            author_name=author_name or "Admin",  # FIXED: Save author_name to database
            file_url=file_url,
            file_name=file_name,
            order=order_count,
            created_at=datetime.utcnow()
        )
        db.add(challenge)
        db.flush()

        flag_record = TournamentFlag(
            id=str(uuid.uuid4()),
            challenge_id=challenge_id,
            flag=flag,
            flag_hash=hash_flag(flag),
            is_active=True,
            created_at=datetime.utcnow(),
            created_by=current_user.get("sub")
        )
        db.add(flag_record)
        db.commit()

        return {
            "message": "Challenge created successfully",
            "challenge_id": challenge_id,
            "file_url": file_url
        }
    except Exception as e:
        db.rollback()
        print(f"Error creating challenge: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/tournament/challenges")
def get_tournament_challenges_admin(
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Get all tournament challenges for admin view (including flags)"""
    tournament = db.query(Tournament).filter(
        Tournament.is_active == True
    ).order_by(Tournament.created_at.desc()).first()

    if not tournament:
        return []

    challenges = db.query(TournamentChallenge).filter(
        TournamentChallenge.tournament_id == tournament.id
    ).all()

    result = []
    for challenge in challenges:
        flag_record = db.query(TournamentFlag).filter(
            TournamentFlag.challenge_id == challenge.id
        ).first()

        objectives = challenge.objectives
        if isinstance(objectives, str):
            try:
                objectives = json.loads(objectives)
            except:
                objectives = [objectives] if objectives else []
        elif objectives is None:
            objectives = []

        result.append({
            "id": challenge.id,
            "title": challenge.title,
            "category": challenge.category,
            "difficulty": challenge.difficulty,
            "points": challenge.points,
            "description": challenge.description,
            "objectives": objectives,
            "author_name": "Admin",
            "flag": flag_record.flag if flag_record else None,
            "file_url": challenge.file_url,
            "file_name": challenge.file_name
        })

    return result

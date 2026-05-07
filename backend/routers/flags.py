# backend/routers/flags.py - Fixed for your database schema

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import uuid4
from datetime import datetime
from pydantic import BaseModel
import bcrypt
import json

from backend.core.database import get_db
from backend.core.security import get_current_user, get_current_staff_user
from backend.models.user import User
from backend.models.activity import Activity
from backend.models.tournament import Tournament, TournamentChallenge, TournamentSubmission, TournamentParticipant
from backend.models.tournament_flag import TournamentFlag
from backend.models.lab_flag import LabFlag
from backend.models.lab import Lab

router = APIRouter(prefix="/flags", tags=["flag_verification"])

class FlagSubmit(BaseModel):
    challenge_id: str
    flag: str

def verify_flag(submitted_flag: str, stored_hash: str) -> bool:
    try:
        return bcrypt.checkpw(submitted_flag.encode('utf-8'), stored_hash.encode('utf-8'))
    except:
        return False

@router.post("/submit/tournament")
def submit_tournament_flag(
    submit_data: FlagSubmit,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"correct": False, "message": "User not found"}

    challenge = db.query(TournamentChallenge).filter(
        TournamentChallenge.id == submit_data.challenge_id
    ).first()
    if not challenge:
        return {"correct": False, "message": "Challenge not found"}

    tournament = db.query(Tournament).filter(
        Tournament.id == challenge.tournament_id,
        Tournament.is_active == True
    ).first()

    if not tournament or tournament.end_date < datetime.utcnow():
        return {"correct": False, "message": "Tournament has ended!"}

    if tournament.start_date > datetime.utcnow():
        return {"correct": False, "message": "Tournament hasn't started yet!"}

    if not tournament.has_started:
        return {"correct": False, "message": "Tournament hasn't started yet!"}

    existing = db.query(TournamentSubmission).filter(
        TournamentSubmission.challenge_id == submit_data.challenge_id,
        TournamentSubmission.user_id == user_id,
        TournamentSubmission.is_correct == True
    ).first()

    if existing:
        return {"correct": False, "message": "You already solved this challenge!"}

    flag_record = db.query(TournamentFlag).filter(
        TournamentFlag.challenge_id == submit_data.challenge_id,
        TournamentFlag.is_active == True
    ).first()

    if not flag_record:
        return {"correct": False, "message": "No flag configured for this challenge"}

    # Use the flag_hash column for verification
    if flag_record.flag_hash and verify_flag(submit_data.flag.strip(), flag_record.flag_hash):
        points_earned = challenge.points

        submission = TournamentSubmission(
            id=uuid4().hex,
            tournament_id=challenge.tournament_id,
            challenge_id=challenge.id,
            user_id=user_id,
            is_correct=True,
            points_earned=points_earned,
            submitted_at=datetime.utcnow()
        )
        db.add(submission)

        participant = db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == challenge.tournament_id,
            TournamentParticipant.user_id == user_id
        ).first()

        if participant:
            participant.total_score += points_earned
            participant.last_active = datetime.utcnow()
        else:
            participant = TournamentParticipant(
                id=f"{challenge.tournament_id}_{user_id}",
                tournament_id=challenge.tournament_id,
                user_id=user_id,
                total_score=points_earned,
                joined_at=datetime.utcnow(),
                last_active=datetime.utcnow()
            )
            db.add(participant)

        db.commit()

        return {
            "correct": True,
            "message": f"Correct! You earned {points_earned} points!",
            "points": points_earned
        }
    else:
        return {"correct": False, "message": "Incorrect flag! Try again."}

@router.post("/submit/lab")
def submit_lab_flag(
    submit_data: FlagSubmit,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"correct": False, "message": "User not found"}

    lab = db.query(Lab).filter(Lab.id == submit_data.challenge_id).first()
    if not lab:
        return {"correct": False, "message": "Lab not found"}

    flag_record = db.query(LabFlag).filter(
        LabFlag.lab_id == submit_data.challenge_id,
        LabFlag.is_active == True
    ).first()

    if not flag_record:
        return {"correct": False, "message": "No flag configured for this lab"}

    # Use the flag_hash column for verification
    if flag_record.flag_hash and verify_flag(submit_data.flag.strip(), flag_record.flag_hash):
        # Award points to user
        points_earned = lab.points
        user.total_xp = (user.total_xp or 0) + points_earned
        user.labs_completed = (user.labs_completed or 0) + 1

        # Create activity record
        activity = Activity(
            id=uuid4().hex,
            user_id=user_id,
            activity_type="lab_completion",
            description=f"Completed lab: {lab.title}",
            points_earned=points_earned,
            metadata=json.dumps({"lab_id": lab.id, "lab_title": lab.title}),
            created_at=datetime.utcnow()
        )
        db.add(activity)

        db.commit()

        return {
            "correct": True,
            "message": f"Correct! You earned {points_earned} points!",
            "points": points_earned
        }
    else:
        return {"correct": False, "message": "Incorrect flag! Try again."}

@router.get("/admin/flags")
def get_all_flags(
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Get all tournament flags for admin view - using actual database columns"""
    flags_data = []

    tournament_flags = db.query(TournamentFlag).filter(
        TournamentFlag.is_active == True
    ).all()

    for tf in tournament_flags:
        challenge = db.query(TournamentChallenge).filter(
            TournamentChallenge.id == tf.challenge_id
        ).first()
        if challenge:
            # Use 'flag' column instead of 'flag_plaintext' (your schema uses 'flag')
            flag_value = getattr(tf, 'flag', 'No flag stored')
            flags_data.append({
                "id": tf.id,
                "challenge_id": tf.challenge_id,
                "challenge_title": challenge.title,
                "challenge_type": "tournament",
                "flag": flag_value,
                "created_at": tf.created_at
            })

    return flags_data

@router.put("/admin/flags/{flag_id}")
def update_flag(
    flag_id: str,
    request: dict,
    current_user: dict = Depends(get_current_staff_user),
    db: Session = Depends(get_db)
):
    """Update an existing flag"""
    new_flag = request.get("flag")
    if not new_flag:
        raise HTTPException(status_code=400, detail="Flag is required")

    flag_record = db.query(TournamentFlag).filter(
        TournamentFlag.id == flag_id
    ).first()

    if not flag_record:
        raise HTTPException(status_code=404, detail="Flag not found")

    salt = bcrypt.gensalt()
    flag_record.flag = new_flag  # Use 'flag' column
    flag_record.flag_hash = bcrypt.hashpw(new_flag.encode('utf-8'), salt).decode('utf-8')

    db.commit()
    return {"message": "Flag updated successfully", "flag_id": flag_id}

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc
from datetime import datetime, timedelta
import json

from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.models.tournament import Tournament, TournamentChallenge, TournamentParticipant, TournamentSubmission
from backend.models.user import User

router = APIRouter(prefix="/tournament", tags=["tournament"])

@router.get("/active")
def get_active_tournament(db: Session = Depends(get_db)):
    now = datetime.utcnow()

    # Check for active tournament (started, not ended)
    tournament = db.query(Tournament).filter(
        Tournament.is_active == True,
        Tournament.has_started == True,
        Tournament.start_date <= now,
        Tournament.end_date >= now
    ).first()

    # Check for upcoming tournament
    upcoming = db.query(Tournament).filter(
        Tournament.is_active == True,
        Tournament.has_started == False,
        Tournament.start_date > now
    ).order_by(Tournament.start_date).first()

    # Check for ended tournament (past end_date) - for leaderboard display
    ended = db.query(Tournament).filter(
        Tournament.is_active == True,
        Tournament.has_started == True,
        Tournament.end_date < now
    ).order_by(Tournament.end_date.desc()).first()

    if not tournament and not upcoming and not ended:
        return {
            "id": None,
            "title": "No Active Tournament",
            "description": "Check back soon for new tournaments!",
            "start_date": now.isoformat(),
            "end_date": (now + timedelta(days=7)).isoformat(),
            "prize_pool": 0,
            "total_participants": 0,
            "total_challenges": 0,
            "status": "no_tournament"
        }

    if upcoming and not tournament:
        return {
            "id": upcoming.id,
            "title": upcoming.title,
            "description": upcoming.description,
            "start_date": upcoming.start_date.isoformat(),
            "end_date": upcoming.end_date.isoformat(),
            "prize_pool": upcoming.prize_pool,
            "total_participants": 0,
            "total_challenges": db.query(TournamentChallenge).filter(
                TournamentChallenge.tournament_id == upcoming.id
            ).count(),
            "status": "upcoming",
            "time_until_start": int((upcoming.start_date - now).total_seconds()) if upcoming.start_date > now else 0
        }

    if ended and not tournament:
        return {
            "id": ended.id,
            "title": ended.title,
            "description": ended.description,
            "start_date": ended.start_date.isoformat(),
            "end_date": ended.end_date.isoformat(),
            "prize_pool": ended.prize_pool,
            "total_participants": db.query(TournamentParticipant).filter(
                TournamentParticipant.tournament_id == ended.id
            ).count(),
            "total_challenges": db.query(TournamentChallenge).filter(
                TournamentChallenge.tournament_id == ended.id
            ).count(),
            "status": "ended",
            "time_left": 0
        }

    return {
        "id": tournament.id,
        "title": tournament.title,
        "description": tournament.description,
        "start_date": tournament.start_date.isoformat(),
        "end_date": tournament.end_date.isoformat(),
        "prize_pool": tournament.prize_pool,
        "total_participants": db.query(TournamentParticipant).filter(
            TournamentParticipant.tournament_id == tournament.id
        ).count(),
        "total_challenges": db.query(TournamentChallenge).filter(
            TournamentChallenge.tournament_id == tournament.id
        ).count(),
        "status": "active",
        "time_left": int((tournament.end_date - now).total_seconds())
    }

@router.get("/challenges")
def get_tournament_challenges(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    now = datetime.utcnow()

    # Only show challenges if tournament is active (has_started AND not ended)
    tournament = db.query(Tournament).filter(
        Tournament.is_active == True,
        Tournament.has_started == True,
        Tournament.start_date <= now,
        Tournament.end_date >= now  # Must not be ended
    ).first()

    # If tournament is ended, return empty challenges (don't show them)
    if not tournament:
        return []

    challenges = db.query(TournamentChallenge).filter(
        TournamentChallenge.tournament_id == tournament.id
    ).order_by(TournamentChallenge.order).all()

    result = []
    for challenge in challenges:
        # Check if current user has solved this challenge
        user_solved = db.query(TournamentSubmission).filter(
            TournamentSubmission.challenge_id == challenge.id,
            TournamentSubmission.user_id == user_id,
            TournamentSubmission.is_correct == True
        ).first() is not None

        # Get total number of solves by all users
        total_solved = db.query(TournamentSubmission).filter(
            TournamentSubmission.challenge_id == challenge.id,
            TournamentSubmission.is_correct == True
        ).count()

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
            "solved": total_solved,
            "solved_by_user": user_solved,
            "description": challenge.description,
            "objectives": objectives,
            "author_name": challenge.author_name or "Admin",
            "file_url": challenge.file_url,
            "file_name": challenge.file_name,
            "status": "completed" if user_solved else "available"
        })
    return result

@router.get("/leaderboard")
def get_tournament_leaderboard(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    now = datetime.utcnow()

    # Get the most recent tournament (active or ended)
    tournament = db.query(Tournament).filter(
        Tournament.is_active == True,
        Tournament.has_started == True
    ).order_by(Tournament.created_at.desc()).first()

    if not tournament:
        return []

    # Get all participants with their submissions
    participants_data = db.query(
        TournamentParticipant, User.username, User.avatar_url
    ).join(
        User, TournamentParticipant.user_id == User.id
    ).filter(
        TournamentParticipant.tournament_id == tournament.id
    ).all()

    # Build ranking list with earliest submission time for tie-breaking
    ranking = []
    for participant, username, avatar_url in participants_data:
        # Get the earliest submission time for this user
        earliest_submission = db.query(TournamentSubmission).filter(
            TournamentSubmission.tournament_id == tournament.id,
            TournamentSubmission.user_id == participant.user_id,
            TournamentSubmission.is_correct == True
        ).order_by(asc(TournamentSubmission.submitted_at)).first()

        ranking.append({
            "user_id": participant.user_id,
            "username": username,
            "score": participant.total_score,
            "avatar_url": avatar_url,
            "first_submission_time": earliest_submission.submitted_at if earliest_submission else None
        })

    # Sort: by score DESC, then by first_submission_time ASC
    ranking.sort(key=lambda x: (-x["score"], x["first_submission_time"] if x["first_submission_time"] else datetime.max))

    # Add rank numbers
    result = []
    for idx, player in enumerate(ranking):
        result.append({
            "rank": idx + 1,
            "name": player["username"],
            "score": player["score"],
            "avatar": (player["avatar_url"][:2].upper() if player["avatar_url"] else player["username"][:2].upper()),
            "country": "US",
            "streak": 0
        })

    return result[:limit]

@router.get("/stats")
def get_tournament_stats(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    now = datetime.utcnow()

    # Get the most recent tournament (active or ended)
    tournament = db.query(Tournament).filter(
        Tournament.is_active == True,
        Tournament.has_started == True
    ).order_by(Tournament.created_at.desc()).first()

    if not tournament:
        return {
            "total_participants": 0,
            "challenges_solved": 0,
            "total_challenges": 0,
            "prize_pool": 0,
            "your_rank": 0
        }

    total_participants = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament.id
    ).count()

    # Count ONLY challenges solved by the CURRENT USER
    user_solved_count = db.query(TournamentSubmission).filter(
        TournamentSubmission.tournament_id == tournament.id,
        TournamentSubmission.user_id == user_id,
        TournamentSubmission.is_correct == True
    ).count()

    # Total challenges in tournament
    total_challenges = db.query(TournamentChallenge).filter(
        TournamentChallenge.tournament_id == tournament.id
    ).count()

    # Calculate user's rank with tie-breaking by submission time
    all_participants = db.query(
        TournamentParticipant, User.username
    ).join(
        User, TournamentParticipant.user_id == User.id
    ).filter(
        TournamentParticipant.tournament_id == tournament.id
    ).all()

    user_scores = []
    for participant, username in all_participants:
        earliest_sub = db.query(TournamentSubmission).filter(
            TournamentSubmission.tournament_id == tournament.id,
            TournamentSubmission.user_id == participant.user_id,
            TournamentSubmission.is_correct == True
        ).order_by(asc(TournamentSubmission.submitted_at)).first()

        user_scores.append({
            "user_id": participant.user_id,
            "score": participant.total_score,
            "first_submission_time": earliest_sub.submitted_at if earliest_sub else None
        })

    user_scores.sort(key=lambda x: (-x["score"], x["first_submission_time"] if x["first_submission_time"] else datetime.max))

    your_rank = 1
    for idx, us in enumerate(user_scores):
        if us["user_id"] == user_id:
            your_rank = idx + 1
            break

    # Check if tournament is ended
    is_ended = tournament.end_date < now

    return {
        "total_participants": total_participants,
        "challenges_solved": user_solved_count,
        "total_challenges": total_challenges,
        "prize_pool": tournament.prize_pool,
        "your_rank": your_rank,
        "is_ended": is_ended  # NEW: Tell frontend if tournament ended
    }

@router.post("/join")
def join_tournament(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_id = current_user.get("sub")
    now = datetime.utcnow()

    # Can only join active tournament (started and not ended)
    tournament = db.query(Tournament).filter(
        Tournament.is_active == True,
        Tournament.has_started == True,
        Tournament.start_date <= now,
        Tournament.end_date >= now
    ).first()

    if not tournament:
        raise HTTPException(status_code=404, detail="No active tournament found")

    existing = db.query(TournamentParticipant).filter(
        TournamentParticipant.tournament_id == tournament.id,
        TournamentParticipant.user_id == user_id
    ).first()
    if existing:
        return {"message": "Already joined", "joined": True}

    participant = TournamentParticipant(
        id=f"{tournament.id}_{user_id}",
        tournament_id=tournament.id,
        user_id=user_id,
        total_score=0,
        joined_at=datetime.utcnow(),
        last_active=datetime.utcnow()
    )
    db.add(participant)
    db.commit()
    return {"message": "Joined tournament successfully", "joined": True}

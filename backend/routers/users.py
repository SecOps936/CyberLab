from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from datetime import datetime
from typing import List

from backend.core.database import get_db
from backend.core.security import get_current_user
from backend.models.user import User
from backend.models.activity import Activity
from backend.models.badge import Badge
from backend.models.user_badge import UserBadge
from backend.services.activity_service import get_recent_activities, format_time_ago
from backend.schemas.activity import ActivityResponse
from backend.schemas.badge import BadgeResponse

router = APIRouter()

@router.get("/announcements")
def get_announcements():
    """Get all announcements"""
    return []  # Placeholder - can be expanded later

@router.get("/rankings")
def get_rankings(db: Session = Depends(get_db)):
    """Get user rankings based on XP"""
    users = db.query(User).order_by(User.xps.desc()).all()
    return [{"username": user.username, "xp": user.xps, "avatar": user.avatar_url} for user in users]

@router.get("/leaderboard")
def get_leaderboard(
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """Get global leaderboard with real XP totals from activities"""

    # Get all users with their total XP from activities
    leaderboard_data = db.query(
        User.id,
        User.username,
        User.avatar_url,
        func.coalesce(func.sum(Activity.xp_gained), 0).label('total_xp')
    ).outerjoin(
        Activity, User.id == Activity.user_id
    ).group_by(
        User.id
    ).order_by(
        desc('total_xp')
    ).limit(limit).all()

    leaderboard = []
    for idx, (user_id, username, avatar_url, total_xp) in enumerate(leaderboard_data):
        leaderboard.append({
            "rank": idx + 1,
            "username": username,
            "xp": int(total_xp),
            "avatar": avatar_url[:2].upper() if avatar_url else username[:2].upper()
        })

    return leaderboard

@router.get("/users/me")
def get_current_user_info(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's complete profile information"""
    user_id = current_user.get("sub")
    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Calculate real stats from activities
    completed_labs = db.query(Activity).filter(
        Activity.user_id == user_id,
        Activity.action == "completed_lab"
    ).count()

    # Get total XP from activities
    total_xp = db.query(func.sum(Activity.xp_gained)).filter(
        Activity.user_id == user_id
    ).scalar() or 0

    # Calculate current streak
    current_streak = 0
    last_activity = db.query(Activity).filter(
        Activity.user_id == user_id
    ).order_by(desc(Activity.created_at)).first()

    if last_activity and last_activity.created_at:
        days_diff = (datetime.utcnow() - last_activity.created_at).days
        if days_diff == 0:
            current_streak = 1
        elif days_diff == 1:
            current_streak = 1

    # Calculate rank
    rank = db.query(func.count(func.distinct(User.id))).join(
        Activity, User.id == Activity.user_id
    ).filter(
        Activity.xp_gained > 0
    ).group_by(
        User.id
    ).having(
        func.sum(Activity.xp_gained) > total_xp
    ).count() + 1

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "avatar_url": user.avatar_url,
        "xps": total_xp,
        "labs_completed": completed_labs,
        "current_streak": current_streak,
        "longest_streak": user.longest_streak or 0,
        "auth_provider": user.auth_provider,
        "role": user.role if hasattr(user, 'role') else 'user',  # ✅ Added role
        "joined_at": user.joined_at.isoformat() if user.joined_at else None,
        "last_login": user.last_login.isoformat() if user.last_login else None,
        "rank": rank  # ✅ Added rank
    }

@router.get("/users/me/activities", response_model=List[ActivityResponse])
def get_user_activities(
    limit: int = 10,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get recent activities for the authenticated user"""
    user_id = current_user.get("sub")

    activities = db.query(Activity).filter(
        Activity.user_id == user_id
    ).order_by(desc(Activity.created_at)).limit(limit).all()

    response = []
    for activity in activities:
        activity_dict = {
            "id": activity.id,
            "action": activity.action,
            "item_type": activity.item_type,
            "item_name": activity.item_name,
            "xp_gained": activity.xp_gained,
            "created_at": activity.created_at,
            "time_ago": format_time_ago(activity.created_at)
        }
        response.append(ActivityResponse(**activity_dict))

    return response

@router.get("/users/me/badges", response_model=List[BadgeResponse])
def get_user_badges(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get earned badges for the authenticated user"""
    user_id = current_user.get("sub")

    # Get badges that the user has earned
    user_badges = db.query(UserBadge).filter(
        UserBadge.user_id == user_id
    ).all()

    badge_ids = [ub.badge_id for ub in user_badges]
    badges = db.query(Badge).filter(Badge.id.in_(badge_ids)).all() if badge_ids else []

    return [
        BadgeResponse(
            id=badge.id,
            name=badge.name,
            description=badge.description,
            icon=badge.icon,
            color=badge.color
        ) for badge in badges
    ]

@router.get("/users/me/stats")
def get_user_stats(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user statistics summary for dashboard"""
    user_id = current_user.get("sub")

    # Completed labs count
    completed_labs = db.query(Activity).filter(
        Activity.user_id == user_id,
        Activity.action == "completed_lab"
    ).count()

    # Total XP
    total_xp = db.query(func.sum(Activity.xp_gained)).filter(
        Activity.user_id == user_id
    ).scalar() or 0

    # Current streak
    streak = 0
    last_activity = db.query(Activity).filter(
        Activity.user_id == user_id
    ).order_by(desc(Activity.created_at)).first()

    if last_activity and last_activity.created_at:
        days_diff = (datetime.utcnow() - last_activity.created_at).days
        if days_diff == 0:
            streak = 1

    # Calculate user's rank
    higher_scores = db.query(
        func.count(func.distinct(User.id))
    ).join(
        Activity, User.id == Activity.user_id
    ).filter(
        Activity.xp_gained > 0
    ).group_by(
        User.id
    ).having(
        func.sum(Activity.xp_gained) > total_xp
    ).count()

    rank = higher_scores + 1

    return {
        "rank": rank,
        "total_xp": total_xp,
        "completed_labs": completed_labs,
        "streak": streak
    }

@router.get("/users/me/rank")
def get_user_rank(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's rank in the leaderboard"""
    user_id = current_user.get("sub")

    total_xp = db.query(func.sum(Activity.xp_gained)).filter(
        Activity.user_id == user_id
    ).scalar() or 0

    higher_scores = db.query(
        func.count(func.distinct(User.id))
    ).join(
        Activity, User.id == Activity.user_id
    ).filter(
        Activity.xp_gained > 0
    ).group_by(
        User.id
    ).having(
        func.sum(Activity.xp_gained) > total_xp
    ).count()

    rank = higher_scores + 1
    total_users = db.query(func.count(User.id)).count()

    return {
        "rank": rank,
        "total_users": total_users,
        "total_xp": total_xp
    }

# Get all users (staff only - will be protected)
@router.get("/all")
def get_all_users(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all users (requires staff access)"""
    # Get the full user from database to check role
    user_id = current_user.get("sub")
    user = db.query(User).filter(User.id == user_id).first()

    if not user or (hasattr(user, 'role') and user.role != 'staff'):
        raise HTTPException(status_code=403, detail="Staff access required")

    users = db.query(User).all()
    result = []
    for u in users:
        # Get user stats
        completed_labs = db.query(Activity).filter(
            Activity.user_id == u.id,
            Activity.action == "completed_lab"
        ).count()

        total_xp = db.query(func.sum(Activity.xp_gained)).filter(
            Activity.user_id == u.id
        ).scalar() or 0

        result.append({
            "id": u.id,
            "username": u.username,
            "email": u.email,
            "role": u.role if hasattr(u, 'role') else 'user',
            "total_xp": total_xp,
            "labs_completed": completed_labs,
            "joined_at": u.joined_at.isoformat() if u.joined_at else None,
            "last_login": u.last_login.isoformat() if u.last_login else None
        })

    return result

# Update user role (staff only)
@router.put("/{user_id}/role")
def update_user_role(
    user_id: str,
    role: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user role (staff only)"""
    # Check if current user is staff
    current_user_id = current_user.get("sub")
    current_user_obj = db.query(User).filter(User.id == current_user_id).first()

    if not current_user_obj or (hasattr(current_user_obj, 'role') and current_user_obj.role != 'staff'):
        raise HTTPException(status_code=403, detail="Staff access required")

    if role not in ['user', 'staff']:
        raise HTTPException(status_code=400, detail="Invalid role")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = role
    db.commit()

    return {"message": f"User role updated to {role}"}

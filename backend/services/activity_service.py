from sqlalchemy.orm import Session
from backend.models.activity import Activity
from backend.models.user import User
from backend.services.streak_service import update_user_streak
from datetime import datetime, timedelta
from typing import List
import uuid

def log_activity(
    user_id: str,
    action: str,
    item_type: str,
    item_name: str,
    xp_gained: int,
    db: Session
) -> Activity:
    """
    Create an activity record for a user action.
    Also updates user's XP and streak.
    """
    # Create activity record
    activity = Activity(
        id=str(uuid.uuid4()),
        user_id=user_id,
        action=action,
        item_type=item_type,
        item_name=item_name,
        xp_gained=xp_gained,
        created_at=datetime.utcnow()
    )
    db.add(activity)
    
    # Update user XP and stats
    user = db.query(User).filter(User.id == user_id).first()
    if user:
        user.xps += xp_gained
        
        # Update labs_completed if action is "Completed" and item_type is "lab"
        if action == "Completed" and item_type == "lab":
            user.labs_completed += 1
        
        # Update streak
        update_user_streak(user, db)
    
    db.commit()
    db.refresh(activity)
    
    return activity

def get_recent_activities(user_id: str, limit: int, db: Session) -> List[Activity]:
    """
    Fetch recent activities for a user.
    """
    activities = db.query(Activity)\
        .filter(Activity.user_id == user_id)\
        .order_by(Activity.created_at.desc())\
        .limit(limit)\
        .all()
    
    return activities

def format_time_ago(dt: datetime) -> str:
    """
    Format datetime to human-readable 'time ago' string.
    """
    now = datetime.utcnow()
    diff = now - dt
    
    seconds = diff.total_seconds()
    
    if seconds < 60:
        return "just now"
    elif seconds < 3600:
        minutes = int(seconds / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif seconds < 86400:
        hours = int(seconds / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif seconds < 604800:
        days = int(seconds / 86400)
        return f"{days} day{'s' if days != 1 else ''} ago"
    else:
        weeks = int(seconds / 604800)
        return f"{weeks} week{'s' if weeks != 1 else ''} ago"

from sqlalchemy.orm import Session
from backend.models.user import User
from datetime import date, timedelta
from typing import Tuple

def update_user_streak(user: User, db: Session) -> Tuple[int, int]:
    """
    Calculate and update user's current streak based on activity.
    Returns (current_streak, longest_streak)
    """
    today = date.today()
    
    if user.last_activity_date is None:
        # First activity ever
        user.current_streak = 1
        user.longest_streak = max(user.longest_streak, 1)
        user.last_activity_date = today
    else:
        days_diff = (today - user.last_activity_date).days
        
        if days_diff == 0:
            # Already logged activity today, no change
            pass
        elif days_diff == 1:
            # Consecutive day - increment streak
            user.current_streak += 1
            user.longest_streak = max(user.longest_streak, user.current_streak)
            user.last_activity_date = today
        else:
            # Streak broken - reset to 1
            user.current_streak = 1
            user.last_activity_date = today
    
    db.commit()
    db.refresh(user)
    
    return user.current_streak, user.longest_streak

def check_streak_break(user: User) -> bool:
    """
    Check if user's streak should be broken (missed yesterday).
    Returns True if streak was broken.
    """
    if user.last_activity_date is None:
        return False
    
    today = date.today()
    days_diff = (today - user.last_activity_date).days
    
    # If more than 1 day has passed, streak is broken
    return days_diff > 1

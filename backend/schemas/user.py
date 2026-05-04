from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional

class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    avatar_url: Optional[str] = None
    labs_completed: int
    xps: int
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[date] = None
    last_login: datetime
    joined_at: datetime
    
    class Config:
        from_attributes = True

class UserStatsResponse(BaseModel):
    rank: int
    xp: int
    labs_completed: int
    current_streak: int
    longest_streak: int
    
    class Config:
        from_attributes = True

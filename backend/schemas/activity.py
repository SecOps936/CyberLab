from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ActivityResponse(BaseModel):
    id: str
    action: str
    item_type: str
    item_name: str
    xp_gained: int
    created_at: datetime
    time_ago: Optional[str] = None  # Human-readable time like "2 hours ago"
    
    class Config:
        from_attributes = True

class ActivityCreate(BaseModel):
    user_id: str
    action: str
    item_type: str
    item_name: str
    xp_gained: int = 0

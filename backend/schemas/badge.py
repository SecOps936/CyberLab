from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BadgeResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: Optional[str] = None
    color: str
    earned_at: Optional[datetime] = None  # When user earned it
    
    class Config:
        from_attributes = True

class BadgeCreate(BaseModel):
    name: str
    description: str
    icon: Optional[str] = None
    color: str
    criteria: Optional[str] = None

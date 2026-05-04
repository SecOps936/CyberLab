from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from datetime import datetime
from backend.core.database import Base

class Activity(Base):
    __tablename__ = 'activities'
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    action = Column(String, nullable=False)  # "Completed", "Started", "Won", "Unlocked"
    item_type = Column(String, nullable=False)  # "lab", "challenge", "series"
    item_name = Column(String, nullable=False)
    xp_gained = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

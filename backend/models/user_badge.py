from sqlalchemy import Column, String, DateTime, ForeignKey
from datetime import datetime
from backend.core.database import Base

class UserBadge(Base):
    __tablename__ = 'user_badges'
    
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey('users.id'), nullable=False)
    badge_id = Column(String, ForeignKey('badges.id'), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)

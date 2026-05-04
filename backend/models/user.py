from sqlalchemy import Column, String, Integer, DateTime, Date, Boolean
from datetime import datetime
from backend.core.database import Base

class User(Base):
    __tablename__ = 'users'
    id = Column(String, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    username = Column(String)
    avatar_url = Column(String, nullable=True)
    labs_completed = Column(Integer, default=0)
    xps = Column(Integer, default=0)
    last_login = Column(DateTime, default=datetime.utcnow)
    joined_at = Column(DateTime, default=datetime.utcnow)
    auth_provider = Column(String, nullable=True)
    hashed_password = Column(String, nullable=True)
    
    # Role and Permissions
    role = Column(String, default='user')  # 'user' or 'staff'
    can_create_labs = Column(Boolean, default=False)
    can_create_tournaments = Column(Boolean, default=False)
    can_manage_users = Column(Boolean, default=False)
    
    # Streak tracking
    current_streak = Column(Integer, default=0)
    longest_streak = Column(Integer, default=0)
    last_activity_date = Column(Date, nullable=True)

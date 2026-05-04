from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey
from datetime import datetime
from backend.core.database import Base

class TournamentFlag(Base):
    __tablename__ = 'tournament_flags'
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, index=True)
    challenge_id = Column(String, ForeignKey('tournament_challenges.id'))
    flag = Column(String, nullable=False)
    flag_hash = Column(String, nullable=True)
    points = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, ForeignKey('users.id'), nullable=True)

class LabFlag(Base):
    __tablename__ = 'lab_flags'
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, index=True)
    lab_id = Column(String, ForeignKey('labs.id'))
    flag = Column(String, nullable=False)
    flag_hash = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    created_by = Column(String, ForeignKey('users.id'), nullable=True)

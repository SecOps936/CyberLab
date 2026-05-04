from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Boolean
from datetime import datetime
from backend.core.database import Base

class Lab(Base):
    __tablename__ = 'labs'
    id = Column(String, primary_key=True, index=True)
    title = Column(String)
    category = Column(String)
    difficulty = Column(String)
    time = Column(String)
    points = Column(Integer)
    participants = Column(Integer)
    description = Column(String)
    docker_image = Column(String)
    docker_port = Column(Integer, default=5200)
    tags = Column(String)  # stored as comma-separated string
    completed = Column(Boolean)
    featured = Column(Boolean)
    
    # Detailed lab information
    long_description = Column(String, nullable=True)  # Multi-paragraph detailed description
    objectives = Column(String, nullable=True)  # JSON array of learning objectives
    prerequisites = Column(String, nullable=True)  # JSON array of prerequisites
    hints = Column(String, nullable=True)  # JSON array of hints
    tools = Column(String, nullable=True)  # JSON array of tools provided
    environment = Column(String, nullable=True)  # Lab environment description


class LabSession(Base):
    __tablename__ = 'lab_sessions'
    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey('users.id'))
    lab_id = Column(String, ForeignKey('labs.id'))
    container_id = Column(String)
    port = Column(Integer)
    started_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    status = Column(String, default='running')

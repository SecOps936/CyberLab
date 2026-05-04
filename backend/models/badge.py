from sqlalchemy import Column, String
from backend.core.database import Base

class Badge(Base):
    __tablename__ = 'badges'
    
    id = Column(String, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=False)
    icon = Column(String, nullable=True)  # Icon identifier or URL
    color = Column(String, nullable=False)  # Badge color class (e.g., 'bg-red-500')
    criteria = Column(String, nullable=True)  # JSON string of unlock criteria

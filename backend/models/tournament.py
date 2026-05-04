from sqlalchemy import Column, String, Integer, DateTime, Boolean, ForeignKey, Text
from datetime import datetime
from backend.core.database import Base

class Tournament(Base):
    __tablename__ = 'tournaments'
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=True)
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime, nullable=False)
    prize_pool = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    has_started = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class TournamentChallenge(Base):
    __tablename__ = 'tournament_challenges'
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, index=True)
    tournament_id = Column(String, ForeignKey('tournaments.id'))
    title = Column(String, nullable=False)
    category = Column(String, nullable=False)
    difficulty = Column(String, nullable=False)
    points = Column(Integer, default=0)
    description = Column(String, nullable=True)
    objectives = Column(String, nullable=True)
    author_name = Column(String, nullable=True)  # ADD THIS FIELD - Author name from admin
    file_url = Column(String, nullable=True)
    file_name = Column(String, nullable=True)
    order = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

class TournamentParticipant(Base):
    __tablename__ = 'tournament_participants'
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, index=True)
    tournament_id = Column(String, ForeignKey('tournaments.id'))
    user_id = Column(String, ForeignKey('users.id'))
    total_score = Column(Integer, default=0)
    joined_at = Column(DateTime, default=datetime.utcnow)
    last_active = Column(DateTime, default=datetime.utcnow)

class TournamentSubmission(Base):
    __tablename__ = 'tournament_submissions'
    __table_args__ = {'extend_existing': True}

    id = Column(String, primary_key=True, index=True)
    tournament_id = Column(String, ForeignKey('tournaments.id'))
    challenge_id = Column(String, ForeignKey('tournament_challenges.id'))
    user_id = Column(String, ForeignKey('users.id'))
    is_correct = Column(Boolean, default=False)
    points_earned = Column(Integer, default=0)
    submitted_at = Column(DateTime, default=datetime.utcnow)

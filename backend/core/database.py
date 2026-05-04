from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.core.config import settings

DATABASE_URL = settings.DATABASE_URL

# check_same_thread is needed only for SQLite
connect_args = {"check_same_thread": False} if "sqlite" in DATABASE_URL else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

import asyncio
from datetime import datetime
from backend.core.database import SessionLocal
from backend.models.lab import LabSession
from backend.services.docker_service import stop_lab_container

async def check_expired_sessions():
    while True:
        db = SessionLocal()
        try:
            now = datetime.utcnow()
            expired = db.query(LabSession).filter(LabSession.expires_at < now, LabSession.status == 'running').all()
            for s in expired:
                stop_lab_container(s.container_id)
                s.status = 'expired'
            db.commit()
        except Exception as e:
            print(f"Error in scheduler: {e}")
        finally:
            db.close()
        
        await asyncio.sleep(60)

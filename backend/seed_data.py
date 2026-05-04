"""
Seed script to populate the database with sample activities and badges.
Run this after the database tables are created.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.database import SessionLocal
from backend.models.user import User
from backend.models.activity import Activity
from backend.models.badge import Badge
from backend.services.activity_service import log_activity
from datetime import datetime, timedelta
import uuid

def seed_data():
    db = SessionLocal()
    
    try:
        # Get first user to add activities
        user = db.query(User).first()
        
        if not user:
            print("No users found in database. Please login first to create a user.")
            return
        
        print(f"Adding sample data for user: {user.username}")
        
        # Create sample activities
        activities_data = [
            {
                "action": "Completed",
                "item_type": "lab",
                "item_name": "SQL Injection Lab",
                "xp_gained": 150,
                "hours_ago": 2
            },
            {
                "action": "Started",
                "item_type": "series",
                "item_name": "Web Exploitation Series",
                "xp_gained": 0,
                "hours_ago": 24
            },
            {
                "action": "Won",
                "item_type": "challenge",
                "item_name": "Weekly OSINT Challenge",
                "xp_gained": 500,
                "hours_ago": 72
            },
            {
                "action": "Completed",
                "item_type": "lab",
                "item_name": "XSS Basics",
                "xp_gained": 100,
                "hours_ago": 96
            },
            {
                "action": "Unlocked",
                "item_type": "series",
                "item_name": "Advanced Cryptography",
                "xp_gained": 200,
                "hours_ago": 168
            }
        ]
        
        for activity_data in activities_data:
            activity = Activity(
                id=str(uuid.uuid4()),
                user_id=user.id,
                action=activity_data["action"],
                item_type=activity_data["item_type"],
                item_name=activity_data["item_name"],
                xp_gained=activity_data["xp_gained"],
                created_at=datetime.utcnow() - timedelta(hours=activity_data["hours_ago"])
            )
            db.add(activity)
        
        # Create sample badges
        badges_data = [
            {
                "id": str(uuid.uuid4()),
                "name": "First Blood",
                "description": "First to solve a challenge",
                "color": "bg-red-500"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Speed Runner",
                "description": "Completed 10 labs in 24h",
                "color": "bg-cyber-blue"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "OSINT Master",
                "description": "Solved 15+ OSINT challenges",
                "color": "bg-cyber-green"
            },
            {
                "id": str(uuid.uuid4()),
                "name": "Crypto Wizard",
                "description": "Mastered cryptography basics",
                "color": "bg-cyber-purple"
            }
        ]
        
        for badge_data in badges_data:
            # Check if badge already exists
            existing_badge = db.query(Badge).filter(Badge.name == badge_data["name"]).first()
            if not existing_badge:
                badge = Badge(**badge_data)
                db.add(badge)
        
        db.commit()
        print("✅ Sample data added successfully!")
        print(f"   - Added {len(activities_data)} activities")
        print(f"   - Added {len(badges_data)} badges")
        
    except Exception as e:
        print(f"❌ Error seeding data: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()

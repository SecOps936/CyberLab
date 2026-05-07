"""
Cleanup script to remove duplicate labs from the database.
Run this to keep only one copy of each lab title.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.database import SessionLocal
from backend.models.lab import Lab
from sqlalchemy import text

def cleanup_duplicate_labs():
    db = SessionLocal()

    try:
        # Get all labs grouped by title, keeping the first one (lowest ID)
        # and deleting the rest for each title
        result = db.execute(text("""
            SELECT title, MIN(id) as keep_id
            FROM labs
            GROUP BY title
            HAVING COUNT(*) > 1
        """)).fetchall()

        print(f"Found {len(result)} lab titles with duplicates")

        total_deleted = 0
        for title, keep_id in result:
            # Delete all rows with this title except the one with keep_id
            deleted = db.execute(text("""
                DELETE FROM labs
                WHERE title = :title AND id != :keep_id
            """), {"title": title, "keep_id": keep_id}).rowcount

            total_deleted += deleted
            print(f"  - {title}: kept 1, deleted {deleted}")

        db.commit()
        print(f"\n✅ Cleanup complete! Deleted {total_deleted} duplicate labs")

        # Verify the cleanup
        final_count = db.execute(text("SELECT COUNT(*) FROM labs")).scalar()
        unique_titles = db.execute(text("SELECT COUNT(DISTINCT title) FROM labs")).scalar()
        print(f"Final state: {final_count} total labs, {unique_titles} unique titles")

    except Exception as e:
        print(f"❌ Error during cleanup: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    cleanup_duplicate_labs()
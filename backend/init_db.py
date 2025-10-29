"""Initialize and test database connection"""

from database import init_db, SessionLocal, DetectionRecord, VideoProcessingRecord
from sqlalchemy import inspect
import sys

def test_database_connection():
    """Test database connection and show schema"""
    print("\n" + "="*60)
    print("  Database Initialization & Connection Test")
    print("="*60 + "\n")
    
    try:
        # Initialize database (create tables)
        print("📦 Initializing database...")
        init_db()
        print("✅ Database tables created successfully!\n")
        
        # Test connection
        print("🔌 Testing database connection...")
        db = SessionLocal()
        
        # Check tables
        inspector = inspect(db.bind)
        tables = inspector.get_table_names()
        
        print(f"✅ Connected to database!")
        print(f"\n📊 Found {len(tables)} tables:")
        for table in tables:
            print(f"  - {table}")
        
        # Show DetectionRecord schema
        print(f"\n📋 DetectionRecord schema:")
        columns = inspector.get_columns('detection_records')
        for col in columns:
            print(f"  - {col['name']:25} {col['type']}")
        
        # Show VideoProcessingRecord schema
        print(f"\n📋 VideoProcessingRecord schema:")
        columns = inspector.get_columns('video_processing_records')
        for col in columns:
            print(f"  - {col['name']:25} {col['type']}")
        
        # Check record counts
        print(f"\n📈 Current data:")
        detection_count = db.query(DetectionRecord).count()
        video_count = db.query(VideoProcessingRecord).count()
        print(f"  - Detection records: {detection_count}")
        print(f"  - Video processing records: {video_count}")
        
        db.close()
        
        print(f"\n✅ Database is ready to use!")
        print(f"   Location: ./ppe_detection.db")
        print(f"\n💡 You can now run: python app_enhanced.py")
        
        return True
        
    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        return False

if __name__ == "__main__":
    success = test_database_connection()
    sys.exit(0 if success else 1)

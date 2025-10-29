"""Database configuration and models for PPE Detection API"""

from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, JSON, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Database URL (SQLite for simplicity, can be changed to PostgreSQL, MySQL, etc.)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./ppe_detection.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class DetectionRecord(Base):
    """Model for storing detection records"""
    __tablename__ = "detection_records"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String, unique=True, index=True)
    filename = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Image metadata
    image_width = Column(Integer)
    image_height = Column(Integer)
    image_size_kb = Column(Float)
    
    # Detection results
    total_detections = Column(Integer, default=0)
    person_count = Column(Integer, default=0)
    helmet_count = Column(Integer, default=0)
    vest_count = Column(Integer, default=0)
    
    # Configuration
    confidence_threshold = Column(Float, default=0.25)
    
    # Performance metrics
    processing_time_ms = Column(Float)
    
    # Compliance status
    is_compliant = Column(Boolean, nullable=True)
    compliance_message = Column(String, nullable=True)
    
    # Detailed detections (stored as JSON)
    detections_json = Column(JSON)
    
    # Request metadata
    endpoint = Column(String)  # predict, predict-batch, predict-video, etc.


class VideoProcessingRecord(Base):
    """Model for storing video processing records"""
    __tablename__ = "video_processing_records"
    
    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String, unique=True, index=True)
    filename = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Video metadata
    total_frames = Column(Integer)
    fps = Column(Float)
    duration_seconds = Column(Float)
    
    # Processing results
    frames_processed = Column(Integer)
    total_detections = Column(Integer, default=0)
    
    # Average counts per frame
    avg_person_count = Column(Float, default=0.0)
    avg_helmet_count = Column(Float, default=0.0)
    avg_vest_count = Column(Float, default=0.0)
    
    # Compliance
    compliant_frames = Column(Integer, default=0)
    non_compliant_frames = Column(Integer, default=0)
    compliance_rate = Column(Float, default=0.0)
    
    # Performance
    processing_time_seconds = Column(Float)
    
    # Configuration
    confidence_threshold = Column(Float, default=0.25)
    sample_rate = Column(Integer, default=1)  # Process every Nth frame


def init_db():
    """Initialize the database"""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Dependency for getting database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

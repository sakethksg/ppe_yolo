"""Pydantic models for request/response validation"""

from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class DetectionClass(str, Enum):
    """Valid detection classes"""
    PERSON = "person"
    HELMET = "helmet"
    SAFETY_VEST = "safety-vest"


class BoundingBox(BaseModel):
    """Bounding box coordinates"""
    x1: float = Field(..., description="Top-left x coordinate")
    y1: float = Field(..., description="Top-left y coordinate")
    x2: float = Field(..., description="Bottom-right x coordinate")
    y2: float = Field(..., description="Bottom-right y coordinate")
    
    @property
    def width(self) -> float:
        return self.x2 - self.x1
    
    @property
    def height(self) -> float:
        return self.y2 - self.y1
    
    @property
    def area(self) -> float:
        return self.width * self.height
    
    @property
    def center(self) -> tuple:
        return ((self.x1 + self.x2) / 2, (self.y1 + self.y2) / 2)


class Detection(BaseModel):
    """Single detection result"""
    class_id: int = Field(..., description="Class ID (0: person, 1: helmet, 2: safety-vest)")
    class_name: str = Field(..., description="Class name")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Detection confidence score")
    bounding_box: BoundingBox = Field(..., description="Bounding box coordinates")
    area: float = Field(..., description="Bounding box area in pixels")
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "class_id": 0,
            "class_name": "person",
            "confidence": 0.923,
            "bounding_box": {
                "x1": 150.5,
                "y1": 200.3,
                "x2": 450.2,
                "y2": 600.8
            },
            "area": 120060.0
        }
    })


class ImageMetadata(BaseModel):
    """Image metadata information"""
    filename: str
    width: int
    height: int
    size_kb: float
    format: str


class ProcessingMetrics(BaseModel):
    """Processing performance metrics"""
    processing_time_ms: float
    timestamp: datetime
    request_id: str


class DetectionSummary(BaseModel):
    """Summary of detections by class"""
    person: int = 0
    helmet: int = 0
    safety_vest: int = Field(0, alias="safety-vest")
    
    model_config = ConfigDict(populate_by_name=True)


class ComplianceStatus(BaseModel):
    """Safety compliance check result"""
    is_compliant: bool
    message: str
    details: Dict[str, Any]
    violations: List[str] = []
    warnings: List[str] = []


class PredictionResponse(BaseModel):
    """Response model for single image prediction"""
    success: bool
    request_id: str
    metadata: ImageMetadata
    detections_count: int
    detections: List[Detection]
    summary: DetectionSummary
    confidence_threshold: float
    metrics: ProcessingMetrics
    compliance: Optional[ComplianceStatus] = None
    
    model_config = ConfigDict(json_schema_extra={
        "example": {
            "success": True,
            "request_id": "req_abc123xyz",
            "metadata": {
                "filename": "test.jpg",
                "width": 1920,
                "height": 1080,
                "size_kb": 245.3,
                "format": "JPEG"
            },
            "detections_count": 3,
            "detections": [],
            "summary": {
                "person": 2,
                "helmet": 2,
                "safety-vest": 1
            },
            "confidence_threshold": 0.25,
            "metrics": {
                "processing_time_ms": 123.45,
                "timestamp": "2025-10-29T12:00:00",
                "request_id": "req_abc123xyz"
            }
        }
    })


class BatchPredictionResponse(BaseModel):
    """Response model for batch prediction"""
    success: bool
    request_id: str
    total_images: int
    processed_images: int
    failed_images: int
    results: List[PredictionResponse]
    total_processing_time_ms: float
    average_time_per_image_ms: float


class VideoFrameDetection(BaseModel):
    """Detection results for a single video frame"""
    frame_number: int
    timestamp_seconds: float
    detections: List[Detection]
    summary: DetectionSummary
    is_compliant: bool


class VideoProcessingResponse(BaseModel):
    """Response model for video processing"""
    success: bool
    request_id: str
    filename: str
    metadata: Dict[str, Any]
    total_frames: int
    processed_frames: int
    frame_detections: List[VideoFrameDetection]
    overall_summary: Dict[str, Any]
    compliance_rate: float
    processing_time_seconds: float


class AnalyticsResponse(BaseModel):
    """Response model for analytics endpoint"""
    total_requests: int
    date_range: Dict[str, str]
    summary: Dict[str, Any]
    compliance_statistics: Dict[str, Any]
    top_violations: List[Dict[str, Any]]
    detection_trends: List[Dict[str, Any]]
    performance_metrics: Dict[str, Any]

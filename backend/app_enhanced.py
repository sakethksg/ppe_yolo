"""Enhanced PPE Detection API with advanced features"""

from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, Query
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image
import io
from typing import List, Dict, Optional
import os
import time
from datetime import datetime

# Import database and models
from database import init_db, get_db, DetectionRecord
from models import (
    PredictionResponse, BatchPredictionResponse, VideoProcessingResponse,
    AnalyticsResponse, Detection, BoundingBox, ImageMetadata, ProcessingMetrics,
    DetectionSummary, ComplianceStatus, VideoFrameDetection
)
from utils import (
    generate_request_id, save_detection_record, save_video_processing_record,
    get_analytics, get_recent_detections, check_compliance
)
from sqlalchemy.orm import Session

app = FastAPI(
    title="PPE Detection API - Enhanced",
    description="Advanced API for detecting Personal Protective Equipment with analytics and compliance checking",
    version="2.0.0",
    contact={
        "name": "PPE Detection API",
        "email": "support@example.com"
    },
    license_info={
        "name": "MIT"
    }
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the YOLO model
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "mlsrc", "weights", "best.pt")
model = None

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize model and database on startup"""
    global model
    
    # Initialize database
    init_db()
    print("✅ Database initialized")
    
    # Load model
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    print(f"✅ Model loaded successfully from {MODEL_PATH}")


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "PPE Detection API - Enhanced Version",
        "version": "2.0.0",
        "features": [
            "Single image prediction with compliance check",
            "Batch image processing",
            "Video frame-by-frame analysis",
            "Safety compliance verification",
            "Analytics and reporting",
            "Database storage for historical data"
        ],
        "endpoints": {
            "/predict": "POST - Upload image for PPE detection",
            "/predict-image": "POST - Upload image and get annotated image",
            "/predict-batch": "POST - Process multiple images at once",
            "/check-compliance": "POST - Verify PPE compliance for an image",
            "/predict-video": "POST - Process video file",
            "/analytics": "GET - Get detection analytics and statistics",
            "/recent-detections": "GET - Get recent detection records",
            "/health": "GET - API health check",
            "/model-info": "GET - Model information"
        }
    }


@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Check database connection
        db.execute("SELECT 1")
        db_status = "connected"
    except:
        db_status = "disconnected"
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "model_loaded": model is not None,
        "database": db_status
    }


@app.get("/model-info")
async def model_info():
    """Get model information"""
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    return {
        "model_path": MODEL_PATH,
        "classes": {
            0: "person",
            1: "helmet",
            2: "safety-vest"
        },
        "num_classes": len(model.names),
        "model_type": "YOLOv10"
    }


def process_image(
    image_bytes: bytes,
    filename: str,
    conf_threshold: float,
    check_compliance_flag: bool = False
) -> Dict:
    """Helper function to process a single image"""
    start_time = time.time()
    
    # Read image
    image = Image.open(io.BytesIO(image_bytes))
    img_array = np.array(image)
    
    # Image metadata
    image_metadata = {
        "filename": filename,
        "width": image.width,
        "height": image.height,
        "size_kb": round(len(image_bytes) / 1024, 2),
        "format": image.format if hasattr(image, 'format') else "Unknown"
    }
    
    # Convert RGB to BGR
    if len(img_array.shape) == 3 and img_array.shape[2] == 3:
        img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
    
    # Run inference
    results = model.predict(source=img_array, conf=conf_threshold, verbose=False)
    
    # Parse results
    detections = []
    class_counts = {"person": 0, "helmet": 0, "safety-vest": 0}
    
    for result in results:
        if result.boxes is not None and len(result.boxes) > 0:
            for box, conf, cls in zip(result.boxes.xyxy, result.boxes.conf, result.boxes.cls):
                x1, y1, x2, y2 = map(float, box)
                confidence = float(conf)
                class_id = int(cls)
                class_name = model.names[class_id]
                
                bbox = {
                    "x1": round(x1, 2),
                    "y1": round(y1, 2),
                    "x2": round(x2, 2),
                    "y2": round(y2, 2)
                }
                
                area = (bbox["x2"] - bbox["x1"]) * (bbox["y2"] - bbox["y1"])
                
                detection = {
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": round(confidence, 3),
                    "bounding_box": bbox,
                    "area": round(area, 2)
                }
                detections.append(detection)
                
                if class_name in class_counts:
                    class_counts[class_name] += 1
    
    # Check compliance if requested
    compliance_result = None
    if check_compliance_flag:
        compliance_result = check_compliance(detections)
    
    processing_time_ms = (time.time() - start_time) * 1000
    
    return {
        "metadata": image_metadata,
        "detections": detections,
        "summary": class_counts,
        "compliance": compliance_result,
        "processing_time_ms": processing_time_ms
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict(
    file: UploadFile = File(...),
    conf_threshold: float = Query(0.25, ge=0.0, le=1.0, description="Confidence threshold"),
    check_compliance_flag: bool = Query(False, description="Check PPE compliance"),
    db: Session = Depends(get_db)
):
    """
    Detect PPE in uploaded image with enhanced metadata and optional compliance check
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        request_id = generate_request_id()
        contents = await file.read()
        
        # Process image
        result = process_image(contents, file.filename, conf_threshold, check_compliance_flag)
        
        # Save to database
        save_detection_record(
            db=db,
            request_id=request_id,
            filename=file.filename,
            image_metadata=result["metadata"],
            detections=result["detections"],
            summary=result["summary"],
            confidence_threshold=conf_threshold,
            processing_time_ms=result["processing_time_ms"],
            endpoint="predict",
            compliance=result["compliance"]
        )
        
        # Build response
        response_data = {
            "success": True,
            "request_id": request_id,
            "metadata": result["metadata"],
            "detections_count": len(result["detections"]),
            "detections": [
                Detection(
                    class_id=d["class_id"],
                    class_name=d["class_name"],
                    confidence=d["confidence"],
                    bounding_box=BoundingBox(**d["bounding_box"]),
                    area=d["area"]
                ) for d in result["detections"]
            ],
            "summary": DetectionSummary(**result["summary"]),
            "confidence_threshold": conf_threshold,
            "metrics": ProcessingMetrics(
                processing_time_ms=result["processing_time_ms"],
                timestamp=datetime.utcnow(),
                request_id=request_id
            ),
            "compliance": ComplianceStatus(**result["compliance"]) if result["compliance"] else None
        }
        
        return response_data
        
    except Exception as e:
        import traceback
        print(f"Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.post("/predict-image")
async def predict_image(
    file: UploadFile = File(...),
    conf_threshold: float = Query(0.25, ge=0.0, le=1.0)
):
    """
    Detect PPE and return annotated image
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        img_array = np.array(image)
        
        if len(img_array.shape) == 3 and img_array.shape[2] == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        results = model.predict(source=img_array, conf=conf_threshold, verbose=False)
        annotated_img = img_array.copy()
        
        colors = {
            "person": (0, 255, 0),
            "helmet": (255, 0, 0),
            "safety-vest": (0, 165, 255)
        }
        
        for result in results:
            if result.boxes is not None and len(result.boxes) > 0:
                for box, conf, cls in zip(result.boxes.xyxy, result.boxes.conf, result.boxes.cls):
                    x1, y1, x2, y2 = map(int, box)
                    confidence = float(conf)
                    class_id = int(cls)
                    class_name = model.names[class_id]
                    color = colors.get(class_name, (255, 255, 255))
                    
                    cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 2)
                    label = f"{class_name}: {confidence:.2f}"
                    
                    (label_width, label_height), baseline = cv2.getTextSize(
                        label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
                    )
                    
                    cv2.rectangle(
                        annotated_img,
                        (x1, y1 - label_height - baseline - 5),
                        (x1 + label_width, y1),
                        color,
                        -1
                    )
                    
                    cv2.putText(
                        annotated_img,
                        label,
                        (x1, y1 - baseline - 5),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (255, 255, 255),
                        2
                    )
        
        annotated_img = cv2.cvtColor(annotated_img, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(annotated_img)
        
        img_buffer = io.BytesIO()
        pil_img.save(img_buffer, format="JPEG", quality=95)
        img_buffer.seek(0)
        
        return StreamingResponse(img_buffer, media_type="image/jpeg")
        
    except Exception as e:
        import traceback
        print(f"Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")


@app.post("/predict-batch", response_model=BatchPredictionResponse)
async def predict_batch(
    files: List[UploadFile] = File(...),
    conf_threshold: float = Query(0.25, ge=0.0, le=1.0),
    check_compliance_flag: bool = Query(False, description="Check PPE compliance"),
    db: Session = Depends(get_db)
):
    """
    Process multiple images in batch
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if len(files) == 0:
        raise HTTPException(status_code=400, detail="No files provided")
    
    if len(files) > 50:
        raise HTTPException(status_code=400, detail="Maximum 50 images allowed per batch")
    
    request_id = generate_request_id()
    batch_start_time = time.time()
    
    results = []
    failed_images = 0
    
    for file in files:
        try:
            if file.content_type and not file.content_type.startswith("image/"):
                failed_images += 1
                continue
            
            contents = await file.read()
            result = process_image(contents, file.filename, conf_threshold, check_compliance_flag)
            
            # Save individual detection
            img_request_id = generate_request_id()
            save_detection_record(
                db=db,
                request_id=img_request_id,
                filename=file.filename,
                image_metadata=result["metadata"],
                detections=result["detections"],
                summary=result["summary"],
                confidence_threshold=conf_threshold,
                processing_time_ms=result["processing_time_ms"],
                endpoint="predict-batch",
                compliance=result["compliance"]
            )
            
            # Build individual response
            response_data = {
                "success": True,
                "request_id": img_request_id,
                "metadata": result["metadata"],
                "detections_count": len(result["detections"]),
                "detections": [
                    Detection(
                        class_id=d["class_id"],
                        class_name=d["class_name"],
                        confidence=d["confidence"],
                        bounding_box=BoundingBox(**d["bounding_box"]),
                        area=d["area"]
                    ) for d in result["detections"]
                ],
                "summary": DetectionSummary(**result["summary"]),
                "confidence_threshold": conf_threshold,
                "metrics": ProcessingMetrics(
                    processing_time_ms=result["processing_time_ms"],
                    timestamp=datetime.utcnow(),
                    request_id=img_request_id
                ),
                "compliance": ComplianceStatus(**result["compliance"]) if result["compliance"] else None
            }
            
            results.append(response_data)
            
        except Exception as e:
            print(f"Error processing {file.filename}: {str(e)}")
            failed_images += 1
    
    total_processing_time_ms = (time.time() - batch_start_time) * 1000
    avg_time = total_processing_time_ms / len(results) if results else 0
    
    return BatchPredictionResponse(
        success=True,
        request_id=request_id,
        total_images=len(files),
        processed_images=len(results),
        failed_images=failed_images,
        results=results,
        total_processing_time_ms=round(total_processing_time_ms, 2),
        average_time_per_image_ms=round(avg_time, 2)
    )


@app.post("/check-compliance")
async def check_compliance_endpoint(
    file: UploadFile = File(...),
    conf_threshold: float = Query(0.25, ge=0.0, le=1.0),
    db: Session = Depends(get_db)
):
    """
    Check if persons in the image are wearing required PPE
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    try:
        request_id = generate_request_id()
        contents = await file.read()
        
        result = process_image(contents, file.filename, conf_threshold, check_compliance_flag=True)
        
        # Save to database
        save_detection_record(
            db=db,
            request_id=request_id,
            filename=file.filename,
            image_metadata=result["metadata"],
            detections=result["detections"],
            summary=result["summary"],
            confidence_threshold=conf_threshold,
            processing_time_ms=result["processing_time_ms"],
            endpoint="check-compliance",
            compliance=result["compliance"]
        )
        
        return {
            "success": True,
            "request_id": request_id,
            "filename": file.filename,
            "summary": result["summary"],
            "compliance": ComplianceStatus(**result["compliance"]),
            "processing_time_ms": result["processing_time_ms"]
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error checking compliance: {str(e)}")


@app.post("/predict-video", response_model=VideoProcessingResponse)
async def predict_video(
    file: UploadFile = File(...),
    conf_threshold: float = Query(0.25, ge=0.0, le=1.0),
    sample_rate: int = Query(1, ge=1, description="Process every Nth frame"),
    max_frames: int = Query(300, ge=1, description="Maximum frames to process"),
    db: Session = Depends(get_db)
):
    """
    Process video file frame by frame
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    if file.content_type and not file.content_type.startswith("video/"):
        raise HTTPException(status_code=400, detail="File must be a video")
    
    try:
        request_id = generate_request_id()
        start_time = time.time()
        
        # Save uploaded video temporarily
        temp_video_path = f"/tmp/{request_id}_{file.filename}"
        contents = await file.read()
        with open(temp_video_path, "wb") as f:
            f.write(contents)
        
        # Open video
        cap = cv2.VideoCapture(temp_video_path)
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        duration = total_frames / fps if fps > 0 else 0
        
        frame_detections = []
        frame_number = 0
        processed_frames = 0
        total_detections = 0
        
        person_counts = []
        helmet_counts = []
        vest_counts = []
        
        compliant_frames = 0
        non_compliant_frames = 0
        
        while cap.isOpened() and processed_frames < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
            
            # Process every Nth frame
            if frame_number % sample_rate == 0:
                # Run inference
                results = model.predict(source=frame, conf=conf_threshold, verbose=False)
                
                detections = []
                class_counts = {"person": 0, "helmet": 0, "safety-vest": 0}
                
                for result in results:
                    if result.boxes is not None and len(result.boxes) > 0:
                        for box, conf, cls in zip(result.boxes.xyxy, result.boxes.conf, result.boxes.cls):
                            x1, y1, x2, y2 = map(float, box)
                            confidence = float(conf)
                            class_id = int(cls)
                            class_name = model.names[class_id]
                            
                            bbox = {
                                "x1": round(x1, 2),
                                "y1": round(y1, 2),
                                "x2": round(x2, 2),
                                "y2": round(y2, 2)
                            }
                            area = (bbox["x2"] - bbox["x1"]) * (bbox["y2"] - bbox["y1"])
                            
                            detection = {
                                "class_id": class_id,
                                "class_name": class_name,
                                "confidence": round(confidence, 3),
                                "bounding_box": bbox,
                                "area": round(area, 2)
                            }
                            detections.append(detection)
                            
                            if class_name in class_counts:
                                class_counts[class_name] += 1
                
                # Check compliance
                compliance = check_compliance(detections)
                is_compliant = compliance["is_compliant"]
                
                if is_compliant:
                    compliant_frames += 1
                else:
                    non_compliant_frames += 1
                
                frame_detections.append({
                    "frame_number": frame_number,
                    "timestamp_seconds": round(frame_number / fps, 2) if fps > 0 else 0,
                    "detections": detections,
                    "summary": class_counts,
                    "is_compliant": is_compliant
                })
                
                total_detections += len(detections)
                person_counts.append(class_counts["person"])
                helmet_counts.append(class_counts["helmet"])
                vest_counts.append(class_counts["safety-vest"])
                
                processed_frames += 1
            
            frame_number += 1
        
        cap.release()
        
        # Clean up temp file
        if os.path.exists(temp_video_path):
            os.remove(temp_video_path)
        
        processing_time = time.time() - start_time
        
        # Calculate averages
        avg_person = sum(person_counts) / len(person_counts) if person_counts else 0
        avg_helmet = sum(helmet_counts) / len(helmet_counts) if helmet_counts else 0
        avg_vest = sum(vest_counts) / len(vest_counts) if vest_counts else 0
        compliance_rate = (compliant_frames / processed_frames * 100) if processed_frames > 0 else 0
        
        # Save to database
        video_metadata = {
            "total_frames": total_frames,
            "fps": fps,
            "duration_seconds": duration
        }
        
        processing_results = {
            "frames_processed": processed_frames,
            "total_detections": total_detections,
            "avg_person_count": avg_person,
            "avg_helmet_count": avg_helmet,
            "avg_vest_count": avg_vest,
            "compliant_frames": compliant_frames,
            "non_compliant_frames": non_compliant_frames,
            "compliance_rate": compliance_rate,
            "processing_time_seconds": processing_time
        }
        
        save_video_processing_record(
            db=db,
            request_id=request_id,
            filename=file.filename,
            video_metadata=video_metadata,
            processing_results=processing_results,
            confidence_threshold=conf_threshold,
            sample_rate=sample_rate
        )
        
        return VideoProcessingResponse(
            success=True,
            request_id=request_id,
            filename=file.filename,
            metadata={
                "total_frames": total_frames,
                "fps": fps,
                "duration_seconds": round(duration, 2),
                "sample_rate": sample_rate
            },
            total_frames=total_frames,
            processed_frames=processed_frames,
            frame_detections=[
                VideoFrameDetection(
                    frame_number=fd["frame_number"],
                    timestamp_seconds=fd["timestamp_seconds"],
                    detections=[
                        Detection(
                            class_id=d["class_id"],
                            class_name=d["class_name"],
                            confidence=d["confidence"],
                            bounding_box=BoundingBox(**d["bounding_box"]),
                            area=d["area"]
                        ) for d in fd["detections"]
                    ],
                    summary=DetectionSummary(**fd["summary"]),
                    is_compliant=fd["is_compliant"]
                ) for fd in frame_detections[:50]  # Limit response size
            ],
            overall_summary={
                "total_detections": total_detections,
                "avg_person_count": round(avg_person, 2),
                "avg_helmet_count": round(avg_helmet, 2),
                "avg_vest_count": round(avg_vest, 2),
                "compliant_frames": compliant_frames,
                "non_compliant_frames": non_compliant_frames
            },
            compliance_rate=round(compliance_rate, 2),
            processing_time_seconds=round(processing_time, 2)
        )
        
    except Exception as e:
        import traceback
        print(f"Error: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error processing video: {str(e)}")


@app.get("/analytics", response_model=AnalyticsResponse)
async def get_analytics_endpoint(
    days: int = Query(7, ge=1, le=365, description="Number of days to analyze"),
    endpoint: Optional[str] = Query(None, description="Filter by endpoint"),
    db: Session = Depends(get_db)
):
    """
    Get detection analytics and statistics
    """
    try:
        analytics_data = get_analytics(db, days=days, endpoint=endpoint)
        return AnalyticsResponse(**analytics_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving analytics: {str(e)}")


@app.get("/recent-detections")
async def get_recent_detections_endpoint(
    limit: int = Query(10, ge=1, le=100),
    endpoint: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    """
    Get recent detection records
    """
    try:
        records = get_recent_detections(db, limit=limit, endpoint=endpoint)
        
        return {
            "success": True,
            "total": len(records),
            "records": [
                {
                    "request_id": r.request_id,
                    "filename": r.filename,
                    "timestamp": r.timestamp.isoformat(),
                    "endpoint": r.endpoint,
                    "detections_count": r.total_detections,
                    "summary": {
                        "person": r.person_count,
                        "helmet": r.helmet_count,
                        "safety-vest": r.vest_count
                    },
                    "is_compliant": r.is_compliant,
                    "processing_time_ms": r.processing_time_ms
                }
                for r in records
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving records: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    print("\n🚀 Starting Enhanced PPE Detection API on port 8001...")
    print("📖 API Documentation: http://localhost:8001/docs")
    print("📊 Database: ppe_detection.db\n")
    uvicorn.run(app, host="0.0.0.0", port=8001)

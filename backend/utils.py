"""Utility functions for database operations and analytics"""

from sqlalchemy.orm import Session
from sqlalchemy import func, desc, and_
from database import DetectionRecord, VideoProcessingRecord
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, List
import uuid


def generate_request_id() -> str:
    """Generate a unique request ID"""
    return f"req_{uuid.uuid4().hex[:12]}"


def save_detection_record(
    db: Session,
    request_id: str,
    filename: str,
    image_metadata: Dict[str, Any],
    detections: List[Dict[str, Any]],
    summary: Dict[str, int],
    confidence_threshold: float,
    processing_time_ms: float,
    endpoint: str = "predict",
    compliance: Optional[Dict[str, Any]] = None
) -> DetectionRecord:
    """Save detection record to database"""
    
    record = DetectionRecord(
        request_id=request_id,
        filename=filename,
        timestamp=datetime.utcnow(),
        image_width=image_metadata.get("width"),
        image_height=image_metadata.get("height"),
        image_size_kb=image_metadata.get("size_kb"),
        total_detections=len(detections),
        person_count=summary.get("person", 0),
        helmet_count=summary.get("helmet", 0),
        vest_count=summary.get("safety-vest", 0),
        confidence_threshold=confidence_threshold,
        processing_time_ms=processing_time_ms,
        detections_json=detections,
        endpoint=endpoint,
        is_compliant=compliance.get("is_compliant") if compliance else None,
        compliance_message=compliance.get("message") if compliance else None
    )
    
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def save_video_processing_record(
    db: Session,
    request_id: str,
    filename: str,
    video_metadata: Dict[str, Any],
    processing_results: Dict[str, Any],
    confidence_threshold: float,
    sample_rate: int = 1
) -> VideoProcessingRecord:
    """Save video processing record to database"""
    
    record = VideoProcessingRecord(
        request_id=request_id,
        filename=filename,
        timestamp=datetime.utcnow(),
        total_frames=video_metadata.get("total_frames"),
        fps=video_metadata.get("fps"),
        duration_seconds=video_metadata.get("duration_seconds"),
        frames_processed=processing_results.get("frames_processed"),
        total_detections=processing_results.get("total_detections", 0),
        avg_person_count=processing_results.get("avg_person_count", 0.0),
        avg_helmet_count=processing_results.get("avg_helmet_count", 0.0),
        avg_vest_count=processing_results.get("avg_vest_count", 0.0),
        compliant_frames=processing_results.get("compliant_frames", 0),
        non_compliant_frames=processing_results.get("non_compliant_frames", 0),
        compliance_rate=processing_results.get("compliance_rate", 0.0),
        processing_time_seconds=processing_results.get("processing_time_seconds"),
        confidence_threshold=confidence_threshold,
        sample_rate=sample_rate
    )
    
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_analytics(
    db: Session,
    days: int = 7,
    endpoint: Optional[str] = None
) -> Dict[str, Any]:
    """Get analytics data for the specified time period"""
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Base query
    query = db.query(DetectionRecord).filter(DetectionRecord.timestamp >= start_date)
    if endpoint:
        query = query.filter(DetectionRecord.endpoint == endpoint)
    
    records = query.all()
    
    if not records:
        return {
            "total_requests": 0,
            "date_range": {
                "start": start_date.isoformat(),
                "end": datetime.utcnow().isoformat(),
                "days": str(days)
            },
            "summary": {},
            "compliance_statistics": {},
            "top_violations": [],
            "detection_trends": [],
            "performance_metrics": {}
        }
    
    # Calculate statistics
    total_requests = len(records)
    total_detections = sum(r.total_detections for r in records)
    total_persons = sum(r.person_count for r in records)
    total_helmets = sum(r.helmet_count for r in records)
    total_vests = sum(r.vest_count for r in records)
    
    # Compliance statistics
    compliance_records = [r for r in records if r.is_compliant is not None]
    compliant_count = sum(1 for r in compliance_records if r.is_compliant)
    compliance_rate = (compliant_count / len(compliance_records) * 100) if compliance_records else 0
    
    # Performance metrics
    avg_processing_time = sum(r.processing_time_ms for r in records) / total_requests
    min_processing_time = min(r.processing_time_ms for r in records)
    max_processing_time = max(r.processing_time_ms for r in records)
    
    # Violations
    violations = {}
    for record in records:
        if not record.is_compliant and record.compliance_message:
            msg = record.compliance_message
            violations[msg] = violations.get(msg, 0) + 1
    
    top_violations = [
        {"violation": k, "count": v}
        for k, v in sorted(violations.items(), key=lambda x: x[1], reverse=True)[:5]
    ]
    
    # Daily trends
    daily_stats = {}
    for record in records:
        date_key = record.timestamp.date().isoformat()
        if date_key not in daily_stats:
            daily_stats[date_key] = {
                "date": date_key,
                "requests": 0,
                "detections": 0,
                "persons": 0,
                "helmets": 0,
                "vests": 0
            }
        daily_stats[date_key]["requests"] += 1
        daily_stats[date_key]["detections"] += record.total_detections
        daily_stats[date_key]["persons"] += record.person_count
        daily_stats[date_key]["helmets"] += record.helmet_count
        daily_stats[date_key]["vests"] += record.vest_count
    
    detection_trends = sorted(daily_stats.values(), key=lambda x: x["date"])
    
    return {
        "total_requests": total_requests,
        "date_range": {
            "start": start_date.isoformat(),
            "end": datetime.utcnow().isoformat(),
            "days": str(days)
        },
        "summary": {
            "total_detections": total_detections,
            "total_persons": total_persons,
            "total_helmets": total_helmets,
            "total_vests": total_vests,
            "avg_detections_per_request": round(total_detections / total_requests, 2)
        },
        "compliance_statistics": {
            "total_checks": len(compliance_records),
            "compliant": compliant_count,
            "non_compliant": len(compliance_records) - compliant_count,
            "compliance_rate_percent": round(compliance_rate, 2)
        },
        "top_violations": top_violations,
        "detection_trends": detection_trends,
        "performance_metrics": {
            "avg_processing_time_ms": round(avg_processing_time, 2),
            "min_processing_time_ms": round(min_processing_time, 2),
            "max_processing_time_ms": round(max_processing_time, 2)
        }
    }


def get_recent_detections(
    db: Session,
    limit: int = 10,
    endpoint: Optional[str] = None
) -> List[DetectionRecord]:
    """Get recent detection records"""
    query = db.query(DetectionRecord).order_by(desc(DetectionRecord.timestamp))
    
    if endpoint:
        query = query.filter(DetectionRecord.endpoint == endpoint)
    
    return query.limit(limit).all()


def check_compliance(detections: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Check if detected persons are wearing required PPE
    
    Logic:
    - For each person detected, check if there's a helmet and safety vest nearby
    - Consider PPE belongs to a person if bounding boxes overlap or are close
    """
    
    persons = [d for d in detections if d["class_name"] == "person"]
    helmets = [d for d in detections if d["class_name"] == "helmet"]
    vests = [d for d in detections if d["class_name"] == "safety-vest"]
    
    if not persons:
        return {
            "is_compliant": True,
            "message": "No persons detected",
            "details": {
                "total_persons": 0,
                "persons_with_helmet": 0,
                "persons_with_vest": 0,
                "fully_compliant": 0
            },
            "violations": [],
            "warnings": []
        }
    
    violations = []
    warnings = []
    persons_with_helmet = 0
    persons_with_vest = 0
    fully_compliant = 0
    
    def boxes_overlap_or_close(box1, box2, threshold=50):
        """Check if two bounding boxes overlap or are close to each other"""
        b1 = box1["bounding_box"]
        b2 = box2["bounding_box"]
        
        # Check if boxes overlap
        if not (b1["x2"] < b2["x1"] or b1["x1"] > b2["x2"] or
                b1["y2"] < b2["y1"] or b1["y1"] > b2["y2"]):
            return True
        
        # Check if boxes are close (within threshold pixels)
        center1_x = (b1["x1"] + b1["x2"]) / 2
        center1_y = (b1["y1"] + b1["y2"]) / 2
        center2_x = (b2["x1"] + b2["x2"]) / 2
        center2_y = (b2["y1"] + b2["y2"]) / 2
        
        distance = ((center1_x - center2_x) ** 2 + (center1_y - center2_y) ** 2) ** 0.5
        return distance < threshold
    
    for i, person in enumerate(persons, 1):
        has_helmet = any(boxes_overlap_or_close(person, helmet) for helmet in helmets)
        has_vest = any(boxes_overlap_or_close(person, vest) for vest in vests)
        
        if has_helmet:
            persons_with_helmet += 1
        else:
            violations.append(f"Person #{i} is not wearing a helmet")
        
        if has_vest:
            persons_with_vest += 1
        else:
            violations.append(f"Person #{i} is not wearing a safety vest")
        
        if has_helmet and has_vest:
            fully_compliant += 1
    
    # Overall compliance check
    is_compliant = len(violations) == 0
    
    # Generate message
    if is_compliant:
        message = f"All {len(persons)} person(s) are wearing required PPE"
    else:
        message = f"{len(violations)} PPE violation(s) detected"
    
    # Warnings
    if len(helmets) > len(persons):
        warnings.append(f"Extra helmets detected ({len(helmets)} helmets for {len(persons)} persons)")
    if len(vests) > len(persons):
        warnings.append(f"Extra vests detected ({len(vests)} vests for {len(persons)} persons)")
    
    return {
        "is_compliant": is_compliant,
        "message": message,
        "details": {
            "total_persons": len(persons),
            "persons_with_helmet": persons_with_helmet,
            "persons_with_vest": persons_with_vest,
            "fully_compliant": fully_compliant,
            "total_helmets": len(helmets),
            "total_vests": len(vests)
        },
        "violations": violations,
        "warnings": warnings
    }

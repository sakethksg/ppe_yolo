# PPE Detection FastAPI

A FastAPI application for detecting Personal Protective Equipment (PPE) using YOLOv10 model.

## Detected Classes
- **Person** (class 0)
- **Helmet** (class 1)
- **Safety-vest** (class 2)

## Installation

1. Install dependencies:
```bash
pip install -r requirements.txt
```

## Running the API

```bash
python app.py
```

### Enhanced Version (Recommended)
```bash
python app_enhanced.py
```

Or using uvicorn directly:
```bash
# Standard version
uvicorn app:app --reload --host 0.0.0.0 --port 8000

# Enhanced version
uvicorn app_enhanced:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## 📊 Database

The enhanced version automatically creates a SQLite database (`ppe_detection.db`) to store:
- Detection records with timestamps
- Image metadata and processing metrics
- Compliance check results
- Video processing statistics

The database is initialized automatically on first startup.

## API Documentation

Once the server is running, access:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### 1. Root Endpoint
```
GET /
```
Returns API information and available endpoints.

### 2. Health Check
```
GET /health
```
Check if the API is running and model is loaded.

### 3. Model Information
```
GET /model-info
```
Get information about the loaded model and classes.

### 4. Predict (Detection)
```
POST /predict
```

**Parameters:**
- `file` (required): Image file (JPG, JPEG, PNG)
- `conf_threshold` (optional): Confidence threshold (default: 0.25)
- `check_compliance_flag` (optional): Check PPE compliance (default: false)

**Example using curl:**
```bash
curl -X POST "http://localhost:8000/predict?conf_threshold=0.25&check_compliance_flag=true" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/your/image.jpg"
```

**Example using Python:**
```python
import requests

url = "http://localhost:8000/predict"
files = {"file": open("image.jpg", "rb")}
params = {
    "conf_threshold": 0.25,
    "check_compliance_flag": True
}

response = requests.post(url, files=files, params=params)
print(response.json())
```

**Enhanced Response (v2.0):**
```json
{
  "success": true,
  "request_id": "req_abc123xyz",
  "metadata": {
    "filename": "test_image.jpg",
    "width": 1920,
    "height": 1080,
    "size_kb": 245.3,
    "format": "JPEG"
  },
  "detections_count": 3,
  "detections": [
    {
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
  ],
  "summary": {
    "person": 2,
    "helmet": 2,
    "safety-vest": 1
  },
  "confidence_threshold": 0.25,
  "metrics": {
    "processing_time_ms": 123.45,
    "timestamp": "2025-10-29T12:00:00Z",
    "request_id": "req_abc123xyz"
  },
  "compliance": {
    "is_compliant": false,
    "message": "2 PPE violation(s) detected",
    "details": {
      "total_persons": 2,
      "persons_with_helmet": 2,
      "persons_with_vest": 1,
      "fully_compliant": 1,
      "total_helmets": 2,
      "total_vests": 1
    },
    "violations": [
      "Person #2 is not wearing a safety vest"
    ],
    "warnings": []
  }
}
```

### 5. Predict Image (Annotated)
```
POST /predict-image
```
Returns an annotated image with bounding boxes drawn. Same as before.

### 6. Batch Processing (NEW! 🚀)
```
POST /predict-batch
```

Process multiple images at once (up to 50 images).

**Parameters:**
- `files` (required): Multiple image files
- `conf_threshold` (optional): Confidence threshold (default: 0.25)
- `check_compliance_flag` (optional): Check PPE compliance (default: false)

**Example using Python:**
```python
import requests

url = "http://localhost:8000/predict-batch"
files = [
    ("files", open("image1.jpg", "rb")),
    ("files", open("image2.jpg", "rb")),
    ("files", open("image3.jpg", "rb"))
]
params = {"conf_threshold": 0.25, "check_compliance_flag": True}

response = requests.post(url, files=files, params=params)
result = response.json()

print(f"Processed: {result['processed_images']}/{result['total_images']}")
print(f"Total time: {result['total_processing_time_ms']}ms")
print(f"Avg per image: {result['average_time_per_image_ms']}ms")
```

### 7. Check Compliance (NEW! 🛡️)
```
POST /check-compliance
```

Verify that all detected persons are wearing required PPE (helmet and safety vest).

**Example:**
```python
import requests

url = "http://localhost:8000/check-compliance"
files = {"file": open("worksite.jpg", "rb")}
params = {"conf_threshold": 0.25}

response = requests.post(url, files=files, params=params)
result = response.json()

if result["compliance"]["is_compliant"]:
    print("✅ All workers are compliant!")
else:
    print("⚠️ Violations detected:")
    for violation in result["compliance"]["violations"]:
        print(f"  - {violation}")
```

### 8. Video Processing (NEW! 🎥)
```
POST /predict-video
```

Process video files frame by frame with compliance tracking.

**Parameters:**
- `file` (required): Video file (mp4, avi, etc.)
- `conf_threshold` (optional): Confidence threshold (default: 0.25)
- `sample_rate` (optional): Process every Nth frame (default: 1)
- `max_frames` (optional): Maximum frames to process (default: 300)

**Example:**
```python
import requests

url = "http://localhost:8000/predict-video"
files = {"file": open("worksite_video.mp4", "rb")}
params = {
    "conf_threshold": 0.25,
    "sample_rate": 5,  # Process every 5th frame
    "max_frames": 100
}

response = requests.post(url, files=files, params=params)
result = response.json()

print(f"Processed {result['processed_frames']} frames")
print(f"Compliance rate: {result['compliance_rate']}%")
print(f"Total detections: {result['overall_summary']['total_detections']}")
```

### 9. Analytics (NEW! 📊)
```
GET /analytics
```

Get historical detection analytics and statistics.

**Parameters:**
- `days` (optional): Number of days to analyze (default: 7, max: 365)
- `endpoint` (optional): Filter by specific endpoint

**Example:**
```python
import requests

url = "http://localhost:8000/analytics?days=30"
response = requests.get(url)
analytics = response.json()

print(f"Total requests: {analytics['total_requests']}")
print(f"Compliance rate: {analytics['compliance_statistics']['compliance_rate_percent']}%")
print(f"Avg processing time: {analytics['performance_metrics']['avg_processing_time_ms']}ms")

# View trends
for day in analytics['detection_trends']:
    print(f"{day['date']}: {day['detections']} detections")
```

### 10. Recent Detections (NEW! 📋)
```
GET /recent-detections
```

Get recent detection records.

**Parameters:**
- `limit` (optional): Number of records (default: 10, max: 100)
- `endpoint` (optional): Filter by specific endpoint

**Example:**
```python
import requests

url = "http://localhost:8000/recent-detections?limit=20"
response = requests.get(url)
records = response.json()

for record in records['records']:
    print(f"{record['timestamp']}: {record['filename']} - {record['detections_count']} detections")
```

## Model

The model file should be located at: `mlsrc/weights/best.pt`

This is a YOLOv10 model trained to detect:
- Person
- Helmet
- Safety vest

## Notes

- The API accepts images in JPG, JPEG, and PNG formats
- Default confidence threshold is 0.25 (can be adjusted per request)
- CORS is enabled for all origins (modify in production)

## 📁 Project Structure

\\\
ppe_yolo/
├── backend/
│   ├── app.py                 # Standard API
│   ├── app_enhanced.py        # Enhanced API with all features ⭐
│   ├── database.py            # Database models and configuration
│   ├── models.py              # Pydantic response models
│   ├── utils.py               # Utility functions
│   ├── test_api.py           # Basic API tests
│   ├── test_images.py        # Image testing scripts
│   └── test_with_output.py   # Tests with output images
├── mlsrc/
│   └── weights/
│       └── best.pt           # YOLOv10 model weights
├── output/                   # Output directory for test results
├── requirements.txt          # Python dependencies
└── README.md                # This file
\\\

## 🛡️ Safety Compliance Logic

The compliance checker verifies that each detected person has:
1. **Helmet** - Bounding box overlaps or is close to the person
2. **Safety Vest** - Bounding box overlaps or is close to the person

A person is considered **fully compliant** only if both helmet and vest are detected.

## 📊 Database Schema

### DetectionRecord Table
- Stores individual image detection results
- Includes image metadata, detection counts, compliance status
- Tracks processing time and endpoint used

### VideoProcessingRecord Table
- Stores video processing results
- Includes frame counts, compliance rates, average detections
- Tracks performance metrics

## 🔒 Production Considerations

1. **Security**: Configure CORS, add authentication, implement rate limiting
2. **Database**: Switch to PostgreSQL/MySQL for production, set up backups
3. **Performance**: Use Redis caching, implement request queuing, optimize with GPU
4. **Monitoring**: Add structured logging, error tracking, performance monitoring

## 📈 API Versioning

- **v1.0.0** (app.py) - Basic detection endpoints
- **v2.0.0** (app_enhanced.py) - Full-featured version with batch processing, video analysis, compliance checking, analytics, and database integration


## 📁 Project Structure

Enhanced API includes database.py (models), models.py (Pydantic schemas), and utils.py (helper functions).

## 🛡️ Safety Compliance

Verifies persons have helmet AND safety vest. Uses bounding box proximity detection.

## 📊 Database

SQLite stores detection history, compliance results, and video analytics. Auto-created on startup.

## 📈 Versions
- v1.0 (app.py): Basic detection
- v2.0 (app_enhanced.py): Batch, video, compliance, analytics, database

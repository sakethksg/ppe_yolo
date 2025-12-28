# 🦺 PPE Detection System

> *AI-powered workplace safety monitoring using YOLOv10 for real-time detection and compliance verification of Personal Protective Equipment.*

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![YOLOv10](https://img.shields.io/badge/YOLOv10-00FFFF?style=flat&logo=yolo)](https://github.com/THU-MIG/yolov10)
[![Python](https://img.shields.io/badge/Python-3.8+-blue?style=flat&logo=python)](https://www.python.org/)

## 📋 Overview

A comprehensive FastAPI application that detects Personal Protective Equipment (PPE) in images and videos, ensuring workplace safety compliance. The system uses a YOLOv10 model to identify persons, helmets, and safety vests, then automatically verifies whether workers are properly equipped.

### 🎯 Detected Classes
- 👤 **Person** (class 0)
- 🪖 **Helmet** (class 1)
- 🦺 **Safety Vest** (class 2)

## ✨ Key Features

- 🔍 **Real-time Detection** - Fast and accurate PPE detection with YOLOv10
- 📊 **Compliance Verification** - Automatic safety compliance checking
- 🎥 **Video Processing** - Frame-by-frame analysis with compliance tracking
- 📦 **Batch Processing** - Process up to 50 images simultaneously
- 📈 **Analytics Dashboard** - Historical trends and performance metrics
- 💾 **Persistent Storage** - SQLite database for detection records
- 🔄 **RESTful API** - Complete OpenAPI documentation
- 🖼️ **Annotated Output** - Visual results with bounding boxes

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8 or higher
- pip package manager
- YOLOv10 model weights

### 1️⃣ Clone and Install Dependencies

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd ppe_yolo

# Install required packages
pip install -r requirements.txt
```

### 2️⃣ Prepare Model Weights

Ensure your YOLOv10 model is at: `mlsrc/weights/best.pt`

### 3️⃣ Run the Application

**Enhanced Version (Recommended)** ⭐
```bash
cd backend
python app_enhanced.py
```

**Standard Version**
```bash
cd backend
python app.py
```

**Or using uvicorn directly:**
```bash
# Enhanced version with all features
uvicorn app_enhanced:app --reload --host 0.0.0.0 --port 8000

# Standard version
uvicorn app:app --reload --host 0.0.0.0 --port 8000
```

### 4️⃣ Access the API

- 🌐 **API Base**: http://localhost:8000
- 📖 **Swagger Docs**: http://localhost:8000/docs
- 📚 **ReDoc**: http://localhost:8000/redoc

---

## 🔌 API Endpoints

### Core Detection Endpoints

#### 1️⃣ Health Check
```http
GET /health
```
Verify API status and model availability.

#### 2️⃣ Model Information
```http
GET /model-info
```
Get details about the loaded model and detection classes.

#### 3️⃣ Single Image Detection
```http
POST /predict
```

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file` | File | *required* | Image file (JPG, JPEG, PNG) |
| `conf_threshold` | float | 0.25 | Confidence threshold (0.0-1.0) |
| `check_compliance_flag` | bool | false | Enable PPE compliance checking |

**Example (curl):**
```bash
curl -X POST "http://localhost:8000/predict?conf_threshold=0.25&check_compliance_flag=true" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@path/to/image.jpg"
```

**Example (Python):**
```python
import requests

url = "http://localhost:8000/predict"
with open("image.jpg", "rb") as f:
    files = {"file": f}
    params = {"conf_threshold": 0.25, "check_compliance_flag": True}
    response = requests.post(url, files=files, params=params)
    
print(response.json())
```

<details>
<summary><b>📄 Sample Response</b></summary>

```json
{
  "success": true,
  "request_id": "req_abc123xyz",
  "metadata": {
    "filename": "worksite.jpg",
    "width": 1920,
    "height": 1080,
    "size_kb": 245.3,
    "format": "JPEG"
  },
  "detections_count": 5,
  "detections": [
    {
      "class_id": 0,
      "class_name": "person",
      "confidence": 0.923,
      "bounding_box": {"x1": 150.5, "y1": 200.3, "x2": 450.2, "y2": 600.8},
      "area": 120060.0
    }
  ],
  "summary": {"person": 2, "helmet": 2, "safety-vest": 1},
  "compliance": {
    "is_compliant": false,
    "message": "1 PPE violation(s) detected",
    "details": {
      "total_persons": 2,
      "persons_with_helmet": 2,
      "persons_with_vest": 1,
      "fully_compliant": 1
    },
    "violations": ["Person #2 is not wearing a safety vest"]
  },
  "metrics": {
    "processing_time_ms": 123.45,
    "timestamp": "2025-12-28T12:00:00Z"
  }
}
```
</details>

---

#### 4️⃣ Annotated Image Output
```http
POST /predict-image
```
Returns an image with bounding boxes drawn around detected objects.

**Parameters:** Same as `/predict` endpoint

**Returns:** PNG image with visual annotations

---

### 🚀 Advanced Endpoints

#### 5️⃣ Batch Processing
```http
POST /predict-batch
```
Process multiple images simultaneously (up to 50 images).

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `files` | File[] | *required* | Multiple image files |
| `conf_threshold` | float | 0.25 | Confidence threshold |
| `check_compliance_flag` | bool | false | Enable compliance checking |

**Example:**
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

print(f"✅ Processed: {result['processed_images']}/{result['total_images']}")
print(f"⏱️  Total time: {result['total_processing_time_ms']}ms")
print(f"📊 Avg per image: {result['average_time_per_image_ms']}ms")
```

---

#### 6️⃣ Compliance Checking
```http
POST /check-compliance
```
Dedicated endpoint for PPE compliance verification.

**Example:**
```python
import requests

url = "http://localhost:8000/check-compliance"
with open("worksite.jpg", "rb") as f:
    files = {"file": f}
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

---

#### 7️⃣ Video Processing
```http
POST /predict-video
```
Process video files frame by frame with compliance tracking.

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `file` | File | *required* | Video file (mp4, avi, mov, etc.) |
| `conf_threshold` | float | 0.25 | Confidence threshold |
| `sample_rate` | int | 1 | Process every Nth frame |
| `max_frames` | int | 300 | Maximum frames to process |

**Example:**
```python
import requests

url = "http://localhost:8000/predict-video"
with open("worksite_video.mp4", "rb") as f:
    files = {"file": f}
    params = {
        "conf_threshold": 0.25,
        "sample_rate": 5,  # Process every 5th frame
        "max_frames": 100
    }
    response = requests.post(url, files=files, params=params)

result = response.json()
print(f"🎥 Processed {result['processed_frames']} frames")
print(f"✅ Compliance rate: {result['compliance_rate']}%")
print(f"📊 Total detections: {result['overall_summary']['total_detections']}")
```

---

### 📊 Analytics Endpoints

#### 8️⃣ Analytics Dashboard
```http
GET /analytics
```
Get historical detection analytics and statistics.

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `days` | int | 7 | Number of days to analyze (max: 365) |
| `endpoint` | string | null | Filter by specific endpoint |

**Example:**
```python
import requests

url = "http://localhost:8000/analytics?days=30"
response = requests.get(url)
analytics = response.json()

print(f"📊 Total requests: {analytics['total_requests']}")
print(f"✅ Compliance rate: {analytics['compliance_statistics']['compliance_rate_percent']}%")
print(f"⏱️  Avg processing time: {analytics['performance_metrics']['avg_processing_time_ms']}ms")

# View daily trends
for day in analytics['detection_trends']:
    print(f"{day['date']}: {day['detections']} detections")
```

---

#### 9️⃣ Recent Detections
```http
GET /recent-detections
```
Retrieve recent detection records.

**Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | int | 10 | Number of records (max: 100) |
| `endpoint` | string | null | Filter by specific endpoint |

**Example:**
```python
import requests

url = "http://localhost:8000/recent-detections?limit=20"
response = requests.get(url)
records = response.json()

for record in records['records']:
    timestamp = record['timestamp']
    filename = record['filename']
    count = record['detections_count']
    print(f"{timestamp}: {filename} - {count} detections")
```

---

## 📁 Project Structure

```
ppe_yolo/
├── backend/
│   ├── app.py                 # Standard API (v1.0)
│   ├── app_enhanced.py        # Enhanced API with all features ⭐ (v2.0)
│   ├── database.py            # SQLAlchemy database models
│   ├── models.py              # Pydantic response schemas
│   ├── utils.py               # Utility functions
│   └── init_db.py             # Database initialization
├── frontend/                  # Next.js web interface
│   ├── app/                   # Application pages
│   ├── components/            # React components
│   └── lib/                   # Utilities and API client
├── mlsrc/
│   └── weights/
│       └── best.pt            # YOLOv10 model weights
├── nginx/                     # Nginx configuration
├── output/                    # Test output directory
├── docker-compose.yml         # Docker orchestration
├── requirements.txt           # Python dependencies
└── README.md                  # This file
```

---

## 💾 Database

The enhanced version automatically creates a SQLite database (`ppe_detection.db`) to store:

### 📊 DetectionRecord Table
- Individual image detection results
- Image metadata (dimensions, size, format)
- Detection counts and summaries
- Compliance status and violations
- Processing time metrics
- Timestamps and request IDs

### 🎥 VideoProcessingRecord Table
- Video processing results
- Frame counts and sample rates
- Overall compliance rates
- Average detections per frame
- Performance metrics

**Note:** Database is automatically initialized on first startup.

---

## 🛡️ Safety Compliance Logic

The compliance checker verifies that each detected person has both required PPE items:

1. **Helmet Detection** 🪖
   - Bounding box must overlap or be in close proximity to the person
   - Uses spatial relationship analysis

2. **Safety Vest Detection** 🦺
   - Bounding box must overlap or be in close proximity to the person
   - Validates proper positioning

**Compliance Status:**
- ✅ **Fully Compliant** - Person has both helmet AND safety vest
- ⚠️ **Violation** - Person missing one or both PPE items
- 📊 **Compliance Rate** - Percentage of workers properly equipped

---

## 🐳 Docker Deployment

### Development
```bash
docker-compose -f docker-compose.dev.yml up
```

### Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

The system includes:
- Backend API service
- Frontend web interface
- Nginx reverse proxy
- Volume persistence for database and uploads

---

## 📊 API Versions

### v1.0.0 (`app.py`) - Basic Detection
- Single image detection
- Annotated image output
- Health check and model info

### v2.0.0 (`app_enhanced.py`) - Full-Featured ⭐
- All v1.0 features
- Batch processing (up to 50 images)
- Video processing with frame sampling
- Dedicated compliance checking
- Analytics and historical trends
- Database integration
- Recent detections retrieval
- Enhanced response models

---

## 🔒 Production Considerations

### Security
- ⚙️ Configure CORS for specific origins
- 🔐 Implement authentication/authorization
- 🚦 Add rate limiting to prevent abuse
- 🛡️ Validate and sanitize file uploads
- 🔒 Use HTTPS in production

### Database
- 🗄️ Switch to PostgreSQL/MySQL for production
- 💾 Implement regular backups
- 📊 Set up database migrations
- 🔍 Add indexes for query optimization

### Performance
- ⚡ Use Redis for caching
- 📬 Implement request queuing for high load
- 🖥️ Optimize with GPU acceleration
- 🔄 Load balancing for multiple instances

### Monitoring
- 📝 Add structured logging
- 🐛 Integrate error tracking (e.g., Sentry)
- 📈 Performance monitoring and alerting
- 📊 Resource usage tracking

---

## 🛠️ Development

### Running Tests
```bash
cd backend
python test_api.py
python test_images.py
python test_with_output.py
```

### Code Quality
```bash
# Format code
black backend/

# Lint
pylint backend/

# Type checking
mypy backend/
```

---

## 📝 Notes

- Supports JPG, JPEG, and PNG image formats
- MP4, AVI, MOV video formats supported
- Default confidence threshold: 0.25 (adjustable per request)
- CORS enabled for development (configure for production)
- Model weights must be present at `mlsrc/weights/best.pt`

---

## 📄 License

This project is licensed under the MIT License.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

For issues and questions, please open an issue on the GitHub repository.

---

<div align="center">

**Built with ❤️ using FastAPI and YOLOv10**

</div>

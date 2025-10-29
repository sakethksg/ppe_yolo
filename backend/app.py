from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from ultralytics import YOLO
import cv2
import numpy as np
from PIL import Image
import io
from typing import List, Dict
import os

app = FastAPI(
    title="PPE Detection API",
    description="API for detecting Personal Protective Equipment (Person, Helmet, Safety-vest)",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load the YOLO model
# Get the path relative to the backend directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "..", "mlsrc", "weights", "best.pt")
model = None

@app.on_event("startup")
async def load_model():
    """Load the YOLO model on startup"""
    global model
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model not found at {MODEL_PATH}")
    model = YOLO(MODEL_PATH)
    print(f"Model loaded successfully from {MODEL_PATH}")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "PPE Detection API",
        "endpoints": {
            "/predict": "POST - Upload image for PPE detection (JSON response)",
            "/predict-image": "POST - Upload image for PPE detection (returns annotated image)",
            "/health": "GET - Check API health status",
            "/model-info": "GET - Get model information"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "model_loaded": model is not None
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
        "num_classes": len(model.names)
    }

@app.post("/predict")
async def predict(
    file: UploadFile = File(...),
    conf_threshold: float = 0.25
):
    """
    Detect PPE in uploaded image
    
    Parameters:
    - file: Image file (jpg, jpeg, png)
    - conf_threshold: Confidence threshold for detections (default: 0.25)
    
    Returns:
    - detections: List of detected objects with bounding boxes and confidence scores
    - summary: Count of each detected class
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Validate file type
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert PIL Image to numpy array
        img_array = np.array(image)
        
        # Convert RGB to BGR for OpenCV (if needed)
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
                    
                    detection = {
                        "class_id": class_id,
                        "class_name": class_name,
                        "confidence": round(confidence, 3),
                        "bounding_box": {
                            "x1": round(x1, 2),
                            "y1": round(y1, 2),
                            "x2": round(x2, 2),
                            "y2": round(y2, 2)
                        }
                    }
                    detections.append(detection)
                    
                    # Update class counts
                    if class_name in class_counts:
                        class_counts[class_name] += 1
        
        return JSONResponse(content={
            "success": True,
            "image_name": file.filename,
            "detections_count": len(detections),
            "detections": detections,
            "summary": class_counts,
            "confidence_threshold": conf_threshold
        })
        
    except Exception as e:
        import traceback
        print(f"Error details: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.post("/predict-image")
async def predict_image(
    file: UploadFile = File(...),
    conf_threshold: float = 0.25
):
    """
    Detect PPE in uploaded image and return annotated image
    
    Parameters:
    - file: Image file (jpg, jpeg, png)
    - conf_threshold: Confidence threshold for detections (default: 0.25)
    
    Returns:
    - Annotated image with bounding boxes and labels
    """
    if model is None:
        raise HTTPException(status_code=503, detail="Model not loaded")
    
    # Validate file type
    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    try:
        # Read image file
        contents = await file.read()
        image = Image.open(io.BytesIO(contents))
        
        # Convert PIL Image to numpy array
        img_array = np.array(image)
        
        # Convert RGB to BGR for OpenCV
        if len(img_array.shape) == 3 and img_array.shape[2] == 3:
            img_array = cv2.cvtColor(img_array, cv2.COLOR_RGB2BGR)
        
        # Run inference
        results = model.predict(source=img_array, conf=conf_threshold, verbose=False)
        
        # Draw bounding boxes on the image
        annotated_img = img_array.copy()
        
        # Define colors for each class (BGR format)
        colors = {
            "person": (0, 255, 0),      # Green
            "helmet": (255, 0, 0),       # Blue
            "safety-vest": (0, 165, 255) # Orange
        }
        
        for result in results:
            if result.boxes is not None and len(result.boxes) > 0:
                for box, conf, cls in zip(result.boxes.xyxy, result.boxes.conf, result.boxes.cls):
                    x1, y1, x2, y2 = map(int, box)
                    confidence = float(conf)
                    class_id = int(cls)
                    class_name = model.names[class_id]
                    
                    # Get color for this class
                    color = colors.get(class_name, (255, 255, 255))
                    
                    # Draw bounding box
                    cv2.rectangle(annotated_img, (x1, y1), (x2, y2), color, 2)
                    
                    # Create label with class name and confidence
                    label = f"{class_name}: {confidence:.2f}"
                    
                    # Get label size for background rectangle
                    (label_width, label_height), baseline = cv2.getTextSize(
                        label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2
                    )
                    
                    # Draw background rectangle for label
                    cv2.rectangle(
                        annotated_img,
                        (x1, y1 - label_height - baseline - 5),
                        (x1 + label_width, y1),
                        color,
                        -1
                    )
                    
                    # Draw label text
                    cv2.putText(
                        annotated_img,
                        label,
                        (x1, y1 - baseline - 5),
                        cv2.FONT_HERSHEY_SIMPLEX,
                        0.6,
                        (255, 255, 255),
                        2
                    )
        
        # Convert back to RGB for PIL
        annotated_img = cv2.cvtColor(annotated_img, cv2.COLOR_BGR2RGB)
        
        # Convert to PIL Image
        pil_img = Image.fromarray(annotated_img)
        
        # Save to bytes buffer
        img_buffer = io.BytesIO()
        pil_img.save(img_buffer, format="JPEG", quality=95)
        img_buffer.seek(0)
        
        return StreamingResponse(img_buffer, media_type="image/jpeg")
        
    except Exception as e:
        import traceback
        print(f"Error details: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

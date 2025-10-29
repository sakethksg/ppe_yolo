'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, StopCircle, Settings, Download, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { apiClient } from '@/lib/api';
import type { PredictionResponse } from '@/lib/api';

export default function LiveDetectionPage() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFrame, setCurrentFrame] = useState<string | null>(null);
  const [latestResult, setLatestResult] = useState<PredictionResponse | null>(null);
  const [fps, setFps] = useState(0);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [checkCompliance, setCheckCompliance] = useState(true);
  const [processInterval, setProcessInterval] = useState(4000); // ms between API calls (increased to 4000 for stability and lower latency)
  const [showAnnotated, setShowAnnotated] = useState(true); // Toggle between video and annotated view
  const [autoCapture, setAutoCapture] = useState(false); // Toggle automatic capture

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const frameCountRef = useRef(0);
  const lastFpsUpdateRef = useRef(Date.now());
  const processingRef = useRef(false); // Prevent concurrent processing
  const currentFrameRef = useRef<string | null>(null); // Use ref instead of state dependency

  // Start webcam stream
  const startCamera = useCallback(async () => {
    try {
      setError(null);
      
      // Check if backend is accessible
      try {
        const healthCheck = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'}/health`);
        if (!healthCheck.ok) {
          throw new Error('Backend not responding');
        }
      } catch (error) {
        setError('Backend server is not running. Please start the backend on port 8001.');
        console.error('Backend error:', error);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        await new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              resolve();
            };
          }
        });
        
        setIsStreaming(true);
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('Backend')) {
        setError(err.message);
      } else {
        setError('Failed to access camera. Please grant camera permissions and ensure your camera is not in use by another application.');
      }
      console.error('Camera error:', err);
    }
  }, []);

  // Stop webcam stream
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsStreaming(false);
    setCurrentFrame(null);
    setLatestResult(null);
    setFps(0);
    frameCountRef.current = 0;
    processingRef.current = false;
  }, []);

  // Capture frame and send to API
  const captureAndProcess = useCallback(async () => {
    // Prevent concurrent processing
    if (processingRef.current || !videoRef.current || !canvasRef.current || !isStreaming) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log('Video not ready yet, skipping frame');
      return;
    }

    processingRef.current = true;

    try {
      // Reduce canvas resolution to prevent memory issues (max 480x360 for lower latency)
      const maxWidth = 480;
      const maxHeight = 360;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      
      if (videoWidth === 0 || videoHeight === 0) {
        console.log('Video dimensions not ready');
        processingRef.current = false;
        return;
      }
      
      let width = videoWidth;
      let height = videoHeight;
      
      if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw current video frame to canvas
      ctx.drawImage(video, 0, 0, width, height);

      // Convert canvas to blob with lower quality to reduce size
      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, 'image/jpeg', 0.4); // Reduced from 0.6 to 0.4
      });

      if (!blob) {
        console.log('Failed to create blob');
        processingRef.current = false;
        return;
      }

      // Create File from blob
      const file = new File([blob], `frame-${Date.now()}.jpg`, { type: 'image/jpeg' });

      console.log('Sending frame to API...');

      // Only get annotated image to reduce latency
      const annotatedBlob = await apiClient.predictImage(file, confidenceThreshold);
      
      // Revoke old object URL to free memory
      if (currentFrameRef.current) {
        URL.revokeObjectURL(currentFrameRef.current);
      }
      
      const annotatedUrl = URL.createObjectURL(annotatedBlob);
      currentFrameRef.current = annotatedUrl;
      setCurrentFrame(annotatedUrl);

      // Clear error if processing succeeds
      setError(null);

      // Update FPS counter
      frameCountRef.current++;
      const now = Date.now();
      const elapsed = now - lastFpsUpdateRef.current;
      if (elapsed >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / elapsed));
        frameCountRef.current = 0;
        lastFpsUpdateRef.current = now;
      }

      console.log('Frame processed successfully');
    } catch (err) {
      console.error('Processing error:', err);
      // Don't stop streaming on error, just log it
      setError('Failed to process frame. Check console for details.');
    } finally {
      processingRef.current = false;
    }
  }, [isStreaming, confidenceThreshold]);

  // Start/stop processing loop
  useEffect(() => {
    if (isStreaming && autoCapture) {
      console.log('Starting automatic processing interval');
      intervalRef.current = setInterval(() => {
        captureAndProcess();
      }, processInterval);
    } else if (intervalRef.current) {
      console.log('Stopping automatic processing');
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming, autoCapture, processInterval]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
      // Cleanup any remaining object URLs
      if (currentFrameRef.current) {
        URL.revokeObjectURL(currentFrameRef.current);
      }
    };
  }, [stopCamera]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Live Detection</h1>
          <p className="text-muted-foreground mt-2">
            Real-time PPE detection using your webcam
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/80 mt-1">{error}</p>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <div className="lg:col-span-2 space-y-4">
            {/* Video Display */}
            <div className="rounded-lg border bg-card overflow-hidden">
              <div className="aspect-video bg-black relative">
                {/* Video element - always visible when streaming */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`absolute inset-0 w-full h-full object-contain ${
                    showAnnotated && currentFrame ? 'hidden' : ''
                  }`}
                />

                {/* Hidden canvas for frame capture */}
                <canvas ref={canvasRef} className="hidden" />

                {/* Display annotated frame when available */}
                {showAnnotated && currentFrame && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={currentFrame}
                    alt="Live detection"
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                )}

                {/* Placeholder when not streaming */}
                {!isStreaming && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-16 h-16 mx-auto text-white/50 mb-4" />
                      <p className="text-white/70">
                        Click &quot;Start Camera&quot; to begin
                      </p>
                    </div>
                  </div>
                )}

                {/* Processing indicator */}
                {isStreaming && processingRef.current && (
                  <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-md bg-blue-500/90 text-white text-xs font-medium">
                    Processing...
                  </div>
                )}

                {/* View toggle button */}
                {isStreaming && currentFrame && (
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                    <button
                      onClick={() => setShowAnnotated(!showAnnotated)}
                      className="px-4 py-2 rounded-md bg-black/70 text-white text-sm font-medium hover:bg-black/80 transition-colors"
                    >
                      {showAnnotated ? 'Show Live Video' : 'Show Detections'}
                    </button>
                  </div>
                )}

                {/* FPS Counter */}
                {isStreaming && (
                  <div className="absolute top-4 left-4 px-3 py-1.5 rounded-md bg-black/70 text-white text-sm font-mono">
                    {fps} FPS
                  </div>
                )}

                {/* Recording Indicator */}
                {isStreaming && (
                  <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-md bg-red-500/90 text-white text-sm font-medium">
                    <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    LIVE
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-3 flex-wrap">
              {!isStreaming ? (
                <button
                  onClick={startCamera}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                >
                  <Camera className="w-5 h-5" />
                  Start Camera
                </button>
              ) : (
                <>
                  <button
                    onClick={stopCamera}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors font-medium"
                  >
                    <StopCircle className="w-5 h-5" />
                    Stop Camera
                  </button>

                  <button
                    onClick={() => {
                      if (!processingRef.current) {
                        captureAndProcess();
                      }
                    }}
                    disabled={processingRef.current}
                    className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <Camera className="w-5 h-5" />
                    Capture & Detect
                  </button>

                  <button
                    onClick={() => setAutoCapture(!autoCapture)}
                    className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg border transition-colors font-medium ${
                      autoCapture
                        ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
                        : 'bg-background hover:bg-accent'
                    }`}
                  >
                    {autoCapture ? '⏸️ Pause Auto' : '▶️ Auto Capture'}
                  </button>
                </>
              )}

              {currentFrame && isStreaming && (
                <button
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = currentFrame;
                    a.download = `live-detection-${Date.now()}.jpg`;
                    a.click();
                  }}
                  className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg border bg-background hover:bg-accent transition-colors font-medium"
                >
                  <Download className="w-5 h-5" />
                  Save Frame
                </button>
              )}
              
              {isStreaming && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${processingRef.current ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
                  {processingRef.current ? 'Processing frame...' : 'Ready'}
                </div>
              )}
            </div>
          </div>

          {/* Settings & Results */}
          <div className="space-y-4">
            {/* Settings Card */}
            <div className="rounded-lg border bg-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5" />
                <h2 className="text-lg font-semibold">Settings</h2>
              </div>

              <div className="space-y-4">
                {/* Confidence Threshold */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Confidence Threshold</label>
                    <span className="text-sm text-muted-foreground">{confidenceThreshold.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={confidenceThreshold}
                    onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                    disabled={isStreaming}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Higher values = fewer but more accurate detections
                  </p>
                </div>

                {/* Process Interval */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Process Interval</label>
                    <span className="text-sm text-muted-foreground">{processInterval}ms</span>
                  </div>
                  <input
                    type="range"
                    min="2000"
                    max="8000"
                    step="1000"
                    value={processInterval}
                    onChange={(e) => setProcessInterval(parseInt(e.target.value))}
                    disabled={isStreaming}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Time between frame processing (recommended: 4000ms or higher for stability)
                  </p>
                </div>

                {/* Compliance Check */}
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Check Compliance</label>
                  <button
                    onClick={() => setCheckCompliance(!checkCompliance)}
                    disabled={isStreaming}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      checkCompliance ? 'bg-primary' : 'bg-muted'
                    } ${isStreaming ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        checkCompliance ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Settings can only be changed when the camera is stopped
                </p>
              </div>
            </div>

            {/* Current Detection Results */}
            {latestResult && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-lg font-semibold mb-4">Detection Info</h2>

                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Detection results are shown in the annotated image with bounding boxes.
                  </p>
                  
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Update</span>
                      <span className="font-medium">{new Date().toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

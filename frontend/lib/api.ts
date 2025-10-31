/**
 * API Client for PPE Detection Backend
 * Base URL: http://localhost:8001
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001';

export interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  bounding_box: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
  };
  area: number;
}

export interface ImageMetadata {
  filename: string;
  width: number;
  height: number;
  size_kb: number;
  format: string;
}

export interface DetectionSummary {
  person: number;
  helmet: number;
  'safety-vest': number;
}

export interface ComplianceStatus {
  is_compliant: boolean;
  message: string;
  details: Record<string, unknown>;
  violations: string[];
  warnings: string[];
}

export interface HealthCheckResponse {
  status: string;
  model_loaded: boolean;
}

export interface ModelInfoResponse {
  model_name: string;
  model_version: string;
  classes: string[];
}

export interface PredictionResponse {
  success: boolean;
  request_id: string;
  metadata: ImageMetadata;
  detections_count: number;
  detections: Detection[];
  summary: DetectionSummary;
  confidence_threshold: number;
  metrics: {
    processing_time_ms: number;
    timestamp: string;
    request_id: string;
  };
  compliance?: ComplianceStatus;
}

export interface BatchPredictionResponse {
  success: boolean;
  request_id: string;
  total_images: number;
  processed_images: number;
  failed_images: number;
  results: PredictionResponse[];
  total_processing_time_ms: number;
  average_time_per_image_ms: number;
}

export interface AnalyticsResponse {
  total_requests: number;
  date_range: {
    start: string;
    end: string;
  };
  summary: Record<string, unknown>;
  compliance_statistics: {
    compliance_rate?: number;
    compliant_count?: number;
    non_compliant_count?: number;
    [key: string]: unknown;
  };
  top_violations: Array<Record<string, unknown>>;
  detection_trends: Array<Record<string, unknown>>;
  performance_metrics: {
    avg_processing_time_ms?: number;
    [key: string]: unknown;
  };
}

export interface RecentDetection {
  request_id: string;
  filename: string;
  timestamp: string;
  endpoint: string;
  detections_count: number;
  summary: DetectionSummary;
  is_compliant: boolean;
  processing_time_ms: number;
}

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseURL}/health`);
    if (!response.ok) throw new Error('Health check failed');
    return response.json();
  }

  /**
   * Get model info
   */
  async getModelInfo(): Promise<ModelInfoResponse> {
    const response = await fetch(`${this.baseURL}/model-info`);
    if (!response.ok) throw new Error('Failed to get model info');
    return response.json();
  }

  /**
   * Predict PPE in single image
   */
  async predict(
    file: File,
    confThreshold = 0.25,
    checkCompliance = false
  ): Promise<PredictionResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams({
      conf_threshold: confThreshold.toString(),
      check_compliance_flag: checkCompliance.toString(),
    });

    const response = await fetch(`${this.baseURL}/predict?${params}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Prediction failed');
    }

    return response.json();
  }

  /**
   * Predict and get annotated image
   */
  async predictImage(
    file: File,
    confThreshold = 0.25
  ): Promise<Blob> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams({
      conf_threshold: confThreshold.toString(),
    });

    const response = await fetch(`${this.baseURL}/predict-image?${params}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to get annotated image');
    }

    return response.blob();
  }

  /**
   * Batch prediction
   */
  async predictBatch(
    files: File[],
    confThreshold = 0.25,
    checkCompliance = false
  ): Promise<BatchPredictionResponse> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));

    const params = new URLSearchParams({
      conf_threshold: confThreshold.toString(),
      check_compliance_flag: checkCompliance.toString(),
    });

    const response = await fetch(`${this.baseURL}/predict-batch?${params}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Batch prediction failed');
    }

    return response.json();
  }

  /**
   * Check compliance
   */
  async checkCompliance(
    file: File,
    confThreshold = 0.25
  ): Promise<ComplianceStatus> {
    const formData = new FormData();
    formData.append('file', file);

    const params = new URLSearchParams({
      conf_threshold: confThreshold.toString(),
    });

    const response = await fetch(`${this.baseURL}/check-compliance?${params}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Compliance check failed');
    }

    return response.json();
  }

  /**
   * Get analytics
   */
  async getAnalytics(
    days: number = 7,
    endpoint?: string
  ): Promise<AnalyticsResponse> {
    const params = new URLSearchParams({
      days: days.toString(),
    });
    
    if (endpoint) {
      params.append('endpoint', endpoint);
    }

    const response = await fetch(`${this.baseURL}/analytics?${params}`);
    if (!response.ok) throw new Error('Failed to get analytics');
    return response.json();
  }

  /**
   * Get recent detections
   */
  async getRecentDetections(
    limit: number = 10,
    endpoint?: string
  ): Promise<{ success: boolean; total: number; records: RecentDetection[] }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
    });
    
    if (endpoint) {
      params.append('endpoint', endpoint);
    }

    const response = await fetch(`${this.baseURL}/recent-detections?${params}`);
    if (!response.ok) throw new Error('Failed to get recent detections');
    return response.json();
  }
}

// Export singleton instance
export const apiClient = new APIClient();

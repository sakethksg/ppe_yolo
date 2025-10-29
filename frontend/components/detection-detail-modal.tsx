'use client';

import { useState } from 'react';
import { type PredictionResponse } from '@/lib/api';
import { ComplianceStatusBadge } from '@/components/compliance-status-badge';
import { DetectionSummary } from '@/components/detection-summary';
import { formatFileSize, formatProcessingTime, formatTimestamp } from '@/lib/utils';
import { X, Download, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface DetectionDetailModalProps {
  result: PredictionResponse;
  imagePreview: string | null;
  annotatedImage: string | null;
  onClose: () => void;
}

export function DetectionDetailModal({
  result,
  imagePreview,
  annotatedImage,
  onClose,
}: DetectionDetailModalProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const displayImage = showOriginal ? imagePreview : annotatedImage;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border bg-card shadow-lg">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-card px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Detection Details
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {result.metadata.filename}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-accent transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Image with Toggle */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-foreground">Image Preview</h3>
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium border bg-background hover:bg-accent transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5" />
                {showOriginal ? 'Show Annotated' : 'Show Original'}
              </button>
            </div>
            <div className="rounded-lg border overflow-hidden bg-muted">
              {displayImage && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={displayImage}
                  alt={showOriginal ? result.metadata.filename : `${result.metadata.filename} - Annotated`}
                  className="w-full h-auto"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {showOriginal 
                ? 'Showing original image without bounding boxes' 
                : 'Showing annotated image with detection bounding boxes'}
            </p>
          </div>

          {/* Compliance Status */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-background">
            <div className="flex items-center gap-3">
              <ComplianceStatusBadge isCompliant={result.compliance?.is_compliant} />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {result.compliance?.message || 'Compliance check not performed'}
                </p>
                {result.compliance && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {result.summary.person} person(s) • {result.summary.helmet} helmet(s) • {result.summary['safety-vest']} vest(s)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Violations & Warnings */}
          {result.compliance && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Violations */}
              {result.compliance.violations.length > 0 && (
                <div className="p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <h3 className="text-sm font-semibold text-destructive">
                      Violations ({result.compliance.violations.length})
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {result.compliance.violations.map((violation, idx) => (
                      <li key={idx} className="text-sm text-foreground">
                        • {violation}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Warnings */}
              {result.compliance.warnings.length > 0 && (
                <div className="p-4 rounded-lg border border-chart-4/20 bg-chart-4/5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-chart-4" />
                    <h3 className="text-sm font-semibold text-chart-4">
                      Warnings ({result.compliance.warnings.length})
                    </h3>
                  </div>
                  <ul className="space-y-1">
                    {result.compliance.warnings.map((warning, idx) => (
                      <li key={idx} className="text-sm text-foreground">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Detection Summary */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Detection Summary
            </h3>
            <DetectionSummary summary={result.summary} />
          </div>

          {/* Detections List */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">
              All Detections ({result.detections_count})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {result.detections.map((detection, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg border bg-background"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground capitalize">
                      {detection.class_name}
                    </span>
                    <span className="text-xs font-mono text-muted-foreground">
                      {(detection.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>Position: ({detection.bounding_box.x1.toFixed(0)}, {detection.bounding_box.y1.toFixed(0)}) to ({detection.bounding_box.x2.toFixed(0)}, {detection.bounding_box.y2.toFixed(0)})</p>
                    <p>Area: {detection.area.toFixed(0)} px²</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 rounded-lg border bg-background">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Image Information
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Filename:</dt>
                  <dd className="font-medium text-foreground">{result.metadata.filename}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Dimensions:</dt>
                  <dd className="font-medium text-foreground">
                    {result.metadata.width} × {result.metadata.height}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Size:</dt>
                  <dd className="font-medium text-foreground">
                    {formatFileSize(result.metadata.size_kb)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Format:</dt>
                  <dd className="font-medium text-foreground">{result.metadata.format}</dd>
                </div>
              </dl>
            </div>

            <div className="p-4 rounded-lg border bg-background">
              <h3 className="text-sm font-semibold text-foreground mb-3">
                Processing Metrics
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Processing Time:</dt>
                  <dd className="font-medium text-foreground">
                    {formatProcessingTime(result.metrics.processing_time_ms)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Confidence:</dt>
                  <dd className="font-medium text-foreground">
                    {result.confidence_threshold.toFixed(2)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Request ID:</dt>
                  <dd className="font-mono text-xs text-foreground">
                    {result.request_id}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Timestamp:</dt>
                  <dd className="text-xs text-foreground">
                    {formatTimestamp(result.metrics.timestamp)}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={() => {
                const dataStr = JSON.stringify(result, null, 2);
                const blob = new Blob([dataStr], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `detection-${result.request_id}.json`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border bg-background hover:bg-accent transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">Download JSON</span>
            </button>

            {annotatedImage && (
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = annotatedImage;
                  a.download = `annotated-${result.metadata.filename}`;
                  a.click();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Download Annotated Image</span>
              </button>
            )}

            {imagePreview && (
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = imagePreview;
                  a.download = result.metadata.filename;
                  a.click();
                }}
                className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border bg-background hover:bg-accent transition-colors"
              >
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Download Original</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { type PredictionResponse, apiClient } from '@/lib/api';
import { ComplianceStatusBadge } from '@/components/compliance-status-badge';
import { DetectionSummary } from '@/components/detection-summary';
import { formatFileSize, formatProcessingTime, cn } from '@/lib/utils';
import { Eye, Download } from 'lucide-react';
import { DetectionDetailModal } from '@/components/detection-detail-modal';

interface DetectionResultCardProps {
  result: PredictionResponse;
  file: File;
  className?: string;
}

export function DetectionResultCard({ result, file, className }: DetectionResultCardProps) {
  const [showDetails, setShowDetails] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [loadingAnnotated, setLoadingAnnotated] = useState(true);

  // Generate original image preview
  useEffect(() => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, [file]);

  // Fetch annotated image with bounding boxes
  useEffect(() => {
    async function fetchAnnotatedImage() {
      try {
        setLoadingAnnotated(true);
        const blob = await apiClient.predictImage(file, result.confidence_threshold);
        const url = URL.createObjectURL(blob);
        setAnnotatedImage(url);
      } catch (error) {
        console.error('Failed to fetch annotated image:', error);
        // Fallback to original image if annotation fails
        setAnnotatedImage(imagePreview);
      } finally {
        setLoadingAnnotated(false);
      }
    }

    if (imagePreview) {
      fetchAnnotatedImage();
    }
  }, [file, result.confidence_threshold, imagePreview]);

  const isCompliant = result.compliance?.is_compliant;

  return (
    <>
      <div
        className={cn(
          'rounded-lg border bg-card overflow-hidden transition-all hover:shadow-md',
          className
        )}
      >
        {/* Image Preview with Bounding Boxes */}
        <div className="relative aspect-video bg-muted">
          {loadingAnnotated ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : annotatedImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={annotatedImage}
              alt={`${result.metadata.filename} - Annotated`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-sm text-muted-foreground">Failed to load image</p>
            </div>
          )}
          
          {/* Compliance Badge Overlay */}
          <div className="absolute top-2 right-2">
            <ComplianceStatusBadge isCompliant={isCompliant} />
          </div>
        </div>

        {/* Card Content */}
        <div className="p-4 space-y-3">
          {/* Filename */}
          <div>
            <h3 className="font-medium text-sm text-foreground truncate" title={result.metadata.filename}>
              {result.metadata.filename}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {result.metadata.width} × {result.metadata.height} • {formatFileSize(result.metadata.size_kb)}
            </p>
          </div>

          {/* Detection Summary */}
          <DetectionSummary summary={result.summary} variant="compact" />

          {/* Stats */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>{result.detections_count} detections</span>
            <span>•</span>
            <span>{formatProcessingTime(result.metrics.processing_time_ms)}</span>
          </div>

          {/* Compliance Violations */}
          {result.compliance && !result.compliance.is_compliant && result.compliance.violations.length > 0 && (
            <div className="pt-2 border-t">
              <p className="text-xs font-medium text-destructive mb-1">Violations:</p>
              <ul className="space-y-0.5">
                {result.compliance.violations.slice(0, 2).map((violation, idx) => (
                  <li key={idx} className="text-xs text-muted-foreground">
                    • {violation}
                  </li>
                ))}
                {result.compliance.violations.length > 2 && (
                  <li className="text-xs text-muted-foreground">
                    • +{result.compliance.violations.length - 2} more
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setShowDetails(true)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Details
            </button>
            
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
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border bg-background hover:bg-accent transition-colors"
              title="Download JSON"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetails && (
        <DetectionDetailModal
          result={result}
          imagePreview={imagePreview}
          annotatedImage={annotatedImage}
          onClose={() => setShowDetails(false)}
        />
      )}
    </>
  );
}

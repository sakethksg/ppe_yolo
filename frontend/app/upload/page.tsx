'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ImageUploader } from '@/components/image-uploader';
import { DetectionResultCard } from '@/components/detection-result-card';
import { apiClient, type PredictionResponse } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [confThreshold, setConfThreshold] = useState(0.25);
  const [checkCompliance, setCheckCompliance] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<PredictionResponse[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
    setResults([]);
    setError(null);
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleProcess = async () => {
    if (selectedFiles.length === 0) return;

    setProcessing(true);
    setError(null);
    setResults([]);

    try {
      let processedResults: PredictionResponse[] = [];

      if (selectedFiles.length === 1) {
        // Single file processing
        const result = await apiClient.predict(
          selectedFiles[0],
          confThreshold,
          checkCompliance
        );
        processedResults = [result];
      } else {
        // Batch processing
        const batchResult = await apiClient.predictBatch(
          selectedFiles,
          confThreshold,
          checkCompliance
        );
        processedResults = batchResult.results;
      }

      setResults(processedResults);

      // Save to gallery
      saveToGallery(processedResults, selectedFiles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process images');
      console.error('Processing error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const saveToGallery = async (results: PredictionResponse[], files: File[]) => {
    try {
      const gallery = JSON.parse(localStorage.getItem('ppe-detection-gallery') || '[]');

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const file = files[i];

        // Create original image preview
        const originalImage = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        // Fetch annotated image
        let annotatedImage: string | null = null;
        try {
          const blob = await apiClient.predictImage(file, confThreshold);
          annotatedImage = URL.createObjectURL(blob);
        } catch (err) {
          console.error('Failed to fetch annotated image:', err);
        }

        const galleryItem = {
          id: `${Date.now()}-${i}`,
          result,
          originalImage,
          annotatedImage,
          file: {
            name: file.name,
            size: file.size,
            type: file.type
          },
          timestamp: Date.now()
        };

        gallery.push(galleryItem);
      }

      localStorage.setItem('ppe-detection-gallery', JSON.stringify(gallery));
    } catch (err) {
      console.error('Failed to save to gallery:', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Upload & Detect</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload images to detect Personal Protective Equipment
          </p>
        </div>

        {/* Upload Section */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Upload Images</h2>
          
          <ImageUploader
            onFilesSelected={handleFilesSelected}
            maxFiles={50}
            accept="image/jpeg,image/jpg,image/png,image/webp"
          />

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-foreground mb-2">
                Selected Files ({selectedFiles.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary text-secondary-foreground text-sm"
                  >
                    <span className="truncate max-w-[200px]">{file.name}</span>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settings */}
          <div className="mt-6 space-y-4">
            <div>
              <label className="flex items-center justify-between text-sm font-medium text-foreground mb-2">
                <span>Confidence Threshold: {confThreshold.toFixed(2)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={confThreshold}
                onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>0.00 (Low)</span>
                <span>1.00 (High)</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="checkCompliance"
                checked={checkCompliance}
                onChange={(e) => setCheckCompliance(e.target.checked)}
                className="w-4 h-4 rounded border-input accent-primary cursor-pointer"
              />
              <label
                htmlFor="checkCompliance"
                className="text-sm font-medium text-foreground cursor-pointer"
              >
                Check PPE Compliance
              </label>
            </div>
          </div>

          {/* Process Button */}
          <button
            onClick={handleProcess}
            disabled={selectedFiles.length === 0 || processing}
            className="mt-6 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Processing {selectedFiles.length} image{selectedFiles.length !== 1 ? 's' : ''}...
              </>
            ) : (
              <>Process Images</>
            )}
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
            <p className="text-sm font-medium text-destructive">Error: {error}</p>
          </div>
        )}

        {/* Results Section */}
        {results.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Detection Results
              </h2>
              <p className="text-sm text-muted-foreground">
                {results.length} image{results.length !== 1 ? 's' : ''} processed
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {results.map((result, index) => (
                <DetectionResultCard
                  key={result.request_id}
                  result={result}
                  file={selectedFiles[index]}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

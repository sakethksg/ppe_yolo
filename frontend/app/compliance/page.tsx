'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Users, HardHat, Shirt, FileText, Download, Upload } from 'lucide-react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { ImageUploader } from '@/components/image-uploader';
import { ComplianceStatusBadge } from '@/components/compliance-status-badge';
import { apiClient } from '@/lib/api';
import type { PredictionResponse } from '@/lib/api';

export default function CompliancePage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [annotatedImage, setAnnotatedImage] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confThreshold, setConfThreshold] = useState(0.5);

  const handleFileSelected = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setSelectedFile(file);
    setResult(null);
    setAnnotatedImage(null);
    setError(null);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCheck = async () => {
    if (!selectedFile) return;

    setProcessing(true);
    setError(null);

    try {
      // Get compliance check result
      const detectionResult = await apiClient.predict(selectedFile, confThreshold, true);
      setResult(detectionResult);

      // Get annotated image
      try {
        const blob = await apiClient.predictImage(selectedFile, confThreshold);
        const url = URL.createObjectURL(blob);
        setAnnotatedImage(url);
      } catch (err) {
        console.error('Failed to fetch annotated image:', err);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check compliance');
      console.error('Compliance check error:', err);
    } finally {
      setProcessing(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;

    const report = {
      timestamp: new Date().toISOString(),
      filename: result.metadata.filename,
      compliance_status: result.compliance?.is_compliant ? 'COMPLIANT' : 'NON-COMPLIANT',
      message: result.compliance?.message || '',
      detections: {
        total: result.detections_count,
        persons: result.summary.person,
        helmets: result.summary.helmet,
        safety_vests: result.summary['safety-vest']
      },
      violations: result.compliance?.violations || [],
      warnings: result.compliance?.warnings || [],
      confidence_threshold: result.confidence_threshold,
      processing_time_ms: result.metrics.processing_time_ms
    };

    const dataStr = JSON.stringify(report, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compliance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isCompliant = result?.compliance?.is_compliant;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Compliance Check</h1>
          <p className="text-muted-foreground mt-2">
            Verify PPE compliance for safety regulations
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column - Upload & Settings */}
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload Image
              </h2>
              
              <ImageUploader
                onFilesSelected={handleFileSelected}
                maxFiles={1}
                accept="image/*"
              />

              {selectedFile && (
                <div className="mt-4 p-3 rounded-lg bg-muted/50">
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Detection Settings
              </h2>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium">Confidence Threshold</label>
                  <span className="text-sm text-muted-foreground">{confThreshold.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={confThreshold}
                  onChange={(e) => setConfThreshold(parseFloat(e.target.value))}
                  disabled={processing}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Higher values require more certainty in detections
                </p>
              </div>

              <button
                onClick={handleCheck}
                disabled={!selectedFile || processing}
                className="w-full mt-6 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {processing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Checking Compliance...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Check Compliance
                  </>
                )}
              </button>
            </div>

            {/* Compliance Rules */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Compliance Rules
              </h2>

              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="w-4 h-4 text-chart-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Hard Hat Required</p>
                    <p className="text-xs text-muted-foreground">Every person must wear a safety helmet</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="w-4 h-4 text-chart-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Safety Vest Required</p>
                    <p className="text-xs text-muted-foreground">High-visibility vest must be worn</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                  <CheckCircle2 className="w-4 h-4 text-chart-2 mt-0.5" />
                  <div>
                    <p className="font-medium">Both Required</p>
                    <p className="text-xs text-muted-foreground">Helmet AND vest must be detected for each person</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="rounded-lg border bg-card p-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="font-medium text-destructive">Error</p>
                    <p className="text-sm text-muted-foreground mt-1">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Image Preview */}
            {(imagePreview || annotatedImage) && (
              <div className="rounded-lg border bg-card overflow-hidden">
                <div className="aspect-video bg-muted relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={annotatedImage || imagePreview || ''}
                    alt="Preview"
                    className="w-full h-full object-contain"
                  />
                  {result && (
                    <div className="absolute top-4 right-4">
                      <ComplianceStatusBadge isCompliant={isCompliant} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Compliance Result */}
            {result && (
              <>
                {/* Status Card */}
                <div className={`rounded-lg border p-6 ${
                  isCompliant 
                    ? 'bg-chart-2/10 border-chart-2/20' 
                    : 'bg-destructive/10 border-destructive/20'
                }`}>
                  <div className="flex items-center gap-3 mb-3">
                    {isCompliant ? (
                      <CheckCircle2 className="w-8 h-8 text-chart-2" />
                    ) : (
                      <AlertTriangle className="w-8 h-8 text-destructive" />
                    )}
                    <div>
                      <h3 className="text-xl font-bold">
                        {isCompliant ? 'COMPLIANT' : 'NON-COMPLIANT'}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.compliance?.message || 'Compliance check complete'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Detection Summary */}
                <div className="rounded-lg border bg-card p-6">
                  <h3 className="text-lg font-semibold mb-4">Detection Summary</h3>
                  
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div className="text-center p-4 rounded-lg bg-blue-500/10">
                      <Users className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-2xl font-bold">{result.summary.person}</p>
                      <p className="text-xs text-muted-foreground">Persons</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-orange-500/10">
                      <HardHat className="w-6 h-6 mx-auto mb-2 text-orange-500" />
                      <p className="text-2xl font-bold">{result.summary.helmet}</p>
                      <p className="text-xs text-muted-foreground">Helmets</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-green-500/10">
                      <Shirt className="w-6 h-6 mx-auto mb-2 text-green-500" />
                      <p className="text-2xl font-bold">{result.summary['safety-vest']}</p>
                      <p className="text-xs text-muted-foreground">Vests</p>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>• Total Detections: {result.detections_count}</p>
                    <p>• Processing Time: {result.metrics.processing_time_ms.toFixed(0)}ms</p>
                    <p>• Confidence Threshold: {result.confidence_threshold.toFixed(2)}</p>
                  </div>
                </div>

                {/* Violations */}
                {result.compliance?.violations && result.compliance.violations.length > 0 && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-destructive">
                      <AlertTriangle className="w-5 h-5" />
                      Violations Detected
                    </h3>
                    <ul className="space-y-2">
                      {result.compliance.violations.map((violation, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-destructive mt-0.5">•</span>
                          <span>{violation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Warnings */}
                {result.compliance?.warnings && result.compliance.warnings.length > 0 && (
                  <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-6">
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                      <AlertTriangle className="w-5 h-5" />
                      Warnings
                    </h3>
                    <ul className="space-y-2">
                      {result.compliance.warnings.map((warning, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-yellow-600 dark:text-yellow-500 mt-0.5">•</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={downloadReport}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg border bg-background hover:bg-accent transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Report
                  </button>
                  {annotatedImage && (
                    <button
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = annotatedImage;
                        a.download = `compliance-${Date.now()}.jpg`;
                        a.click();
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      Download Image
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Placeholder */}
            {!result && !error && !processing && (
              <div className="rounded-lg border bg-card p-12 text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No Results Yet</h3>
                <p className="text-sm text-muted-foreground">
                  Upload an image and click &quot;Check Compliance&quot; to begin
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

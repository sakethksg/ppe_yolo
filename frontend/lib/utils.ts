import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format file size in KB to human readable format
 */
export function formatFileSize(sizeKB: number): string {
  if (sizeKB < 1024) {
    return `${sizeKB.toFixed(2)} KB`;
  }
  return `${(sizeKB / 1024).toFixed(2)} MB`;
}

/**
 * Format processing time
 */
export function formatProcessingTime(ms: number): string {
  if (ms < 1000) {
    return `${ms.toFixed(0)}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  
  return date.toLocaleDateString();
}

/**
 * Format timestamp to local time
 */
export function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString();
}

/**
 * Get compliance status color
 */
export function getComplianceColor(isCompliant: boolean | null | undefined): string {
  if (isCompliant === null || isCompliant === undefined) {
    return 'text-muted-foreground';
  }
  return isCompliant ? 'text-chart-2' : 'text-destructive';
}

/**
 * Get compliance status badge variant
 */
export function getComplianceBadgeVariant(isCompliant: boolean | null | undefined): 'default' | 'secondary' | 'destructive' {
  if (isCompliant === null || isCompliant === undefined) {
    return 'secondary';
  }
  return isCompliant ? 'default' : 'destructive';
}

/**
 * Validate image file
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Please upload a valid image file (JPEG, PNG, WebP)' };
  }

  if (file.size > maxSize) {
    return { valid: false, error: 'File size must be less than 10MB' };
  }

  return { valid: true };
}

/**
 * Download blob as file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Get detection class color
 */
export function getDetectionClassColor(className: string): string {
  switch (className) {
    case 'person':
      return 'rgb(0, 255, 0)'; // Green
    case 'helmet':
      return 'rgb(0, 165, 255)'; // Blue
    case 'safety-vest':
      return 'rgb(255, 165, 0)'; // Orange
    default:
      return 'rgb(255, 255, 255)'; // White
  }
}

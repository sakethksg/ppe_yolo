'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { StatCard } from '@/components/stat-card';
import { ComplianceStatusBadge } from '@/components/compliance-status-badge';
import { DetectionSummary } from '@/components/detection-summary';
import { apiClient, type RecentDetection, type AnalyticsResponse } from '@/lib/api';
import { formatRelativeTime, formatProcessingTime } from '@/lib/utils';
import {
  Activity,
  Clock,
  AlertTriangle,
  TrendingUp,
  Upload,
  Video,
  Images,
  FileText,
} from 'lucide-react';

export default function DashboardPage() {
  const [recentDetections, setRecentDetections] = useState<RecentDetection[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);
      setError(null);
      
      const [detectionsData, analyticsData] = await Promise.all([
        apiClient.getRecentDetections(10),
        apiClient.getAnalytics(1), // Last 24 hours
      ]);

      setRecentDetections(detectionsData.records);
      setAnalytics(analyticsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate stats from analytics
  const totalDetections = analytics?.total_requests || 0;
  const complianceRate = analytics?.compliance_statistics?.compliance_rate || 0;
  const activeViolations = analytics?.compliance_statistics?.non_compliant_count || 0;
  const avgProcessingTime = analytics?.performance_metrics?.avg_processing_time_ms || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Safety monitoring overview and recent activity
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Detections Today"
            value={totalDetections}
            icon={Activity}
            description="Total processed images"
          />
          <StatCard
            title="Compliance Rate"
            value={`${complianceRate.toFixed(1)}%`}
            icon={TrendingUp}
            description="Safety compliance score"
            trend={{
              value: 2.5,
              isPositive: true,
            }}
          />
          <StatCard
            title="Active Violations"
            value={activeViolations}
            icon={AlertTriangle}
            description="Non-compliant detections"
          />
          <StatCard
            title="Avg Processing"
            value={formatProcessingTime(avgProcessingTime)}
            icon={Clock}
            description="Per image analysis time"
          />
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <a
              href="/upload"
              className="flex items-center gap-3 p-4 rounded-lg border bg-background hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-chart-1/10">
                <Upload className="w-5 h-5 text-chart-1" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Upload Image</p>
                <p className="text-xs text-muted-foreground">Detect PPE</p>
              </div>
            </a>

            <a
              href="/live"
              className="flex items-center gap-3 p-4 rounded-lg border bg-background hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-chart-2/10">
                <Video className="w-5 h-5 text-chart-2" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Live Detection</p>
                <p className="text-xs text-muted-foreground">Start camera</p>
              </div>
            </a>

            <a
              href="/gallery"
              className="flex items-center gap-3 p-4 rounded-lg border bg-background hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-chart-3/10">
                <Images className="w-5 h-5 text-chart-3" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">View Gallery</p>
                <p className="text-xs text-muted-foreground">Browse history</p>
              </div>
            </a>

            <a
              href="/analytics"
              className="flex items-center gap-3 p-4 rounded-lg border bg-background hover:bg-accent transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-chart-4/10">
                <FileText className="w-5 h-5 text-chart-4" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Analytics</p>
                <p className="text-xs text-muted-foreground">View reports</p>
              </div>
            </a>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-lg border bg-card">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Latest detection results from all sources
            </p>
          </div>
          
          <div className="divide-y">
            {loading ? (
              <div className="p-6 text-center text-muted-foreground">
                Loading recent activity...
              </div>
            ) : error ? (
              <div className="p-6 text-center text-destructive">
                {error}
              </div>
            ) : recentDetections.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground">
                No recent detections. Upload an image to get started!
              </div>
            ) : (
              recentDetections.map((detection) => (
                <div
                  key={detection.request_id}
                  className="p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-sm text-foreground truncate">
                          {detection.filename}
                        </p>
                        <ComplianceStatusBadge isCompliant={detection.is_compliant} />
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
                        <span>{formatRelativeTime(detection.timestamp)}</span>
                        <span>•</span>
                        <span>{formatProcessingTime(detection.processing_time_ms)}</span>
                        <span>•</span>
                        <span className="capitalize">{detection.endpoint}</span>
                      </div>
                      <DetectionSummary 
                        summary={detection.summary} 
                        variant="compact"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!loading && !error && recentDetections.length > 0 && (
            <div className="p-4 border-t">
              <a
                href="/gallery"
                className="text-sm font-medium text-primary hover:underline"
              >
                View all detections →
              </a>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}


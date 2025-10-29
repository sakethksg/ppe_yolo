'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { apiClient, type AnalyticsResponse } from '@/lib/api';
import { TrendingUp, Calendar, BarChart3, AlertTriangle, CheckCircle2, Users, HardHat, Shield } from 'lucide-react';
import { StatCard } from '@/components/stat-card';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [dateRange]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !analytics) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96 text-center">
          <AlertTriangle className="w-16 h-16 text-destructive mb-4" />
          <h3 className="text-lg font-semibold mb-2">Failed to Load Analytics</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </DashboardLayout>
    );
  }

  const complianceRate = analytics.compliance_statistics.compliance_rate || 0;
  const avgProcessingTime = analytics.performance_metrics.avg_processing_time_ms || 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground mt-2">
              PPE Detection statistics and insights
            </p>
          </div>

          {/* Date Range Selector */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as '7d' | '30d' | '90d' | 'all')}
              className="px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Total Detections"
            value={analytics.total_requests.toString()}
            icon={BarChart3}
          />
          <StatCard
            title="Compliance Rate"
            value={`${complianceRate.toFixed(1)}%`}
            icon={complianceRate >= 80 ? CheckCircle2 : AlertTriangle}
            trend={complianceRate >= 80 ? { value: complianceRate, isPositive: true } : { value: complianceRate, isPositive: false }}
          />
          <StatCard
            title="Avg Processing Time"
            value={`${avgProcessingTime.toFixed(0)}ms`}
            icon={TrendingUp}
          />
          <StatCard
            title="Total Violations"
            value={(analytics.compliance_statistics.non_compliant_count || 0).toString()}
            icon={AlertTriangle}
          />
        </div>

        {/* Compliance Statistics */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-6">Compliance Overview</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Compliance Bar */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Compliance</span>
                <span className="text-sm text-muted-foreground">{complianceRate.toFixed(1)}%</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-chart-2 transition-all"
                  style={{ width: `${complianceRate}%` }}
                />
              </div>
              <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
                <span>0%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {/* Compliance Stats */}
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-chart-2/10">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-chart-2" />
                  <span className="text-sm font-medium">Compliant</span>
                </div>
                <span className="text-lg font-bold">{analytics.compliance_statistics.compliant_count || 0}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-medium">Non-Compliant</span>
                </div>
                <span className="text-lg font-bold">{analytics.compliance_statistics.non_compliant_count || 0}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detection Statistics */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Persons Detected */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Persons Detected</p>
                <p className="text-2xl font-bold">
                  {typeof analytics.summary === 'object' && analytics.summary && 'total_persons' in analytics.summary
                    ? (analytics.summary.total_persons as number)
                    : 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Total number of people identified across all detections
            </p>
          </div>

          {/* Helmets Detected */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <HardHat className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Helmets Detected</p>
                <p className="text-2xl font-bold">
                  {typeof analytics.summary === 'object' && analytics.summary && 'total_helmets' in analytics.summary
                    ? (analytics.summary.total_helmets as number)
                    : 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Safety helmets identified in the images
            </p>
          </div>

          {/* Safety Vests Detected */}
          <div className="rounded-lg border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Safety Vests</p>
                <p className="text-2xl font-bold">
                  {typeof analytics.summary === 'object' && analytics.summary && 'total_vests' in analytics.summary
                    ? (analytics.summary.total_vests as number)
                    : 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Safety vests identified in the images
            </p>
          </div>
        </div>

        {/* Top Violations */}
        {analytics.top_violations && analytics.top_violations.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Top Violations
            </h2>
            <div className="space-y-3">
              {analytics.top_violations.slice(0, 5).map((violation, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-destructive">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {typeof violation === 'object' && violation && 'type' in violation
                        ? String(violation.type)
                        : 'Unknown violation'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {typeof violation === 'object' && violation && 'count' in violation
                        ? `${violation.count} occurrences`
                        : ''}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-destructive"
                        style={{
                          width: `${
                            typeof violation === 'object' && violation && 'count' in violation && analytics.total_requests > 0
                              ? ((violation.count as number) / analytics.total_requests) * 100
                              : 0
                          }%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Performance Metrics */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-6">Performance Metrics</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-muted-foreground mb-2">Average Processing Time</p>
              <p className="text-3xl font-bold mb-1">{avgProcessingTime.toFixed(0)}ms</p>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.min((avgProcessingTime / 1000) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {avgProcessingTime < 500 ? 'Excellent' : avgProcessingTime < 1000 ? 'Good' : 'Needs optimization'}
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Total Requests</span>
                <span className="text-lg font-bold">{analytics.total_requests}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm">Date Range</span>
                <span className="text-sm font-medium">
                  {new Date(analytics.date_range.start).toLocaleDateString()} - {new Date(analytics.date_range.end).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detection Trends */}
        {analytics.detection_trends && analytics.detection_trends.length > 0 && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Detection Trends</h2>
            <div className="space-y-2">
              {analytics.detection_trends.slice(0, 10).map((trend, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground w-32">
                    {typeof trend === 'object' && trend && 'date' in trend
                      ? new Date(String(trend.date)).toLocaleDateString()
                      : `Day ${index + 1}`}
                  </span>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{
                        width: `${
                          typeof trend === 'object' && trend && 'count' in trend
                            ? Math.min(((trend.count as number) / analytics.total_requests) * 100, 100)
                            : 0
                        }%`
                      }}
                    />
                  </div>
                  <span className="font-medium w-12 text-right">
                    {typeof trend === 'object' && trend && 'count' in trend ? String(trend.count) : '0'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

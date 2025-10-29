'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Save, RotateCcw, Bell, Database, Sliders, Shield, Image, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Settings {
  // Detection Settings
  defaultConfidenceThreshold: number;
  defaultCheckCompliance: boolean;
  autoSaveToGallery: boolean;
  
  // Notification Settings
  notificationsEnabled: boolean;
  notifyOnViolation: boolean;
  notifyOnSuccess: boolean;
  
  // Performance Settings
  maxBatchSize: number;
  imageQuality: number;
  enableCaching: boolean;
  
  // Display Settings
  showAnnotations: boolean;
  annotationColor: string;
  showConfidenceScores: boolean;
  darkMode: boolean;
  
  // API Settings
  apiUrl: string;
  apiTimeout: number;
}

const defaultSettings: Settings = {
  defaultConfidenceThreshold: 0.25,
  defaultCheckCompliance: true,
  autoSaveToGallery: true,
  notificationsEnabled: true,
  notifyOnViolation: true,
  notifyOnSuccess: false,
  maxBatchSize: 10,
  imageQuality: 0.8,
  enableCaching: true,
  showAnnotations: true,
  annotationColor: '#00ff00',
  showConfidenceScores: true,
  darkMode: false,
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001',
  apiTimeout: 30000,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    try {
      const stored = localStorage.getItem('ppe-detection-settings');
      if (stored) {
        const parsed = JSON.parse(stored);
        setSettings({ ...defaultSettings, ...parsed });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = () => {
    try {
      setSaving(true);
      localStorage.setItem('ppe-detection-settings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      setSettings(defaultSettings);
      localStorage.removeItem('ppe-detection-settings');
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground mt-2">
              Configure your PPE detection system preferences
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetSettings}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border hover:bg-accent transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
            <button
              onClick={saveSettings}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>

        {/* Success Message */}
        {saved && (
          <div className="flex items-center gap-3 p-4 rounded-lg bg-chart-2/10 border border-chart-2/20">
            <CheckCircle2 className="w-5 h-5 text-chart-2" />
            <p className="text-sm font-medium text-chart-2">Settings saved successfully!</p>
          </div>
        )}

        {/* Detection Settings */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Sliders className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Detection Settings</h2>
          </div>

          <div className="space-y-6">
            {/* Confidence Threshold */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Default Confidence Threshold</label>
                <span className="text-sm text-muted-foreground">{settings.defaultConfidenceThreshold.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.defaultConfidenceThreshold}
                onChange={(e) => updateSetting('defaultConfidenceThreshold', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Minimum confidence score for detections (higher = fewer but more accurate results)
              </p>
            </div>

            {/* Check Compliance */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Check Compliance by Default</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically check if PPE compliance rules are met
                </p>
              </div>
              <button
                onClick={() => updateSetting('defaultCheckCompliance', !settings.defaultCheckCompliance)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.defaultCheckCompliance ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.defaultCheckCompliance ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto Save to Gallery */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Auto-save to Gallery</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Automatically save detection results to gallery
                </p>
              </div>
              <button
                onClick={() => updateSetting('autoSaveToGallery', !settings.autoSaveToGallery)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoSaveToGallery ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.autoSaveToGallery ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Bell className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>

          <div className="space-y-6">
            {/* Enable Notifications */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Enable Notifications</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Show desktop notifications for detection events
                </p>
              </div>
              <button
                onClick={() => updateSetting('notificationsEnabled', !settings.notificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notificationsEnabled ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notificationsEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notify on Violation */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Notify on Violations</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Alert when PPE violations are detected
                </p>
              </div>
              <button
                onClick={() => updateSetting('notifyOnViolation', !settings.notifyOnViolation)}
                disabled={!settings.notificationsEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  settings.notifyOnViolation ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifyOnViolation ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notify on Success */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Notify on Successful Detection</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Alert when detection completes successfully
                </p>
              </div>
              <button
                onClick={() => updateSetting('notifyOnSuccess', !settings.notifyOnSuccess)}
                disabled={!settings.notificationsEnabled}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
                  settings.notifyOnSuccess ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.notifyOnSuccess ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Performance Settings */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Database className="w-5 h-5" />
            <h2 className="text-xl font-semibold">Performance</h2>
          </div>

          <div className="space-y-6">
            {/* Max Batch Size */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Maximum Batch Size</label>
                <span className="text-sm text-muted-foreground">{settings.maxBatchSize}</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={settings.maxBatchSize}
                onChange={(e) => updateSetting('maxBatchSize', parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum number of images to process in a single batch
              </p>
            </div>

            {/* Image Quality */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Image Quality</label>
                <span className="text-sm text-muted-foreground">{(settings.imageQuality * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={settings.imageQuality}
                onChange={(e) => updateSetting('imageQuality', parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                JPEG quality for processed images (higher = better quality but larger files)
              </p>
            </div>

            {/* Enable Caching */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Enable Caching</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Cache results to improve performance for repeated images
                </p>
              </div>
              <button
                onClick={() => updateSetting('enableCaching', !settings.enableCaching)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.enableCaching ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.enableCaching ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Display Settings */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Image className="w-5 h-5" aria-hidden="true" />
            <h2 className="text-xl font-semibold">Display</h2>
          </div>

          <div className="space-y-6">
            {/* Show Annotations */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Show Bounding Box Annotations</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Display detection boxes on images
                </p>
              </div>
              <button
                onClick={() => updateSetting('showAnnotations', !settings.showAnnotations)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.showAnnotations ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showAnnotations ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Show Confidence Scores */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium">Show Confidence Scores</label>
                <p className="text-xs text-muted-foreground mt-1">
                  Display confidence percentages on detections
                </p>
              </div>
              <button
                onClick={() => updateSetting('showConfidenceScores', !settings.showConfidenceScores)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.showConfidenceScores ? 'bg-primary' : 'bg-muted'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings.showConfidenceScores ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* API Settings */}
        <div className="rounded-lg border bg-card p-6">
          <div className="flex items-center gap-2 mb-6">
            <Shield className="w-5 h-5" />
            <h2 className="text-xl font-semibold">API Configuration</h2>
          </div>

          <div className="space-y-6">
            {/* API URL */}
            <div>
              <label className="text-sm font-medium block mb-2">API Base URL</label>
              <input
                type="text"
                value={settings.apiUrl}
                onChange={(e) => updateSetting('apiUrl', e.target.value)}
                className="w-full px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="http://localhost:8001"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Backend API endpoint URL
              </p>
            </div>

            {/* API Timeout */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">API Timeout</label>
                <span className="text-sm text-muted-foreground">{(settings.apiTimeout / 1000).toFixed(0)}s</span>
              </div>
              <input
                type="range"
                min="5000"
                max="120000"
                step="5000"
                value={settings.apiTimeout}
                onChange={(e) => updateSetting('apiTimeout', parseInt(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Maximum time to wait for API responses
              </p>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="rounded-lg border bg-muted/50 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium mb-1">Settings Information</p>
              <ul className="space-y-1 text-xs">
                <li>• Settings are stored locally in your browser</li>
                <li>• Changes take effect immediately after saving</li>
                <li>• Some settings may require page refresh</li>
                <li>• Reset to restore default values</li>
              </ul>
              <div className="sr-only">Information icon</div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

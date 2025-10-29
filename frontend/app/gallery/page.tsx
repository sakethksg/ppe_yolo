'use client';

import { useState, useEffect, useMemo } from 'react';
import { DashboardLayout } from '@/components/dashboard-layout';
import { Search, Trash2, Download, Eye, Filter, Calendar } from 'lucide-react';
import { ComplianceStatusBadge } from '@/components/compliance-status-badge';
import { DetectionSummary } from '@/components/detection-summary';
import { DetectionDetailModal } from '@/components/detection-detail-modal';
import { formatFileSize } from '@/lib/utils';
import type { PredictionResponse } from '@/lib/api';

interface GalleryItem {
  id: string;
  result: PredictionResponse;
  originalImage: string;
  annotatedImage: string | null;
  file: File;
  timestamp: number;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompliance, setFilterCompliance] = useState<'all' | 'compliant' | 'non-compliant'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Load items from localStorage on mount
  useEffect(() => {
    const loadItems = () => {
      try {
        const stored = localStorage.getItem('ppe-detection-gallery');
        if (stored) {
          const parsed = JSON.parse(stored);
          setItems(parsed);
        }
      } catch (error) {
        console.error('Failed to load gallery items:', error);
      }
    };
    loadItems();
  }, []);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.result.metadata.filename.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Compliance filter
    if (filterCompliance !== 'all') {
      filtered = filtered.filter(item => {
        const isCompliant = item.result.compliance?.is_compliant;
        if (filterCompliance === 'compliant') return isCompliant === true;
        if (filterCompliance === 'non-compliant') return isCompliant === false;
        return true;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'newest') return b.timestamp - a.timestamp;
      if (sortBy === 'oldest') return a.timestamp - b.timestamp;
      if (sortBy === 'name') return a.result.metadata.filename.localeCompare(b.result.metadata.filename);
      return 0;
    });

    return filtered;
  }, [items, searchQuery, filterCompliance, sortBy]);

  // Delete item
  const deleteItem = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item) {
      // Revoke object URLs to free memory
      URL.revokeObjectURL(item.originalImage);
      if (item.annotatedImage) {
        URL.revokeObjectURL(item.annotatedImage);
      }
    }

    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    localStorage.setItem('ppe-detection-gallery', JSON.stringify(newItems));
  };

  // Delete all items
  const deleteAll = () => {
    if (confirm('Are you sure you want to delete all gallery items?')) {
      items.forEach(item => {
        URL.revokeObjectURL(item.originalImage);
        if (item.annotatedImage) {
          URL.revokeObjectURL(item.annotatedImage);
        }
      });
      setItems([]);
      localStorage.removeItem('ppe-detection-gallery');
    }
  };

  // Download item
  const downloadItem = (item: GalleryItem) => {
    // Download annotated image
    if (item.annotatedImage) {
      const a = document.createElement('a');
      a.href = item.annotatedImage;
      a.download = `annotated-${item.result.metadata.filename}`;
      a.click();
    }

    // Download JSON
    const dataStr = JSON.stringify(item.result, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `detection-${item.result.request_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gallery</h1>
            <p className="text-muted-foreground mt-2">
              View and manage your detection history
            </p>
          </div>
          
          {items.length > 0 && (
            <button
              onClick={deleteAll}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-destructive border border-destructive/20 hover:bg-destructive/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear All
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Items</p>
            <p className="text-2xl font-bold mt-1">{items.length}</p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Compliant</p>
            <p className="text-2xl font-bold mt-1 text-chart-2">
              {items.filter(i => i.result.compliance?.is_compliant === true).length}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Non-Compliant</p>
            <p className="text-2xl font-bold mt-1 text-destructive">
              {items.filter(i => i.result.compliance?.is_compliant === false).length}
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <p className="text-sm text-muted-foreground">Total Detections</p>
            <p className="text-2xl font-bold mt-1">
              {items.reduce((sum, i) => sum + i.result.detections_count, 0)}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Compliance Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <select
              value={filterCompliance}
              onChange={(e) => setFilterCompliance(e.target.value as 'all' | 'compliant' | 'non-compliant')}
              className="px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">All Status</option>
              <option value="compliant">Compliant</option>
              <option value="non-compliant">Non-Compliant</option>
            </select>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'name')}
              className="px-4 py-2 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        {/* Gallery Grid */}
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
              <Eye className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No items found</h3>
            <p className="text-muted-foreground">
              {items.length === 0
                ? 'Upload and detect images to see them here'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border bg-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Image */}
                <div className="relative aspect-video bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.annotatedImage || item.originalImage}
                    alt={item.result.metadata.filename}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <ComplianceStatusBadge isCompliant={item.result.compliance?.is_compliant} />
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3">
                  {/* Filename */}
                  <div>
                    <h3 className="font-medium text-sm truncate" title={item.result.metadata.filename}>
                      {item.result.metadata.filename}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.timestamp).toLocaleString()} • {formatFileSize(item.result.metadata.size_kb)}
                    </p>
                  </div>

                  {/* Detection Summary */}
                  <DetectionSummary summary={item.result.summary} variant="compact" />

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{item.result.detections_count} detections</span>
                    <span>•</span>
                    <span>{item.result.metrics.processing_time_ms.toFixed(0)}ms</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        setSelectedItem(item);
                        setShowDetailModal(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    
                    <button
                      onClick={() => downloadItem(item)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border bg-background hover:bg-accent transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => deleteItem(item.id)}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-md text-xs font-medium border border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedItem && (
        <DetectionDetailModal
          result={selectedItem.result}
          imagePreview={selectedItem.originalImage}
          annotatedImage={selectedItem.annotatedImage}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedItem(null);
          }}
        />
      )}
    </DashboardLayout>
  );
}

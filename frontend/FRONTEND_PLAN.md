# PPE Detection Frontend Plan - RINL Steel Plant

## 🎯 Project Overview
Frontend application for PPE (Personal Protective Equipment) Detection System for RINL Steel Plant. The system monitors worker safety compliance by detecting helmets, safety vests, and persons in real-time and uploaded images.

---

## 🎨 Design System

### Color Palette (from globals.css)
**Light Mode:**
- Background: `oklch(1 0 0)` - Pure White
- Foreground: `oklch(0.145 0 0)` - Near Black
- Primary: `oklch(0.205 0 0)` - Dark Gray
- Secondary: `oklch(0.97 0 0)` - Light Gray
- Muted: `oklch(0.97 0 0)` - Light Gray
- Destructive: `oklch(0.577 0.245 27.325)` - Red
- Border: `oklch(0.922 0 0)` - Light Gray Border
- Chart Colors: Defined for 5 charts

**Dark Mode:**
- Background: `oklch(0.145 0 0)` - Dark
- Foreground: `oklch(0.985 0 0)` - Light
- Primary: `oklch(0.922 0 0)` - Light Gray
- Card: `oklch(0.205 0 0)` - Dark Gray
- Destructive: `oklch(0.704 0.191 22.216)` - Red

### Theme Approach
- Industrial/Professional Steel Plant Aesthetic
- Clean, minimal interface with strong contrast
- Safety-first color coding (Red for violations, Green for compliance)

---

## 📐 Layout Structure

### Main Layout Components

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                      │
│  - Logo (RINL/Steel Plant)                                  │
│  - App Title: "PPE Safety Monitoring System"               │
│  - Real-time Status Indicator                               │
│  - Theme Toggle (Light/Dark)                                │
│  - Navigation Links                                          │
└─────────────────────────────────────────────────────────────┘
│                                                              │
│  ┌──────────────┐  ┌───────────────────────────────────┐  │
│  │   Sidebar    │  │                                    │  │
│  │              │  │        Main Content Area          │  │
│  │  Dashboard   │  │                                    │  │
│  │  Live Detect │  │                                    │  │
│  │  Upload      │  │                                    │  │
│  │  Gallery     │  │                                    │  │
│  │  Analytics   │  │                                    │  │
│  │  Compliance  │  │                                    │  │
│  │  Settings    │  │                                    │  │
│  │              │  │                                    │  │
│  └──────────────┘  └───────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧩 Pages & Features

### 1. Dashboard (Home Page)
**Purpose:** Overview of safety monitoring system

**Components:**
- **Stats Cards Grid (4 cards)**
  - Total Detections Today
  - Compliance Rate (%)
  - Active Violations
  - Average Processing Time
  - Use chart colors for visual distinction

- **Live Compliance Chart**
  - Line/Area chart showing compliance rate over time
  - Last 24 hours data
  - Green for compliant, Red for violations

- **Recent Activity Feed**
  - Last 10 detections with timestamps
  - Thumbnail preview
  - Quick compliance status badge
  - Click to view details

- **Detection Summary Cards**
  - Persons Detected
  - Helmets Detected
  - Safety Vests Detected
  - With icons and counts

- **Quick Actions Panel**
  - Upload Image button
  - Start Live Detection button
  - View Gallery button
  - Generate Report button

**API Endpoints Used:**
- `GET /analytics?days=1`
- `GET /recent-detections?limit=10`
- `GET /health`

---

### 2. Live Detection Page
**Purpose:** Real-time webcam PPE detection

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Live Camera Feed                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │         Video Stream with Bounding Boxes             │   │
│  │                                                      │   │
│  │  [Person] [Helmet] [Safety-Vest] overlays          │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Start Cam   │  │  Stop Cam    │  │  Capture     │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
│  Settings Panel:                                             │
│  - Confidence Threshold Slider (0.25 default)               │
│  - Frame Rate Selector                                       │
│  - Enable Compliance Check Toggle                           │
│                                                              │
│  Real-time Detection Info:                                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Persons: 3  |  Helmets: 2  |  Vests: 1            │   │
│  │  Status: ⚠️ NON-COMPLIANT                            │   │
│  │  Missing: 1 Helmet, 2 Vests                          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Access device camera using browser API
- Capture frame every N seconds
- Send to `/predict` endpoint with compliance check
- Draw bounding boxes on canvas overlay
- Color coding:
  - Green box: Person with full PPE
  - Red box: Person missing PPE
  - Blue box: Helmet
  - Orange box: Safety Vest
- Auto-save non-compliant detections
- Sound alert on violations
- FPS counter

**Technical Implementation:**
- Use `navigator.mediaDevices.getUserMedia()` for camera
- HTML Canvas for drawing overlays
- WebSocket or polling for real-time updates
- Frame capture at intervals (1-5 sec)

---

### 3. Upload & Detect Page
**Purpose:** Upload single/multiple images for detection

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Upload Section                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │     Drop files here or click to browse               │   │
│  │                                                      │   │
│  │     📁 Supported: JPG, PNG, JPEG                    │   │
│  │     Max: 50 files per batch                          │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Settings:                                                   │
│  [Confidence: 0.25] [Check Compliance ✓]                    │
│                                                              │
│  Selected Files: (Chip list with remove option)             │
│  [file1.jpg ✕] [file2.jpg ✕] [file3.jpg ✕]                │
│                                                              │
│  [Process Images Button]                                     │
│                                                              │
│  ─────────────────────────────────────────────────────      │
│                                                              │
│  Results Section (After processing):                         │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐          │
│  │   Image 1   │  │   Image 2   │  │   Image 3   │          │
│  │ ┌────────┐ │  │ ┌────────┐ │  │ ┌────────┐ │          │
│  │ │        │ │  │ │        │ │  │ │        │ │          │
│  │ │ Image  │ │  │ │ Image  │ │  │ │ Image  │ │          │
│  │ │        │ │  │ │        │ │  │ │        │ │          │
│  │ └────────┘ │  │ └────────┘ │  │ └────────┘ │          │
│  │ ✅ Compliant│  │ ⚠️ Warning │  │ ❌ Violation│          │
│  │ P:2 H:2 V:2│  │ P:1 H:1 V:0│  │ P:3 H:1 V:1│          │
│  │ [Details]  │  │ [Details]  │  │ [Details]  │          │
│  └────────────┘  └────────────┘  └────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Drag & drop file upload
- Multi-file selection
- Progress bar during processing
- Real-time processing status
- Grid view of results
- Click on result to see detailed modal:
  - Annotated image with bounding boxes
  - Detection list with confidence scores
  - Compliance report
  - Processing metrics
  - Download options (annotated image, JSON)
  - Save to gallery option

**API Endpoints:**
- `POST /predict` (single image)
- `POST /predict-batch` (multiple images)
- `POST /predict-image` (get annotated image)

---

### 4. Gallery Page
**Purpose:** View, search, and manage historical detections

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Gallery Header                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ All Records  │  │  Compliant   │  │  Violations  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                              │
│  Filters & Search:                                           │
│  [Search by filename...] [Date Range] [Endpoint ▼]          │
│  [Sort by: Recent ▼]                                        │
│                                                              │
│  ─────────────────────────────────────────────────────      │
│                                                              │
│  Gallery Grid (Masonry/Grid Layout):                         │
│                                                              │
│  ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐ │
│  │ Thumbnail │ │ Thumbnail │ │ Thumbnail │ │ Thumbnail │ │
│  │  Image 1  │ │  Image 2  │ │  Image 3  │ │  Image 4  │ │
│  │           │ │           │ │           │ │           │ │
│  │ ✅ PASS   │ │ ❌ FAIL   │ │ ⚠️ WARN   │ │ ✅ PASS   │ │
│  │ 2h ago    │ │ 5h ago    │ │ 1d ago    │ │ 2d ago    │ │
│  │ [View][🗑]│ │ [View][🗑]│ │ [View][🗑]│ │ [View][🗑]│ │
│  └───────────┘ └───────────┘ └───────────┘ └───────────┘ │
│                                                              │
│  [Load More / Pagination]                                    │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Infinite scroll or pagination
- Filter by:
  - Date range (today, week, month, custom)
  - Compliance status (all, compliant, violations, warnings)
  - Endpoint type (predict, batch, compliance, video)
- Search by filename
- Sort by date, filename, compliance
- Bulk actions:
  - Select multiple
  - Delete selected
  - Download selected
- Thumbnail generation
- Hover to show preview
- Click to open detail modal

**Detail Modal:**
- Full-size image with annotations
- All detection details
- Compliance report
- Metadata (filename, size, timestamp)
- Processing metrics
- Download buttons
- Delete button
- Share/Export options

**API Endpoints:**
- `GET /recent-detections?limit=50`
- Custom filtering on frontend
- Store image data in IndexedDB/LocalStorage

---

### 5. Analytics & Reports Page
**Purpose:** View trends, statistics, and generate reports

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Analytics Dashboard                                         │
│                                                              │
│  Time Range Selector:                                        │
│  [Last 7 Days ▼]  [Custom Range]  [Export Report]          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Compliance Rate Over Time (Line Chart)              │   │
│  │                                                       │   │
│  │    100% ┤                                            │   │
│  │     75% ┤     ╱─╲                                    │   │
│  │     50% ┤   ╱     ╲─╲                                │   │
│  │     25% ┤ ╱           ╲                              │   │
│  │      0% └─────────────────────────                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌────────────────┐  ┌────────────────┐                    │
│  │  Detections by │  │  Top Violations│                    │
│  │  Class (Pie)   │  │  (Bar Chart)   │                    │
│  │                │  │                │                    │
│  │   Person: 45%  │  │  Missing Helm  │                    │
│  │   Helmet: 30%  │  │  Missing Vest  │                    │
│  │   Vest: 25%    │  │  Both Missing  │                    │
│  └────────────────┘  └────────────────┘                    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Detection Trends (Heatmap/Timeline)                 │   │
│  │                                                       │   │
│  │  Mon  Tue  Wed  Thu  Fri  Sat  Sun                  │   │
│  │  ███  ███  ██   ████ ███  █    ██                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Key Metrics Summary:                                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  Total   │ │  Avg     │ │  Alerts  │ │  Success │     │
│  │  2,345   │ │  234ms   │ │   48     │ │  95.8%   │     │
│  │ Requests │ │ Process  │ │ Triggered│ │  Rate    │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Interactive charts (using chart.js or recharts)
- Date range picker
- Compliance rate line chart
- Detection distribution (pie/donut)
- Top violations bar chart
- Detection trends heatmap
- Performance metrics
- Export to PDF/Excel
- Scheduled reports
- Real-time updates

**API Endpoints:**
- `GET /analytics?days=7`
- `GET /analytics?days=30`
- Custom date range filtering

---

### 6. Compliance Check Page
**Purpose:** Focused compliance verification

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Compliance Verification                                     │
│                                                              │
│  Upload Image for Compliance Check                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Drop image here                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Upload & Check]                                            │
│                                                              │
│  ─────────────────────────────────────────────────────      │
│                                                              │
│  Compliance Report:                                          │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Status: ❌ NON-COMPLIANT                            │   │
│  │                                                       │   │
│  │  Detected:                                            │   │
│  │    ✓ 3 Persons                                       │   │
│  │    ✓ 2 Helmets                                       │   │
│  │    ✓ 1 Safety Vest                                   │   │
│  │                                                       │   │
│  │  ⚠️ Violations:                                       │   │
│  │    • 1 person without helmet                         │   │
│  │    • 2 persons without safety vest                   │   │
│  │                                                       │   │
│  │  ⚠️ Warnings:                                         │   │
│  │    • Detection confidence low for person #3          │   │
│  │                                                       │   │
│  │  Recommendations:                                     │   │
│  │    • Ensure all workers wear helmets                 │   │
│  │    • Provide safety vests to 2 workers               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  [Save Report] [Print] [Alert Supervisor]                   │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Dedicated compliance checking interface
- Clear pass/fail indicator
- Detailed violation list
- Recommendations
- Alert system integration
- Print/Export compliance certificate
- Historical compliance tracking

**API Endpoints:**
- `POST /check-compliance`
- `POST /predict?check_compliance_flag=true`

---

### 7. Video Processing Page
**Purpose:** Upload and process video files

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  Video Processing                                            │
│                                                              │
│  Upload Video File                                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Drop video file here (.mp4, .avi, .mov)            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  Settings:                                                   │
│  Sample Rate: [Every 1 frame ▼]                             │
│  Max Frames: [300]                                           │
│  Confidence: [0.25]                                          │
│                                                              │
│  [Process Video]                                             │
│                                                              │
│  Progress: ████████░░░░░░░░ 60% (180/300 frames)           │
│                                                              │
│  ─────────────────────────────────────────────────────      │
│                                                              │
│  Results:                                                    │
│                                                              │
│  Video Summary:                                              │
│  • Processed: 300/1000 frames                               │
│  • Compliance Rate: 78.5%                                   │
│  • Total Detections: 1,234                                  │
│  • Processing Time: 45.2s                                   │
│                                                              │
│  Timeline View:                                              │
│  [Frame-by-frame compliance visualization]                  │
│  ████████░░████████░░░█████████                            │
│  Green: Compliant | Red: Violation | Gray: No detection    │
│                                                              │
│  [Download Results] [View Frame Details]                    │
└─────────────────────────────────────────────────────────────┘
```

**Features:**
- Video file upload
- Processing progress indicator
- Frame sampling configuration
- Compliance timeline visualization
- Frame-by-frame navigation
- Jump to violation moments
- Export annotated video (optional)
- Detailed frame analysis

**API Endpoints:**
- `POST /predict-video`

---

### 8. Settings Page
**Purpose:** Configure application settings

**Sections:**
- **Detection Settings**
  - Default confidence threshold
  - Auto-save detections
  - Enable/disable compliance checks
  
- **Notification Settings**
  - Email alerts on violations
  - Sound alerts
  - Desktop notifications

- **Display Settings**
  - Theme (Light/Dark/Auto)
  - Language (if multi-language)
  - Date/Time format

- **Storage Settings**
  - Auto-cleanup old records
  - Image quality settings
  - Export format preferences

- **API Configuration**
  - Backend URL
  - Timeout settings
  - Retry logic

---

## 🗂️ Component Architecture

### Shared Components

1. **DetectionCard**
   - Shows detection result with image
   - Compliance badge
   - Summary counts
   - Action buttons

2. **BoundingBoxCanvas**
   - Canvas overlay for drawing boxes
   - Color-coded by class
   - Confidence labels

3. **ComplianceStatusBadge**
   - Visual indicator (✅ ⚠️ ❌)
   - Color: Green/Yellow/Red

4. **DetectionSummary**
   - Icon + count for each class
   - Person, Helmet, Vest

5. **ImageUploader**
   - Drag & drop zone
   - File validation
   - Preview thumbnails

6. **StatCard**
   - Icon, value, label
   - Trend indicator
   - Color-coded

7. **AnalyticsChart**
   - Reusable chart wrapper
   - Line, Bar, Pie, Heatmap
   - Responsive

8. **ConfidenceSlider**
   - Range input with label
   - Real-time preview

9. **ActionButton**
   - Primary, Secondary, Destructive variants
   - Loading state
   - Icon support

10. **Modal/Dialog**
    - Detail view
    - Confirmation dialogs
    - Full-screen option

---

## 📊 State Management

### Global State (Context/Zustand/Redux)
- User settings
- Theme preference
- API configuration
- Alert notifications
- Detection history cache

### Local State (Component level)
- Form inputs
- Upload progress
- Camera stream
- Filter selections
- Modal open/close

---

## 🔌 API Integration

### API Client Setup
```typescript
// lib/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8001'

// Endpoints:
- POST /predict
- POST /predict-image
- POST /predict-batch
- POST /check-compliance
- POST /predict-video
- GET /analytics
- GET /recent-detections
- GET /health
- GET /model-info
```

### Data Storage
- **IndexedDB**: Store detection results and images locally
- **LocalStorage**: User preferences, settings
- **Session Storage**: Temporary data

---

## 🎯 Technical Implementation Plan

### Phase 1: Foundation (Days 1-2)
- ✅ Setup Next.js, Tailwind, Shadcn
- [ ] Create layout structure
- [ ] Setup API client
- [ ] Implement routing
- [ ] Create shared components library

### Phase 2: Core Features (Days 3-5)
- [ ] Dashboard page with stats
- [ ] Upload & Detect page
- [ ] Gallery page with CRUD
- [ ] API integration

### Phase 3: Advanced Features (Days 6-8)
- [ ] Live camera detection
- [ ] Video processing
- [ ] Analytics & charts
- [ ] Compliance checking

### Phase 4: Polish (Days 9-10)
- [ ] Responsive design
- [ ] Dark mode refinement
- [ ] Performance optimization
- [ ] Error handling & loading states
- [ ] Testing

---

## 📱 Responsive Design

### Breakpoints
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### Mobile Adaptations
- Collapsible sidebar → Bottom nav
- Grid → Single column
- Touch-friendly buttons
- Swipe gestures for gallery

---

## 🎨 UI/UX Guidelines

### For Steel Plant Context
- **High Contrast**: Easy to read in bright/dim conditions
- **Large Touch Targets**: 44x44px minimum
- **Clear Status Indicators**: Red/Yellow/Green
- **Minimal Clicks**: Max 3 clicks to any action
- **Fast Feedback**: Instant visual feedback
- **Error Tolerance**: Confirm destructive actions
- **Accessibility**: WCAG 2.1 AA compliant

### Animations
- Subtle fade-ins
- Smooth transitions (200-300ms)
- Progress indicators for long operations
- Skeleton loaders

---

## 🔐 Security Considerations
- Client-side image validation
- File size limits
- CORS configuration
- Secure file upload
- No sensitive data in URLs
- Input sanitization

---

## 🚀 Performance Optimization
- Image lazy loading
- Virtual scrolling for gallery
- Debounced search inputs
- Cached API responses
- WebP image format
- Code splitting by route
- Bundle size optimization

---

## 📦 Tech Stack Summary

**Core:**
- Next.js 15 (App Router)
- React 19
- TypeScript
- Tailwind CSS
- Shadcn UI

**Additional Libraries:**
- Recharts / Chart.js (Analytics)
- date-fns (Date formatting)
- zustand (State management)
- axios (API calls)
- react-dropzone (File upload)
- canvas-confetti (Celebrations on compliance 😊)

---

## 🎯 Success Metrics
- Page load time < 2s
- Detection display < 500ms after API response
- Gallery smooth scrolling 60fps
- Mobile responsive 100%
- Accessibility score > 90
- Zero critical bugs

---

## 📝 Next Steps

1. **Review this plan** with stakeholder
2. **Setup project structure**
3. **Create component library**
4. **Build page by page** (Dashboard → Upload → Gallery → Live → Analytics)
5. **Test & iterate**

---

**Ready to build! Let's create an amazing PPE detection frontend for RINL! 🏭⚡**

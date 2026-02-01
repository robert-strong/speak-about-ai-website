# Vendor Directory Structure Analysis

## Overview
This website implements a comprehensive vendor management system with a public directory, admin dashboard, and multi-layered database schema supporting vendors, categories, reviews, and compliance tracking.

---

## 1. DATABASE TABLE STRUCTURE

### Core Vendor Tables

#### `vendors` (Main Table)
Primary table storing vendor information with the following columns:

```
id                    SERIAL PRIMARY KEY
company_name         VARCHAR(255) UNIQUE NOT NULL
slug                 VARCHAR(255) UNIQUE
category_id          INTEGER REFERENCES vendor_categories(id)
contact_name         VARCHAR(255)
contact_email        VARCHAR(255) NOT NULL
contact_phone        VARCHAR(20)
website              VARCHAR(255)
logo_url             TEXT
description          TEXT
services             TEXT[] (Array of services)
specialties          TEXT[] (Array of specialties)
pricing_range        VARCHAR(50)
minimum_budget       DECIMAL(12,2)
location             VARCHAR(255)
years_in_business    INTEGER
team_size            VARCHAR(50)
certifications       TEXT[] (Array)
featured             BOOLEAN DEFAULT false
verified             BOOLEAN DEFAULT false
status               VARCHAR(50) - 'pending'|'approved'|'rejected'|'suspended'
tags                 TEXT[] (Array)
social_media         JSONB
portfolio_items      JSONB
client_references    JSONB
created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
approved_at          TIMESTAMP
approved_by          VARCHAR(255)
average_rating       DECIMAL(3,2)
review_count         INTEGER
onboarding_status    VARCHAR(50) DEFAULT 'not_started'
compliance_status    VARCHAR(50) DEFAULT 'pending'
performance_score    DECIMAL(5,2) DEFAULT 0
last_activity_at     TIMESTAMP
```

#### `vendor_categories` (Category Reference Table)
```
id               SERIAL PRIMARY KEY
name             VARCHAR(100) UNIQUE NOT NULL
slug             VARCHAR(100) UNIQUE NOT NULL
description      TEXT
icon             VARCHAR(50) - Emoji or icon class (📅, 🍽️, 📸, etc.)
display_order    INTEGER DEFAULT 0
is_active        BOOLEAN DEFAULT true
created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP

Indexes: slug, is_active, display_order
```

**Default Categories:**
- Event Planning (📅)
- Catering (🍽️)
- Photography & Video (📸)
- Audio/Visual (🎤)
- Entertainment (🎵)
- Venues (🏛️)
- Decor & Design (🎨)
- Transportation (🚗)
- Staffing (👥)
- Technology (💻)

#### `vendor_reviews` (Public Reviews)
```
id                SERIAL PRIMARY KEY
vendor_id         INTEGER REFERENCES vendors(id) ON DELETE CASCADE
reviewer_name     VARCHAR(255) NOT NULL
reviewer_email    VARCHAR(255) NOT NULL
reviewer_company  VARCHAR(255)
rating            INTEGER CHECK (1-5)
review_text       TEXT
event_type        VARCHAR(100)
event_date        DATE
status            VARCHAR(50) - 'pending'|'approved'|'rejected'
helpful_count     INTEGER DEFAULT 0
created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP

Indexes: vendor_id, status, rating
Trigger: update_vendor_rating() - Updates vendor.average_rating on review insert/update/delete
```

### Supporting Tables for Advanced Features

#### `vendor_activity` (Activity Tracking)
```
id                SERIAL PRIMARY KEY
vendor_id         INTEGER REFERENCES vendors(id) ON DELETE CASCADE
activity_type     VARCHAR(100) NOT NULL
description       TEXT
metadata          JSONB DEFAULT '{}'
created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
created_by        VARCHAR(255)

Indexes: vendor_id, activity_type, created_at
```

#### `vendor_documents` (Document Management)
```
id                SERIAL PRIMARY KEY
vendor_id         INTEGER REFERENCES vendors(id) ON DELETE CASCADE
document_type     VARCHAR(100) NOT NULL
document_name     VARCHAR(255) NOT NULL
file_url          TEXT NOT NULL
file_size         BIGINT
mime_type         VARCHAR(100)
status            VARCHAR(50) DEFAULT 'pending' - 'pending'|'approved'|'rejected'
uploaded_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
reviewed_at       TIMESTAMP
reviewed_by       VARCHAR(255)
notes             TEXT

Indexes: vendor_id, status
```

#### `vendor_compliance` (Compliance Tracking)
```
vendor_id                  INTEGER PRIMARY KEY (OneToOne with vendors)
insurance_verified         BOOLEAN DEFAULT false
insurance_expiry           DATE
license_verified           BOOLEAN DEFAULT false
license_number             VARCHAR(255)
license_expiry             DATE
certifications             TEXT[]
background_check           BOOLEAN DEFAULT false
background_check_date      DATE
tax_id_verified            BOOLEAN DEFAULT false
contract_signed            BOOLEAN DEFAULT false
contract_date              DATE
compliance_score           INTEGER DEFAULT 0 (0-100)
last_review_date           DATE
next_review_date           DATE
created_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP

Indexes: compliance_score, next_review_date
```

#### `vendor_performance` (Performance Metrics)
```
vendor_id                    INTEGER PRIMARY KEY (OneToOne with vendors)
total_events                 INTEGER DEFAULT 0
successful_events            INTEGER DEFAULT 0
cancelled_events             INTEGER DEFAULT 0
average_rating               DECIMAL(3,2) DEFAULT 0
total_reviews                INTEGER DEFAULT 0
response_time_hours          DECIMAL(10,2) DEFAULT 0
on_time_delivery_rate        DECIMAL(5,2) DEFAULT 0
client_satisfaction_score    DECIMAL(5,2) DEFAULT 0
revenue_generated            DECIMAL(12,2)
last_event_date              DATE
performance_tier             VARCHAR(20) - 'bronze'|'silver'|'gold'|'platinum'
created_at                   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at                   TIMESTAMP DEFAULT CURRENT_TIMESTAMP

Indexes: average_rating, performance_tier
```

#### `vendor_onboarding` (Onboarding Workflow Tracking)
```
vendor_id                  INTEGER PRIMARY KEY (OneToOne with vendors)
step                       INTEGER DEFAULT 1
total_steps                INTEGER DEFAULT 8
current_status             VARCHAR(100)
completion_percentage      DECIMAL(5,2) DEFAULT 0
started_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
completed_at               TIMESTAMP
steps_completed            JSONB DEFAULT '[]'
pending_actions            JSONB DEFAULT '[]'
assigned_to                VARCHAR(255)
notes                      TEXT
created_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP

Indexes: current_status, completion_percentage

8-Step Onboarding Process:
1. profile_completion
2. document_upload
3. compliance_verification
4. contract_signing
5. payment_setup
6. training_completion
7. first_listing_creation
8. final_approval
```

#### `vendor_communications` (Email/Notification Log)
```
id                      SERIAL PRIMARY KEY
vendor_id               INTEGER REFERENCES vendors(id) ON DELETE CASCADE
communication_type      VARCHAR(50)
template_id             VARCHAR(100)
subject                 VARCHAR(500)
content                 TEXT
status                  VARCHAR(50) DEFAULT 'sent' - 'sent'|'opened'|'clicked'|'responded'
sent_at                 TIMESTAMP DEFAULT CURRENT_TIMESTAMP
opened_at               TIMESTAMP
clicked_at              TIMESTAMP
response_received_at    TIMESTAMP
metadata                JSONB DEFAULT '{}'

Indexes: vendor_id, status, sent_at
```

#### `vendor_communication_templates` (Email Templates)
```
id                 SERIAL PRIMARY KEY
template_id        VARCHAR(100) UNIQUE NOT NULL
template_name      VARCHAR(255) NOT NULL
subject            VARCHAR(500)
body_html          TEXT
body_text          TEXT
variables          JSONB DEFAULT '[]'
category           VARCHAR(50) - 'onboarding'|'status'|'compliance'
is_active          BOOLEAN DEFAULT true
created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP

Indexes: template_id, category

Predefined Templates:
- welcome: Welcome to vendor network
- approval: Application approved
- rejection: Application status update
- document_request: Additional documents required
- compliance_reminder: Compliance update needed
```

#### `directory_subscribers` (Directory User Access)
```
id                   SERIAL PRIMARY KEY
email                VARCHAR(255) UNIQUE NOT NULL
name                 VARCHAR(255)
company              VARCHAR(255)
phone                VARCHAR(20)
access_level         VARCHAR(50) - 'basic'|'premium'|'vendor'
subscription_status  VARCHAR(50) - 'active'|'inactive'|'suspended'
last_login           TIMESTAMP
login_count          INTEGER DEFAULT 0
preferences          JSONB
created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
```

---

## 2. API ENDPOINTS AND FUNCTIONALITY

### Base URL: `/api/vendors/`

#### Vendor CRUD Operations

**GET /api/vendors** (List Vendors)
- Query Parameters:
  - `all=true` (admin only) - Get all vendors regardless of status
  - `categories=true` - Get list of vendor categories
  - `category=<slug>` - Filter by category slug
  - `search=<query>` - Search by name/description/email/services/tags
  - `location=<location>` - Filter by location
  - `featured=true` - Filter for featured vendors only
  - `verified=true` - Filter for verified vendors only
- Headers:
  - `x-admin-request: true` - Required for accessing non-approved vendors
- Returns: `{ vendors: [], total: number }`

**GET /api/vendors/[id]** (Get Single Vendor)
- Path Parameters:
  - `id` - Vendor ID
- Returns: `{ vendor: Vendor }`

**GET /api/vendors/slug/[slug]** (Get Vendor by Slug)
- Path Parameters:
  - `slug` - Vendor slug
- Returns: `{ vendor: Vendor }` (only if approved or admin)

**POST /api/vendors** (Create Vendor)
- Auth: `x-admin-request: true` required
- Body: Partial Vendor object with:
  - `company_name` (required)
  - Auto-generates slug if not provided
- Returns: `{ vendor: Vendor }`

**PUT /api/vendors/[id]** (Update Vendor)
- Auth: `x-admin-request: true` required
- Path Parameters:
  - `id` - Vendor ID
- Body: Partial Vendor object
- Returns: `{ vendor: Vendor }`

**PATCH /api/vendors/[id]** (Partial Update)
- Auth: `x-admin-request: true` required
- Path Parameters:
  - `id` - Vendor ID
- Body: Object with fields to update (status, featured, etc.)
- Returns: `{ vendor: Vendor }`

**DELETE /api/vendors/[id]** (Delete Vendor)
- Auth: `x-admin-request: true` required
- Path Parameters:
  - `id` - Vendor ID
- Returns: `{ success: true }`

#### Advanced Features

**GET /api/vendors/top-categories** (Popular Categories)
- Returns: List of top vendor categories by count

**POST /api/vendors/bulk** (Bulk Operations)
- Auth: `x-admin-request: true` required
- Body:
  ```json
  {
    "action": "approve"|"reject"|"delete",
    "vendorIds": [1, 2, 3, ...]
  }
  ```
- Returns: Array of updated vendors

**POST /api/vendors/import** (CSV Import)
- Bulk import vendors from CSV file

**POST /api/vendors/upload** (File Upload)
- Upload vendor documents/images

**GET /api/vendors/subscribe** (Directory Subscription)
**POST /api/vendors/subscribe** (Create Subscription)
- Email-based subscription for directory access

**GET /api/vendors/subscribers** (List Subscribers)
- Auth: `x-admin-request: true` required
- Returns: List of directory subscribers

**GET /api/vendors/applications** (List Applications)
- Returns: Pending vendor applications

**POST /api/vendors/auth** (Vendor Authentication)
**GET /api/vendors/status** (Vendor Status Check)
**GET /api/vendors/profile** (Get Vendor Profile)

---

## 3. PUBLIC VENDOR LISTING PAGE

### Location: `/app/vendor-directory/vendors/page.tsx`

#### Key Features:
- **Authentication Required**: Users must log in to view vendor directory
- **Responsive Grid**: 3-column layout (desktop), 2-column (tablet), 1-column (mobile)
- **Search Functionality**: Real-time search with 300ms debounce
  - Searches: company name, description, services, tags
- **Filtering Options**:
  - By category (dropdown)
  - By location (text input)
  - By featured status
  - By verified status
- **Sorting Options**:
  - Featured first
  - Name A-Z
  - Newest first
- **Vendor Card Display**:
  - Company logo/avatar
  - Company name with verified badge
  - Category badge
  - Description (2-line clamp)
  - Services tags (max 3 shown, +N indicator)
  - Location with icon
  - Pricing range (emoji: 💰-💰💰💰)
  - Years in business & team size
  - Featured badge (if featured)

#### Analytics Tracking:
- `trackVendorSearch()` - Triggered on search input > 2 characters
- `trackVendorFilter()` - Triggered on filter/sort changes
- `trackVendorView()` - Triggered when clicking on vendor card

#### State Management:
- `vendors[]` - All vendors
- `categories[]` - Vendor categories
- `loading` - Loading state
- `searchTerm` - Search input
- `locationSearch` - Location filter
- `selectedCategory` - Category filter
- `sortBy` - Sort option
- `subscriber` - Logged-in user data from sessionStorage

---

## 4. VENDOR DETAIL PAGE

### Location: `/app/vendor-directory/vendors/[slug]/page.tsx`

#### Key Features:
- **Dynamic Route**: Based on vendor slug
- **Access Control**: Only shows approved vendors (redirects to directory if not found)
- **Display Elements**:
  - Vendor logo with fallback
  - Company name with verified/featured badges
  - Category information
  - Contact details (email, phone, website)
  - Description
  - Services & specialties
  - Location with map link capability
  - Pricing range & minimum budget
  - Years in business & team size
  - Certifications & tags
  - Client references
  - Portfolio items
  - Social media links
  - Average rating & review count
  - Reviews section
  - Contact CTA buttons

#### Analytics:
- `trackVendorContact()` - When user initiates contact
- `trackVendorWebsiteClick()` - When user visits vendor website

---

## 5. ADMIN VENDOR MANAGEMENT PAGE

### Location: `/app/admin/vendors/manage/page.tsx`

#### Key Features:

**Dashboard Metrics** (4 stat cards):
- Total vendors count + new this month
- Approved count with percentage
- Pending review count
- Average rating with total review count

**Search & Filter Bar**:
- Free text search (company name, contact name, email)
- Status filter dropdown (All, Approved, Pending, Rejected)
- Bulk actions menu (when vendors selected)

**Vendor Table with:**
- Checkbox column for multi-select
- Company info (name, logo, pricing, services, featured badge)
- Contact info (name, email with copy button)
- Location (editable inline)
- Status badge with quick change dropdown
- Average rating with review count
- Join date
- Actions menu:
  - Preview (opens vendor detail page)
  - Edit (opens edit page)
  - More actions:
    - Copy email
    - Visit website
    - Delete vendor

**Inline Editing**:
- Click on fields to edit inline (company_name, contact_name, location, services)
- Save with Enter key, Cancel with Escape key
- Real-time updates to API

**Quick Actions**:
- Status change dropdown per vendor (approved/pending/rejected)
- Feature/unfeature toggle
- Bulk approve/reject selected vendors
- Bulk delete selected vendors

**Bulk Operations**:
- Multi-select vendors via checkboxes
- Header checkbox to select all filtered vendors
- Bulk action menu appears when vendors selected
- Operations: approve, reject, delete

#### User Interactions:
- Debounced search
- Real-time filter updates
- Toast notifications for success/error
- Confirmation dialogs for destructive actions

---

## 6. VENDOR EDIT PAGE

### Location: `/app/admin/vendors/[id]/edit/page.tsx`

#### Key Features:
- Form to update vendor details
- Save changes to database
- Status management
- Featured/verified toggles
- Category selection
- Document upload capability

---

## 7. KEY COMPONENTS

### Vendor-Related Components:
- `vendor-csv-import.tsx` - CSV import interface for bulk vendor uploads
- `vendor-status-manager.tsx` - Status management component
- `vendor-batch-processor.tsx` - Batch processing for bulk operations

### UI Components Used (from Shadcn/UI):
- Card, CardContent, CardHeader, CardTitle, CardDescription
- Button (multiple variants)
- Input, Select, Badge, Label
- Switch, Textarea
- Table, TableBody, TableCell, TableHead, TableHeader, TableRow
- DropdownMenu, DropdownMenuContent, DropdownMenuItem
- Avatar, AvatarFallback, AvatarImage
- Progress, Tabs, TabsContent, TabsList, TabsTrigger
- Toast notifications via `use-toast` hook

### Icons Used (from Lucide React):
- Building2, Users, DollarSign, Star, MapPin, Globe, Phone, Mail, Calendar
- Search, Filter, Eye, Edit, Trash2, Plus, Download, Upload
- CheckCircle, XCircle, Clock, AlertCircle, TrendingUp
- FileText, Shield, Activity, ChevronRight, MoreHorizontal, ExternalLink, RefreshCw
- Save, X, Check, Copy

---

## 8. DATABASE SERVICE LAYER

### File: `/lib/vendors-db.ts`

**Interfaces Exported**:
- `Vendor` - Full vendor object
- `VendorCategory` - Category object
- `VendorReview` - Review object
- `DirectorySubscriber` - Subscriber object

**Database Functions**:

**Vendor Queries**:
- `getVendorCategories()` - Get all active categories ordered by display_order
- `getApprovedVendors()` - Get approved vendors with ratings and reviews
- `getAllVendors()` - Get all vendors (admin access)
- `getVendorById(id)` - Get vendor by ID with category and ratings
- `getVendorBySlug(slug)` - Get vendor by slug with category and ratings
- `createVendor(vendor)` - Create new vendor record
- `updateVendor(id, updates)` - Update vendor (handles array/JSONB fields properly)
- `deleteVendor(id)` - Delete vendor and cascade delete related records

**Review Management**:
- `getVendorReviews(vendorId)` - Get approved reviews for vendor
- `createVendorReview(review)` - Create new review (starts in pending status)

**Subscriber Management**:
- `getDirectorySubscribers()` - Get all subscribers
- `createDirectorySubscriber(subscriber)` - Create/update subscriber via email
- `getDirectorySubscriberByEmail(email)` - Look up subscriber
- `updateDirectorySubscriber(id, updates)` - Update subscriber
- `updateSubscriberLogin(email)` - Update last_login and increment login_count
- `subscribeToDirectory()` - Alias for createDirectorySubscriber
- `getSubscriberByEmail()` - Alias for getDirectorySubscriberByEmail

**Database Connection**:
- Uses Neon serverless PostgreSQL client
- Lazy initialization with error handling
- Requires DATABASE_URL environment variable

---

## 9. VENDOR SERVICE LAYER

### File: `/lib/vendors-service.ts`

**Advanced Service Methods**:

**Search & Analytics**:
- `searchVendors(params)` - Advanced search with filters, pagination, sorting
  - Filters: query, category, location, priceRange, rating, verified, featured, status
  - Returns: vendors[], total count, hasMore flag
- `getVendorMetrics(timeframe)` - Comprehensive metrics dashboard
  - Returns: totalVendors, activeVendors, pendingVendors, averageApprovalTime, conversionRate, topCategories, monthlyGrowth, satisfactionScore

**Activity & Compliance Tracking**:
- `logActivity(activity)` - Log vendor activity events
- `getVendorActivity(vendorId, limit)` - Get activity history
- `updateCompliance(vendorId, compliance)` - Update and calculate compliance score
- `calculateComplianceScore(compliance)` - Weighted scoring algorithm
  - insurance_verified: 25%
  - license_verified: 25%
  - background_check: 20%
  - tax_id_verified: 15%
  - contract_signed: 15%

**Performance Tracking**:
- `updatePerformance(vendorId)` - Calculate performance metrics and tier
  - Performance tiers:
    - platinum: >=4.5 rating + >=50 events
    - gold: >=4.0 rating + >=25 events
    - silver: >=3.5 rating + >=10 events
    - bronze: default

**Onboarding Workflow**:
- `initializeOnboarding(vendorId)` - Start onboarding (8 steps)
- `updateOnboardingProgress(vendorId, completedStep)` - Mark step complete
  - Auto-approves vendor when all steps complete

**Document Management**:
- `uploadDocument(document)` - Store document metadata
- `reviewDocument(documentId, status, reviewerEmail, notes)` - Approve/reject document
- `getVendorDocuments(vendorId)` - Get vendor's documents

**Bulk Operations**:
- `bulkUpdateStatus(vendorIds, status, reviewerEmail)` - Bulk approve/reject/suspend
  - Logs activity for each vendor
- `sendNotification(vendorId, type, data)` - Send templated notifications
- `getVendorsRequiringAction()` - Flag vendors needing attention
  - Flags:
    - overdue_review: pending >7 days
    - low_compliance: compliance score <50
    - insurance_expiring: expiry <30 days
    - license_expiring: expiry <30 days
    - incomplete_onboarding: >14 days without completion
    - pending_documents: pending document reviews

---

## 10. KEY DESIGN PATTERNS

### Authentication Pattern:
- Header-based admin check: `x-admin-request: true`
- SessionStorage for logged-in subscribers
- Automatic redirect if not authenticated

### API Response Pattern:
```json
{
  "vendor": {...} or "vendors": [...],
  "total": number,
  "stats": {...} or "categories": [...]
}
```

### Error Handling:
- HTTP status codes (404, 401, 500)
- User-friendly error messages
- Toast notifications in UI
- Console error logging

### Data Validation:
- Automatic slug generation from company_name
- Array type conversion in database layer
- Null/undefined handling for optional fields

### State Management:
- React hooks (useState, useEffect)
- SessionStorage for user data
- Router navigation for redirects

---

## 11. MIGRATION FILES

All migrations use PostgreSQL syntax and are located in `/migrations/`:

1. **vendor-categories.sql** - Category table and default categories
2. **vendor-system-tables.sql** - Activity, documents, compliance, performance, onboarding, communications
3. **vendor-auth-changelog.sql** - Auth-related changes
4. **vendor-applications.sql** - Application workflow tables
5. **vendor-reviews.sql** - Reviews table and trigger for rating auto-updates

---

## IMPLEMENTATION RECOMMENDATIONS FOR CONFERENCES

To implement a similar structure for event industry conferences, follow this pattern:

1. **Create core tables**: conferences, conference_categories, conference_reviews
2. **Create support tables**: conference_activity, conference_documents, conference_speakers
3. **Implement service layer**: conferences-db.ts, conferences-service.ts
4. **Create API endpoints**: /api/conferences with same CRUD operations
5. **Build public listing**: /app/conference-directory/conferences/page.tsx
6. **Build detail page**: /app/conference-directory/conferences/[slug]/page.tsx
7. **Build admin panel**: /app/admin/conferences/manage/page.tsx
8. **Create components**: conference-csv-import.tsx, conference-batch-processor.tsx
9. **Add authentication**: Same header-based admin check pattern
10. **Add analytics tracking**: Track conference searches, views, registrations

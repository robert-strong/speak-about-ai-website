# Vendor Directory - Quick Reference Guide

## File Structure Overview

```
/app/
  /api/vendors/
    route.ts                    # GET all vendors, POST create vendor
    [id]/route.ts              # GET, PUT, PATCH, DELETE single vendor
    slug/[slug]/route.ts       # GET vendor by slug
    /subscribe/route.ts        # Subscription management
    /profile/route.ts          # Vendor profile
    /auth/route.ts             # Authentication
    /applications/route.ts     # Applications list
    /status/route.ts           # Status check
    /upload/route.ts           # File upload
    /import/route.ts           # CSV import
    /top-categories/route.ts   # Popular categories
    /subscribers/route.ts      # Directory subscribers
  /vendor-directory/
    /vendors/
      page.tsx                 # Public listing page
      /[slug]/page.tsx        # Vendor detail page
  /admin/
    /vendors/
      /manage/page.tsx        # Admin management dashboard
      /[id]/edit/page.tsx     # Vendor edit page

/lib/
  vendors-db.ts               # Database layer (CRUD)
  vendors-service.ts          # Business logic layer (advanced features)

/components/
  vendor-csv-import.tsx       # CSV import UI
  vendor-status-manager.tsx   # Status management
  vendor-batch-processor.tsx  # Bulk operations

/migrations/
  vendor-categories.sql
  vendor-system-tables.sql
  vendor-auth-changelog.sql
  vendor-applications.sql
  vendor-reviews.sql
```

---

## Database Schema at a Glance

```
vendors (core)
├── vendor_categories (lookup)
├── vendor_reviews (public)
├── vendor_activity (audit)
├── vendor_documents (management)
├── vendor_compliance (verification)
├── vendor_performance (metrics)
├── vendor_onboarding (workflow)
├── vendor_communications (logs)
├── vendor_communication_templates (email templates)
└── directory_subscribers (access control)
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---|
| `/api/vendors` | GET | List vendors with filters | Optional |
| `/api/vendors` | POST | Create new vendor | Yes |
| `/api/vendors/[id]` | GET | Get single vendor | No |
| `/api/vendors/[id]` | PUT | Full update | Yes |
| `/api/vendors/[id]` | PATCH | Partial update | Yes |
| `/api/vendors/[id]` | DELETE | Delete vendor | Yes |
| `/api/vendors/slug/[slug]` | GET | Get by slug | No |
| `/api/vendors/top-categories` | GET | Popular categories | No |
| `/api/vendors/bulk` | POST | Bulk operations | Yes |
| `/api/vendors/import` | POST | CSV import | Yes |
| `/api/vendors/upload` | POST | File upload | Yes |
| `/api/vendors/subscribe` | POST | Create subscription | No |
| `/api/vendors/subscribers` | GET | List subscribers | Yes |

---

## Key Features by Layer

### Frontend Pages
- **Public Listing** (`/vendor-directory/vendors`)
  - Search, filter, sort vendors
  - Responsive grid layout
  - Analytics tracking
  - Login required
  
- **Detail Page** (`/vendor-directory/vendors/[slug]`)
  - Full vendor profile
  - Reviews section
  - Contact options
  - Analytics tracking
  
- **Admin Dashboard** (`/admin/vendors/manage`)
  - List all vendors
  - Inline editing
  - Bulk operations
  - Quick status changes
  - Metrics dashboard

### Database Layer (`vendors-db.ts`)
- Basic CRUD operations
- Vendor queries with joins
- Review management
- Subscriber management
- Category lookups

### Service Layer (`vendors-service.ts`)
- Advanced search with filters
- Compliance scoring
- Performance tracking
- Onboarding workflow
- Document management
- Bulk operations
- Activity logging
- Notifications

---

## Authentication Pattern

```typescript
// Admin check via request header
const isAdmin = request.headers.get("x-admin-request") === "true"

// Subscriber check via sessionStorage
const subscriberData = sessionStorage.getItem("directorySubscriber")
```

---

## Vendor Status Workflow

```
pending → approved ✓
       → rejected ✗
       → suspended ⚠️
```

**Status Effects:**
- `approved`: Visible in public directory
- `pending`: Admin review needed
- `rejected`: Not visible publicly
- `suspended`: Visible but marked as unavailable

---

## Default Categories (10)

1. Event Planning 📅
2. Catering 🍽️
3. Photography & Video 📸
4. Audio/Visual 🎤
5. Entertainment 🎵
6. Venues 🏛️
7. Decor & Design 🎨
8. Transportation 🚗
9. Staffing 👥
10. Technology 💻

---

## Vendor Onboarding Steps (8)

1. Profile Completion
2. Document Upload
3. Compliance Verification
4. Contract Signing
5. Payment Setup
6. Training Completion
7. First Listing Creation
8. Final Approval

---

## Performance Tiers

| Tier | Rating Required | Events Required |
|------|---|---|
| Platinum | 4.5+ | 50+ |
| Gold | 4.0+ | 25+ |
| Silver | 3.5+ | 10+ |
| Bronze | Any | Any |

---

## Compliance Score Calculation

- Insurance Verified: 25%
- License Verified: 25%
- Background Check: 20%
- Tax ID Verified: 15%
- Contract Signed: 15%

**Score Range:** 0-100% based on completed checks

---

## Vendor Flags (Action Required)

```
overdue_review           → pending for >7 days
low_compliance           → compliance score <50%
insurance_expiring       → expires within 30 days
license_expiring         → expires within 30 days
incomplete_onboarding    → >14 days without completion
pending_documents        → documents awaiting review
```

---

## Common Code Snippets

### Fetch All Vendors
```typescript
const response = await fetch("/api/vendors")
const { vendors } = await response.json()
```

### Search Vendors
```typescript
const params = new URLSearchParams({
  search: "catering",
  category: "catering",
  featured: "true"
})
const response = await fetch(`/api/vendors?${params}`)
```

### Admin: Update Vendor Status
```typescript
const response = await fetch(`/api/vendors/${vendorId}`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
    "x-admin-request": "true"
  },
  body: JSON.stringify({ status: "approved" })
})
```

### Admin: Bulk Approve
```typescript
const response = await fetch("/api/vendors/bulk", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-admin-request": "true"
  },
  body: JSON.stringify({
    action: "approve",
    vendorIds: [1, 2, 3, 4, 5]
  })
})
```

---

## Configuration Files

- **Database**: Uses Neon PostgreSQL via `DATABASE_URL` env var
- **UI Library**: Shadcn/UI components
- **Icons**: Lucide React
- **Date Format**: date-fns library
- **Notifications**: Custom toast component

---

## For Creating Conferences System

Replace `vendors` with `conferences` throughout:

1. Create `/migrations/conference-*.sql` files
2. Create `/lib/conferences-db.ts` and `/lib/conferences-service.ts`
3. Create `/app/api/conferences/` routes
4. Create `/app/conference-directory/` pages
5. Create `/app/admin/conferences/` pages
6. Create `/components/conference-*.tsx` components

Use identical patterns for:
- CRUD operations
- Search & filtering
- Admin management
- Bulk operations
- Activity logging
- Compliance tracking (if needed)


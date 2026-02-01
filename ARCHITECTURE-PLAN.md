# Home Page & Page Editor Architecture Plan

## Current Architecture Overview

### Database Layer
- **Table**: `website_content` with columns: `id`, `page`, `section`, `content_key`, `content_value`, `updated_at`, `updated_by`
- **Content Key Format**: `{page}.{section}.{content_key}` (e.g., `home.hero.title`)
- **Caching**: 1-minute in-memory cache in `lib/website-content.ts`

### Data Flow
```
Database (website_content table)
    ↓
API (/api/admin/website-content)
    ↓
lib/website-content.ts (getPageContent, getFromContent)
    ↓
Page Components (Hero, ClientLogos, etc.) ← Actual rendered pages
    ↓
Page Preview Components ← Editor UI
```

---

## Current Home Page Sections & Content Keys

| Section | Component File | Content Keys | Status |
|---------|----------------|--------------|--------|
| **Hero** | `hero.tsx` | `home.hero.badge`, `home.hero.title`, `home.hero.subtitle` | ✅ Database-driven |
| **Client Logos** | `client-logos.tsx` | `home.client-logos.title`, `subtitle`, `cta_text`, `cta_link`, `logos` (JSON) | ✅ Database-driven |
| **Featured Speakers** | `featured-speakers.tsx` | `home.featured-speakers.title`, `subtitle`, `cta_text` | ✅ Database-driven |
| **Why Choose Us** | `why-choose-us.tsx` | `home.why-choose-us.section_title`, `section_subtitle`, `feature[1-6]_title`, `feature[1-6]_description` | ✅ Database-driven |
| **Navigate the Noise** | `navigate-the-noise.tsx` | `home.navigate.section_title`, `section_subtitle`, `budget_*`, `audience_*`, `global_*` | ✅ Database-driven |
| **SEO Content** | `seo-content.tsx` | `home.seo-content.main_title`, `intro`, `why_title`, `why_text`, `industries_title`, `topics_title`, `book_title`, `book_text`, `cta_text`, `cta_link`, `closing` | ✅ Database-driven |
| **FAQ** | `home-faq-section.tsx` | `home.seo-faq.section_title`, `faq[1-4]_question`, `faq[1-4]_answer` | ✅ Database-driven |
| **Booking CTA** | `booking-cta.tsx` | `home.booking-cta.title`, `subtitle`, `primary_cta_text`, `primary_cta_link`, `secondary_cta_text`, `secondary_cta_link`, `whatsapp_number`, `whatsapp_link`, `email` | ✅ Database-driven |

---

## Current Issues

### 1. Default Values in Multiple Places
Defaults exist in 4 locations that can get out of sync:
- `DEFAULT_CONTENT` array in `/api/admin/website-content/route.ts`
- `defaults` object in `lib/website-content.ts`
- Hardcoded fallbacks in actual components
- Default values in preview components

**Recommendation**: Create a single source of truth for defaults.

### 2. Complex Data Handling Inconsistency
Different approaches for complex data:
- **JSON strings**: `logos`, `features` (requires parsing)
- **Individual keys**: `faq1_question`, `faq1_answer` (easier to edit)
- **Hybrid**: Navigate section uses some JSON, some individual keys

**Recommendation**: Standardize on individual keys for editable content, JSON for lists where order matters.

### 3. Preview Component Duplication
Preview components duplicate rendering logic from actual components. Changes to actual components require manual updates to previews.

**Recommendation**: Consider shared rendering primitives or a component registry.

---

## Proposed Improvements

### Phase 1: Single Source of Defaults (High Priority)

Create a new file `lib/content-defaults.ts`:

```typescript
// Central source of truth for all content defaults
export const CONTENT_DEFAULTS = {
  home: {
    hero: {
      badge: '#1 AI-Exclusive Speaker Bureau',
      title: 'Book an AI Speaker for Your Event',
      subtitle: 'The #1 AI speaker bureau...'
    },
    'client-logos': {
      title: 'Trusted by Industry Leaders',
      // ... etc
    }
  }
}

// Helper to get a default value
export function getDefault(page: string, section: string, key: string): string {
  return CONTENT_DEFAULTS[page]?.[section]?.[key] || ''
}
```

Then update:
- `lib/website-content.ts` to import from this
- `/api/admin/website-content/route.ts` to use this for seeding
- Components to import defaults from here

### Phase 2: Content Registry Pattern (Medium Priority)

Create a registry that maps content keys to their metadata:

```typescript
// lib/content-registry.ts
export const CONTENT_REGISTRY = {
  'home.hero.title': {
    type: 'text',
    label: 'Hero Title',
    description: 'Main headline on the home page',
    maxLength: 100
  },
  'home.client-logos.logos': {
    type: 'json-array',
    label: 'Client Logos',
    schema: { name: 'string', src: 'string', size: 'string' }
  }
}
```

Benefits:
- Self-documenting content model
- Could generate editor UI from registry
- Validation support
- Better TypeScript types

### Phase 3: Shared Rendering Components (Low Priority)

Instead of duplicating rendering in preview vs. actual components, create shared primitives:

```typescript
// components/content-section.tsx
export function ContentSection({
  content,
  contentKey,
  editable = false,
  onContentChange,
  render
}: ContentSectionProps) {
  const value = content[contentKey] || getDefault(contentKey)

  if (editable) {
    return (
      <EditableText
        value={value}
        onChange={(v) => onContentChange(contentKey, v)}
      >
        {render(value)}
      </EditableText>
    )
  }

  return render(value)
}
```

---

## Immediate Fixes Needed

### 1. Missing Content Keys in API Defaults

The API's `DEFAULT_CONTENT` is missing these keys that components use:

```typescript
// Add to DEFAULT_CONTENT in /api/admin/website-content/route.ts

// Featured Speakers (new section)
{ page: 'home', section: 'featured-speakers', content_key: 'title', content_value: 'Featured AI Keynote Speakers' },
{ page: 'home', section: 'featured-speakers', content_key: 'subtitle', content_value: 'World-class artificial intelligence experts...' },
{ page: 'home', section: 'featured-speakers', content_key: 'cta_text', content_value: 'View All AI Speakers' },

// Booking CTA individual fields
{ page: 'home', section: 'booking-cta', content_key: 'primary_cta_text', content_value: 'Get Speaker Recommendations' },
{ page: 'home', section: 'booking-cta', content_key: 'primary_cta_link', content_value: '/contact?source=home_page_cta_main' },
{ page: 'home', section: 'booking-cta', content_key: 'secondary_cta_text', content_value: 'Explore All Speakers' },
{ page: 'home', section: 'booking-cta', content_key: 'secondary_cta_link', content_value: '/speakers' },
{ page: 'home', section: 'booking-cta', content_key: 'whatsapp_number', content_value: '+1 (510) 435-3947' },
{ page: 'home', section: 'booking-cta', content_key: 'whatsapp_link', content_value: 'https://wa.me/15104353947' },
{ page: 'home', section: 'booking-cta', content_key: 'email', content_value: 'human@speakabout.ai' },
```

### 2. Update Section Keys for Consistency

Current: `home.navigate.budget_title`, `home.navigate.global_title`
Actual component uses: `home.navigate.budget_title`, `home.navigate.global_title`

These match, but the preview uses simplified keys. Need to verify all mappings.

---

## File Reference

| File | Purpose |
|------|---------|
| `lib/website-content.ts` | Content fetching helpers |
| `app/api/admin/website-content/route.ts` | Content API + defaults |
| `app/admin/website-editor/page.tsx` | Editor UI |
| `components/page-preview/index.tsx` | Preview components |
| `components/editable-text.tsx` | EditableText, EditableImage, LogoListEditor |
| `components/hero.tsx` | Actual Hero component |
| `components/client-logos.tsx` | Actual Client Logos component |
| `components/featured-speakers.tsx` | Actual Featured Speakers component |
| `components/why-choose-us.tsx` | Actual Why Choose Us component |
| `components/navigate-the-noise.tsx` | Actual Navigate section |
| `components/seo-content.tsx` | Actual SEO Content section |
| `components/home-faq-section.tsx` | Actual FAQ section |
| `components/booking-cta.tsx` | Actual Booking CTA section |

---

## Next Steps

1. [ ] Add missing content keys to `DEFAULT_CONTENT` in API route
2. [ ] Create `lib/content-defaults.ts` as single source of truth
3. [ ] Update `lib/website-content.ts` to use centralized defaults
4. [ ] Verify all preview components match actual components
5. [ ] Add LogoListEditor to client logos preview (done)
6. [ ] Consider adding similar list editors for FAQs and features

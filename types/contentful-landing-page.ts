import type { Asset, Entry, Document } from "contentful"

// --- Field Types from Contentful ---

interface CmsFormField {
  fieldName: string
  fieldLabel: string
  fieldType: string
  placeholderText?: string
  helpText?: string
  validations?: {
    required?: boolean
    minLength?: number
    maxLength?: number
    pattern?: string
    errorMessage?: string
  }
  fieldWidth?: string
  sortOrder?: number
}

interface CmsProcessStep {
  stepNumber: number
  stepTitle: string
  stepDescription: string
  timeEstimate?: string
}

interface CmsFaqItem {
  question: string
  answer: Document // Rich Text
  includeInSchema?: boolean
  sortOrder?: number
}

// --- Main Landing Page Type ---

export interface LandingPage {
  // SEO & Metadata
  pageTitle: string
  metaDescription: string
  urlSlug: string

  // Hero Section
  heroHeadline: string
  heroSubheadline: Document // Rich Text
  heroBulletPoints?: string[]
  heroImage?: Asset

  // Form
  formFields?: Entry<CmsFormField>[]

  // Page Content Sections
  howItWorksSteps?: Entry<CmsProcessStep>[]
  benefitsSection?: Document // Rich Text
  faqSection?: Entry<CmsFaqItem>[]
  seoContent?: Document // Rich Text

  // Tracking
  trackingCodes?: {
    gtmId?: string
    ga4Id?: string
    fbPixelId?: string
    conversionEvents?: Record<string, string>
  }
  schemaMarkup?: Record<string, any>
}

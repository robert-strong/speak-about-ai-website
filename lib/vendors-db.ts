import { neon } from "@neondatabase/serverless"

// Lazy initialize Neon client
let sql: any = null

function getSQL() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      console.error("DATABASE_URL environment variable is not set")
      throw new Error("Database configuration error: DATABASE_URL not set")
    }
    try {
      sql = neon(process.env.DATABASE_URL)
      console.log("Vendors DB: Database connection initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Neon client for vendors:", error)
      throw error
    }
  }
  return sql
}

export interface VendorCategory {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  display_order: number
  created_at: string
}

export interface Vendor {
  id: number
  company_name: string
  slug: string
  category_id?: number
  category?: VendorCategory
  contact_name?: string
  contact_email: string
  contact_phone?: string
  website?: string
  logo_url?: string
  description?: string
  services?: string[]
  specialties?: string[]
  pricing_range?: string
  minimum_budget?: number
  location?: string
  years_in_business?: number
  team_size?: string
  certifications?: string[]
  featured: boolean
  verified: boolean
  status: "pending" | "approved" | "rejected" | "suspended"
  tags?: string[]
  social_media?: any
  portfolio_items?: any
  client_references?: any
  created_at: string
  updated_at: string
  approved_at?: string
  approved_by?: string
  average_rating?: number
  review_count?: number
}

export interface VendorReview {
  id: number
  vendor_id: number
  reviewer_name: string
  reviewer_email: string
  reviewer_company?: string
  rating: number
  review_text?: string
  verified_purchase: boolean
  helpful_count: number
  response_text?: string
  response_date?: string
  status: "pending" | "approved" | "rejected"
  created_at: string
  updated_at: string
}

export interface DirectorySubscriber {
  id: number
  email: string
  name?: string
  company?: string
  phone?: string
  access_level: "basic" | "premium" | "vendor"
  subscription_status: "active" | "inactive" | "suspended"
  last_login?: string
  login_count: number
  preferences?: any
  created_at: string
  updated_at: string
}

// Get all vendor categories
export async function getVendorCategories(): Promise<VendorCategory[]> {
  const db = getSQL()
  try {
    const categories = await db`
      SELECT * FROM vendor_categories
      ORDER BY display_order, name
    `
    return categories as VendorCategory[]
  } catch (error) {
    console.error("Error fetching vendor categories:", error)
    throw error
  }
}

// Get all approved vendors
export async function getApprovedVendors(): Promise<Vendor[]> {
  const db = getSQL()
  try {
    const vendors = await db`
      SELECT 
        v.*,
        vc.name as category_name,
        vc.slug as category_slug,
        vc.icon as category_icon,
        COALESCE(AVG(vr.rating), 0) as average_rating,
        COUNT(DISTINCT vr.id) as review_count
      FROM vendors v
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      LEFT JOIN vendor_reviews vr ON v.id = vr.vendor_id AND vr.status = 'approved'
      WHERE v.status = 'approved'
      GROUP BY v.id, vc.id
      ORDER BY v.featured DESC, v.company_name
    `
    return vendors.map(v => ({
      ...v,
      category: v.category_name ? {
        id: v.category_id,
        name: v.category_name,
        slug: v.category_slug,
        icon: v.category_icon
      } : undefined
    })) as Vendor[]
  } catch (error) {
    console.error("Error fetching approved vendors:", error)
    throw error
  }
}

// Get all vendors (admin)
export async function getAllVendors(): Promise<Vendor[]> {
  const db = getSQL()
  try {
    const vendors = await db`
      SELECT 
        v.*,
        vc.name as category_name,
        vc.slug as category_slug,
        vc.icon as category_icon,
        COALESCE(AVG(vr.rating), 0) as average_rating,
        COUNT(DISTINCT vr.id) as review_count
      FROM vendors v
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      LEFT JOIN vendor_reviews vr ON v.id = vr.vendor_id AND vr.status = 'approved'
      GROUP BY v.id, vc.id
      ORDER BY v.created_at DESC
    `
    return vendors.map(v => ({
      ...v,
      category: v.category_name ? {
        id: v.category_id,
        name: v.category_name,
        slug: v.category_slug,
        icon: v.category_icon
      } : undefined
    })) as Vendor[]
  } catch (error) {
    console.error("Error fetching all vendors:", error)
    throw error
  }
}

// Get vendor by ID
export async function getVendorById(id: number): Promise<Vendor | null> {
  const db = getSQL()
  try {
    const vendors = await db`
      SELECT 
        v.*,
        vc.name as category_name,
        vc.slug as category_slug,
        vc.icon as category_icon,
        COALESCE(AVG(vr.rating), 0) as average_rating,
        COUNT(DISTINCT vr.id) as review_count
      FROM vendors v
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      LEFT JOIN vendor_reviews vr ON v.id = vr.vendor_id AND vr.status = 'approved'
      WHERE v.id = ${id}
      GROUP BY v.id, vc.id
    `
    if (vendors.length === 0) return null
    
    const vendor = vendors[0]
    return {
      ...vendor,
      category: vendor.category_name ? {
        id: vendor.category_id,
        name: vendor.category_name,
        slug: vendor.category_slug,
        icon: vendor.category_icon
      } : undefined
    } as Vendor
  } catch (error) {
    console.error("Error fetching vendor by ID:", error)
    throw error
  }
}

// Get vendor by slug
export async function getVendorBySlug(slug: string): Promise<Vendor | null> {
  const db = getSQL()
  try {
    const vendors = await db`
      SELECT 
        v.*,
        vc.name as category_name,
        vc.slug as category_slug,
        vc.icon as category_icon,
        COALESCE(AVG(vr.rating), 0) as average_rating,
        COUNT(DISTINCT vr.id) as review_count
      FROM vendors v
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      LEFT JOIN vendor_reviews vr ON v.id = vr.vendor_id AND vr.status = 'approved'
      WHERE v.slug = ${slug}
      GROUP BY v.id, vc.id
    `
    if (vendors.length === 0) return null
    
    const vendor = vendors[0]
    return {
      ...vendor,
      category: vendor.category_name ? {
        id: vendor.category_id,
        name: vendor.category_name,
        slug: vendor.category_slug,
        icon: vendor.category_icon
      } : undefined
    } as Vendor
  } catch (error) {
    console.error("Error fetching vendor by slug:", error)
    throw error
  }
}

// Create vendor
export async function createVendor(vendor: Partial<Vendor>): Promise<Vendor> {
  const db = getSQL()
  try {
    const result = await db`
      INSERT INTO vendors (
        company_name, slug, category_id, contact_name, contact_email,
        contact_phone, website, logo_url, description, services,
        specialties, pricing_range, minimum_budget, location,
        years_in_business, team_size, certifications, featured,
        verified, status, tags, social_media, portfolio_items,
        client_references
      ) VALUES (
        ${vendor.company_name}, ${vendor.slug}, ${vendor.category_id}, 
        ${vendor.contact_name || null}, ${vendor.contact_email},
        ${vendor.contact_phone || null}, ${vendor.website || null}, 
        ${vendor.logo_url || null}, ${vendor.description || null},
        ${vendor.services || null}, ${vendor.specialties || null},
        ${vendor.pricing_range || null}, ${vendor.minimum_budget || null},
        ${vendor.location || null}, ${vendor.years_in_business || null},
        ${vendor.team_size || null}, ${vendor.certifications || null},
        ${vendor.featured || false}, ${vendor.verified || false},
        ${vendor.status || 'pending'}, ${vendor.tags || null},
        ${vendor.social_media || null}, ${vendor.portfolio_items || null},
        ${vendor.client_references || null}
      )
      RETURNING *
    `
    return result[0] as Vendor
  } catch (error) {
    console.error("Error creating vendor:", error)
    throw error
  }
}

// Update vendor - handles partial updates properly
export async function updateVendor(id: number, updates: Partial<Vendor>): Promise<Vendor> {
  const db = getSQL()
  try {
    console.log("updateVendor called with id:", id)
    
    // Clean the updates object to remove any problematic fields
    const cleanedUpdates = { ...updates }
    
    // Remove JSONB fields if they're problematic - we'll handle them separately
    delete cleanedUpdates.social_media
    delete cleanedUpdates.portfolio_items
    delete cleanedUpdates.client_references
    
    console.log("Cleaned updates (without JSONB fields):", JSON.stringify(cleanedUpdates, null, 2))
    
    // First get the current vendor to merge with updates
    const current = await getVendorById(id)
    if (!current) {
      throw new Error(`Vendor with id ${id} not found`)
    }

    // Merge updates with current data, preserving undefined as null
    // Note: JSONB fields are excluded from updates
    const merged = {
      company_name: cleanedUpdates.company_name !== undefined ? cleanedUpdates.company_name : current.company_name,
      slug: cleanedUpdates.slug !== undefined ? cleanedUpdates.slug : current.slug,
      category_id: cleanedUpdates.category_id !== undefined ? cleanedUpdates.category_id : current.category_id,
      contact_name: cleanedUpdates.contact_name !== undefined ? cleanedUpdates.contact_name : current.contact_name,
      contact_email: cleanedUpdates.contact_email !== undefined ? cleanedUpdates.contact_email : current.contact_email,
      contact_phone: cleanedUpdates.contact_phone !== undefined ? cleanedUpdates.contact_phone : current.contact_phone,
      website: cleanedUpdates.website !== undefined ? cleanedUpdates.website : current.website,
      logo_url: cleanedUpdates.logo_url !== undefined ? cleanedUpdates.logo_url : current.logo_url,
      description: cleanedUpdates.description !== undefined ? cleanedUpdates.description : current.description,
      services: cleanedUpdates.services !== undefined ? cleanedUpdates.services : current.services,
      specialties: cleanedUpdates.specialties !== undefined ? cleanedUpdates.specialties : current.specialties,
      pricing_range: cleanedUpdates.pricing_range !== undefined ? cleanedUpdates.pricing_range : current.pricing_range,
      minimum_budget: cleanedUpdates.minimum_budget !== undefined ? cleanedUpdates.minimum_budget : current.minimum_budget,
      location: cleanedUpdates.location !== undefined ? cleanedUpdates.location : current.location,
      years_in_business: cleanedUpdates.years_in_business !== undefined ? cleanedUpdates.years_in_business : current.years_in_business,
      team_size: cleanedUpdates.team_size !== undefined ? cleanedUpdates.team_size : current.team_size,
      certifications: cleanedUpdates.certifications !== undefined ? cleanedUpdates.certifications : current.certifications,
      featured: cleanedUpdates.featured !== undefined ? cleanedUpdates.featured : current.featured,
      verified: cleanedUpdates.verified !== undefined ? cleanedUpdates.verified : current.verified,
      status: cleanedUpdates.status !== undefined ? cleanedUpdates.status : current.status,
      tags: cleanedUpdates.tags !== undefined ? cleanedUpdates.tags : current.tags
    }

    // Convert arrays to PostgreSQL array format if they exist
    const servicesArray = merged.services ? 
      (Array.isArray(merged.services) ? merged.services : [merged.services]) : []
    const specialtiesArray = merged.specialties ? 
      (Array.isArray(merged.specialties) ? merged.specialties : [merged.specialties]) : []
    const certificationsArray = merged.certifications ? 
      (Array.isArray(merged.certifications) ? merged.certifications : [merged.certifications]) : []
    const tagsArray = merged.tags ? 
      (Array.isArray(merged.tags) ? merged.tags : [merged.tags]) : []
    
    // Note: JSONB fields (social_media, portfolio_items, client_references) are not updated
    // to avoid JSON parsing errors. They retain their existing values.

    const result = await db`
      UPDATE vendors
      SET
        company_name = ${merged.company_name},
        slug = ${merged.slug},
        category_id = ${merged.category_id},
        contact_name = ${merged.contact_name},
        contact_email = ${merged.contact_email},
        contact_phone = ${merged.contact_phone},
        website = ${merged.website},
        logo_url = ${merged.logo_url},
        description = ${merged.description},
        services = ${servicesArray},
        specialties = ${specialtiesArray},
        pricing_range = ${merged.pricing_range},
        minimum_budget = ${merged.minimum_budget},
        location = ${merged.location},
        years_in_business = ${merged.years_in_business},
        team_size = ${merged.team_size},
        certifications = ${certificationsArray},
        featured = ${merged.featured},
        verified = ${merged.verified},
        status = ${merged.status},
        tags = ${tagsArray},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    
    if (!result || result.length === 0) {
      throw new Error(`Failed to update vendor with id ${id}`)
    }
    
    return result[0] as Vendor
  } catch (error) {
    console.error("Error updating vendor with id", id, ":", error)
    console.error("Updates attempted:", updates)
    throw error
  }
}

// Delete vendor
export async function deleteVendor(id: number): Promise<boolean> {
  const db = getSQL()
  try {
    await db`DELETE FROM vendors WHERE id = ${id}`
    return true
  } catch (error) {
    console.error("Error deleting vendor:", error)
    throw error
  }
}

// Get vendor reviews
export async function getVendorReviews(vendorId: number): Promise<VendorReview[]> {
  const db = getSQL()
  try {
    const reviews = await db`
      SELECT * FROM vendor_reviews
      WHERE vendor_id = ${vendorId} AND status = 'approved'
      ORDER BY created_at DESC
    `
    return reviews as VendorReview[]
  } catch (error) {
    console.error("Error fetching vendor reviews:", error)
    throw error
  }
}

// Create vendor review
export async function createVendorReview(review: Partial<VendorReview>): Promise<VendorReview> {
  const db = getSQL()
  try {
    const result = await db`
      INSERT INTO vendor_reviews (
        vendor_id, reviewer_name, reviewer_email, reviewer_company,
        rating, review_text, verified_purchase, status
      ) VALUES (
        ${review.vendor_id}, ${review.reviewer_name}, ${review.reviewer_email},
        ${review.reviewer_company || null}, ${review.rating}, 
        ${review.review_text || null}, ${review.verified_purchase || false},
        ${review.status || 'pending'}
      )
      RETURNING *
    `
    return result[0] as VendorReview
  } catch (error) {
    console.error("Error creating vendor review:", error)
    throw error
  }
}

// Directory Subscriber functions
export async function getDirectorySubscribers(): Promise<DirectorySubscriber[]> {
  const db = getSQL()
  try {
    const subscribers = await db`
      SELECT * FROM directory_subscribers
      ORDER BY created_at DESC
    `
    return subscribers as DirectorySubscriber[]
  } catch (error) {
    console.error("Error fetching directory subscribers:", error)
    throw error
  }
}

export async function createDirectorySubscriber(subscriber: Partial<DirectorySubscriber>): Promise<DirectorySubscriber> {
  const db = getSQL()
  try {
    const result = await db`
      INSERT INTO directory_subscribers (
        email, name, company, phone, access_level, subscription_status
      ) VALUES (
        ${subscriber.email}, ${subscriber.name || null}, 
        ${subscriber.company || null}, ${subscriber.phone || null},
        ${subscriber.access_level || 'basic'}, 
        ${subscriber.subscription_status || 'active'}
      )
      ON CONFLICT (email) 
      DO UPDATE SET 
        name = COALESCE(${subscriber.name}, directory_subscribers.name),
        company = COALESCE(${subscriber.company}, directory_subscribers.company),
        phone = COALESCE(${subscriber.phone}, directory_subscribers.phone),
        last_login = CURRENT_TIMESTAMP,
        login_count = directory_subscribers.login_count + 1
      RETURNING *
    `
    return result[0] as DirectorySubscriber
  } catch (error) {
    console.error("Error creating/updating directory subscriber:", error)
    throw error
  }
}

export async function getDirectorySubscriberByEmail(email: string): Promise<DirectorySubscriber | null> {
  const db = getSQL()
  try {
    const result = await db`
      SELECT * FROM directory_subscribers
      WHERE email = ${email}
    `
    return result.length > 0 ? result[0] as DirectorySubscriber : null
  } catch (error) {
    console.error("Error fetching subscriber by email:", error)
    throw error
  }
}

export async function updateDirectorySubscriber(
  id: number, 
  updates: Partial<DirectorySubscriber>
): Promise<DirectorySubscriber> {
  const db = getSQL()
  try {
    const result = await db`
      UPDATE directory_subscribers
      SET
        name = COALESCE(${updates.name}, name),
        company = COALESCE(${updates.company}, company),
        phone = COALESCE(${updates.phone}, phone),
        access_level = COALESCE(${updates.access_level}, access_level),
        subscription_status = COALESCE(${updates.subscription_status}, subscription_status),
        last_login = COALESCE(${updates.last_login}, last_login),
        login_count = COALESCE(${updates.login_count}, login_count),
        preferences = COALESCE(${updates.preferences}, preferences),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    return result[0] as DirectorySubscriber
  } catch (error) {
    console.error("Error updating directory subscriber:", error)
    throw error
  }
}

// Alias functions for compatibility with subscribe route
export const subscribeToDirectory = createDirectorySubscriber
export const getSubscriberByEmail = getDirectorySubscriberByEmail

export async function updateSubscriberLogin(email: string): Promise<DirectorySubscriber | null> {
  const db = getSQL()
  try {
    const result = await db`
      UPDATE directory_subscribers 
      SET 
        last_login = CURRENT_TIMESTAMP,
        login_count = login_count + 1,
        updated_at = CURRENT_TIMESTAMP
      WHERE email = ${email}
      RETURNING *
    `
    
    return result[0] as DirectorySubscriber || null
  } catch (error) {
    console.error("Error updating subscriber login:", error)
    throw error
  }
}
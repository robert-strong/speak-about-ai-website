import { neon } from "@neondatabase/serverless"

// Lazy initialization of Neon client
let sql: any = null
let databaseAvailable = false
let initialized = false

function initializeDatabase() {
  if (initialized) return
  
  try {
    if (process.env.DATABASE_URL) {
      console.log("Speakers DB: Initializing Neon client...")
      sql = neon(process.env.DATABASE_URL)
      databaseAvailable = true
      initialized = true
      console.log("Speakers DB: Neon client initialized successfully")
    } else {
      console.warn("DATABASE_URL environment variable is not set - speakers database unavailable")
      initialized = true
    }
  } catch (error) {
    console.error("Failed to initialize Neon client for speakers:", error)
    initialized = true
  }
}

export interface Speaker {
  id: number
  email: string
  name: string
  slug?: string
  bio?: string
  short_bio?: string
  one_liner?: string
  title?: string
  company?: string
  
  // Profile URLs
  headshot_url?: string
  profile_photo_url?: string
  speaker_reel_url?: string
  one_sheet_url?: string
  website?: string
  
  // Keynote programs (can be string or array in database)
  programs?: string | string[]
  
  // Location
  location?: string
  
  // Social Media (JSONB in DB)
  social_media?: {
    twitter?: string
    linkedin?: string
    instagram?: string
    youtube?: string
  }
  
  // Topics and expertise
  topics?: any[] // Legacy JSONB field
  primary_topics?: string[]
  secondary_topics?: string[]
  keywords?: string[]
  
  // Financial
  speaking_fee_range?: string
  speaking_fee_min?: number
  speaking_fee_max?: number
  commission_rate?: number
  
  // Requirements and preferences
  travel_preferences?: string
  technical_requirements?: string
  dietary_restrictions?: string
  preferred_event_types?: string[]
  
  // Availability
  availability_status?: string
  blackout_dates?: string[]
  
  // Experience
  years_speaking?: number
  total_engagements?: number
  industries_served?: string[]
  notable_clients?: string[]
  certifications?: string[]
  awards?: string[]
  
  // Approval workflow (removed status - doesn't exist in DB)
  // status?: 'pending' | 'approved' | 'rejected' | 'suspended'
  approval_notes?: string
  approved_by?: string
  approved_at?: string
  
  // Internal
  internal_rating?: number
  internal_notes?: string
  preferred_partner?: boolean
  
  // Sensitive data (encrypted in app layer)
  emergency_contact?: any
  bank_details?: any
  tax_info?: any
  
  // Metadata
  active: boolean
  listed?: boolean
  featured?: boolean
  ranking?: number
  created_at: string
  updated_at: string
  last_login?: string
  profile_views?: number
}

export interface SpeakerTestimonial {
  id: number
  speaker_id: number
  client_name: string
  client_title?: string
  client_company?: string
  testimonial_text: string
  event_name?: string
  event_date?: string
  rating?: number
  is_featured: boolean
  display_order: number
  created_at: string
  approved: boolean
  approved_by?: string
  approved_at?: string
}

export interface SpeakerDocument {
  id: number
  speaker_id: number
  document_type: string
  document_name: string
  document_url: string
  file_size?: number
  mime_type?: string
  uploaded_at: string
  is_public: boolean
}

export interface SpeakerEngagement {
  id: number
  speaker_id: number
  deal_id?: number
  event_name: string
  event_date: string
  client_company?: string
  event_type?: string
  location?: string
  attendee_count?: number
  speaker_fee?: number
  commission_amount?: number
  client_rating?: number
  client_feedback?: string
  created_at: string
}

// Get all speakers with optional filters
export async function getAllSpeakers(filters?: {
  status?: string
  availability?: string
  minFee?: number
  maxFee?: number
}): Promise<Speaker[]> {
  initializeDatabase()
  
  if (!databaseAvailable || !sql) {
    console.warn("getAllSpeakers: Database not available")
    return []
  }
  
  try {
    console.log("Fetching all speakers from database...")
    
    // Use tagged template literals for Neon queries
    let speakers: Speaker[]
    
    if (!filters || Object.keys(filters).length === 0) {
      // Simple query without filters
      speakers = await sql`
        SELECT * FROM speakers 
        WHERE active = true
        ORDER BY created_at DESC
      `
    } else {
      // Build query with filters - removed status column references
      if (filters.availability && filters.minFee !== undefined && filters.maxFee !== undefined) {
        speakers = await sql`
          SELECT * FROM speakers 
          WHERE availability_status = ${filters.availability}
          AND speaking_fee_min >= ${filters.minFee}
          AND speaking_fee_max <= ${filters.maxFee}
          AND active = true
          ORDER BY created_at DESC
        `
      } else if (filters.availability) {
        speakers = await sql`
          SELECT * FROM speakers 
          WHERE availability_status = ${filters.availability}
          AND active = true
          ORDER BY created_at DESC
        `
      } else if (filters.minFee !== undefined && filters.maxFee !== undefined) {
        speakers = await sql`
          SELECT * FROM speakers 
          WHERE speaking_fee_min >= ${filters.minFee}
          AND speaking_fee_max <= ${filters.maxFee}
          AND active = true
          ORDER BY created_at DESC
        `
      } else if (filters.minFee !== undefined) {
        speakers = await sql`
          SELECT * FROM speakers 
          WHERE speaking_fee_min >= ${filters.minFee}
          AND active = true
          ORDER BY created_at DESC
        `
      } else if (filters.maxFee !== undefined) {
        speakers = await sql`
          SELECT * FROM speakers 
          WHERE speaking_fee_max <= ${filters.maxFee}
          AND active = true
          ORDER BY created_at DESC
        `
      } else {
        // Fallback to no filters
        speakers = await sql`
          SELECT * FROM speakers 
          WHERE active = true
          ORDER BY created_at DESC
        `
      }
    }
    
    console.log(`Successfully fetched ${speakers.length} speakers`)
    return speakers as Speaker[]
  } catch (error) {
    console.error("Error fetching speakers:", error)
    return []
  }
}

// Get speaker by ID
export async function getSpeakerById(id: number): Promise<Speaker | null> {
  initializeDatabase()
  
  if (!databaseAvailable || !sql) {
    console.warn("getSpeakerById: Database not available")
    return null
  }
  
  try {
    console.log("Fetching speaker by ID:", id)
    const [speaker] = await sql`
      SELECT * FROM speakers 
      WHERE id = ${id}
    `
    
    // Increment profile views
    if (speaker) {
      await sql`
        UPDATE speakers 
        SET profile_views = COALESCE(profile_views, 0) + 1 
        WHERE id = ${id}
      `
    }
    
    return speaker as Speaker || null
  } catch (error) {
    console.error("Error fetching speaker by ID:", error)
    return null
  }
}

// Get speaker by email
export async function getSpeakerByEmail(email: string): Promise<Speaker | null> {
  initializeDatabase()
  
  if (!databaseAvailable || !sql) {
    console.warn("getSpeakerByEmail: Database not available")
    return null
  }
  
  try {
    console.log("Fetching speaker by email:", email)
    const [speaker] = await sql`
      SELECT * FROM speakers 
      WHERE email = ${email}
    `
    return speaker as Speaker || null
  } catch (error) {
    console.error("Error fetching speaker by email:", error)
    return null
  }
}

// Get speaker by slug - optimized with index
export async function getSpeakerBySlug(slug: string): Promise<Speaker | null> {
  initializeDatabase()
  
  if (!databaseAvailable || !sql) {
    console.warn("getSpeakerBySlug: Database not available")
    return null
  }
  
  try {
    // First try with slug column if it exists
    const [speaker] = await sql`
      SELECT * FROM speakers
      WHERE slug = ${slug}
      AND listed = true
      LIMIT 1
    `
    
    // Increment profile views if speaker found
    if (speaker) {
      // Use non-blocking update for view count - check if column exists first
      sql`
        UPDATE speakers 
        SET profile_views = COALESCE(profile_views, 0) + 1 
        WHERE id = ${speaker.id}
      `.catch(err => {
        // Silently fail if profile_views column doesn't exist
      })
    }
    
    return speaker as Speaker || null
  } catch (error) {
    // If slug column doesn't exist, try by name
    if (error.message?.includes('column "slug" does not exist')) {
      try {
        // Convert slug back to name format (adam-cheyer -> Adam Cheyer)
        const name = slug.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ')
        
        const [speaker] = await sql`
          SELECT * FROM speakers
          WHERE LOWER(name) = ${name.toLowerCase()}
          AND listed = true
          LIMIT 1
        `
        
        return speaker as Speaker || null
      } catch (fallbackError) {
        console.error("Error fetching speaker by name fallback:", fallbackError)
        return null
      }
    }
    
    console.error("Error fetching speaker by slug:", error)
    return null
  }
}

// Create new speaker profile
export async function createSpeaker(speakerData: Omit<Speaker, 'id' | 'created_at' | 'updated_at'>): Promise<Speaker | null> {
  initializeDatabase()
  
  if (!databaseAvailable || !sql) {
    console.warn("createSpeaker: Database not available")
    return null
  }
  
  try {
    console.log("Creating new speaker profile:", speakerData.email)
    
    const [speaker] = await sql`
      INSERT INTO speakers (
        email, name, bio, short_bio, one_liner, title, company,
        headshot_url, profile_photo_url, speaker_reel_url, one_sheet_url, website,
        social_media, topics, primary_topics, secondary_topics, keywords,
        speaking_fee_range, speaking_fee_min, speaking_fee_max, commission_rate,
        travel_preferences, technical_requirements, dietary_restrictions, preferred_event_types,
        availability_status, blackout_dates,
        years_speaking, total_engagements, industries_served, notable_clients, certifications, awards,
        internal_rating, internal_notes, preferred_partner,
        emergency_contact, bank_details, tax_info, active
      ) VALUES (
        ${speakerData.email}, ${speakerData.name}, ${speakerData.bio}, ${speakerData.short_bio}, 
        ${speakerData.one_liner}, ${speakerData.title}, ${speakerData.company},
        ${speakerData.headshot_url}, ${speakerData.profile_photo_url}, ${speakerData.speaker_reel_url}, 
        ${speakerData.one_sheet_url}, ${speakerData.website},
        ${JSON.stringify(speakerData.social_media || {})}, ${JSON.stringify(speakerData.topics || [])}, 
        ${speakerData.primary_topics}, ${speakerData.secondary_topics}, ${speakerData.keywords},
        ${speakerData.speaking_fee_range}, ${speakerData.speaking_fee_min}, ${speakerData.speaking_fee_max}, 
        ${speakerData.commission_rate || 20.00},
        ${speakerData.travel_preferences}, ${speakerData.technical_requirements}, 
        ${speakerData.dietary_restrictions}, ${speakerData.preferred_event_types},
        ${speakerData.availability_status || 'available'}, ${speakerData.blackout_dates},
        ${speakerData.years_speaking}, ${speakerData.total_engagements}, ${speakerData.industries_served}, 
        ${speakerData.notable_clients}, ${speakerData.certifications}, ${speakerData.awards},
        ${speakerData.internal_rating}, 
        ${speakerData.internal_notes}, ${speakerData.preferred_partner || false},
        ${JSON.stringify(speakerData.emergency_contact || {})}, 
        ${JSON.stringify(speakerData.bank_details || {})}, 
        ${JSON.stringify(speakerData.tax_info || {})}, 
        ${speakerData.active !== false}
      )
      RETURNING *
    `
    
    console.log("Successfully created speaker with ID:", speaker.id)
    return speaker as Speaker
  } catch (error) {
    console.error("Error creating speaker:", error)
    return null
  }
}

// Update speaker profile
export async function updateSpeaker(id: number, speakerData: Partial<Speaker>): Promise<Speaker | null> {
  initializeDatabase()
  
  if (!databaseAvailable || !sql) {
    console.warn("updateSpeaker: Database not available")
    return null
  }
  
  try {
    console.log("Updating speaker ID:", id)
    
    const setClause: string[] = []
    const values: any[] = []
    let paramCount = 1
    
    // Build dynamic UPDATE query
    const fields = [
      'name', 'bio', 'short_bio', 'one_liner', 'title', 'company',
      'headshot_url', 'profile_photo_url', 'speaker_reel_url', 'one_sheet_url', 'website',
      'speaking_fee_range', 'speaking_fee_min', 'speaking_fee_max', 'commission_rate',
      'travel_preferences', 'technical_requirements', 'dietary_restrictions',
      'availability_status', 'years_speaking', 'total_engagements',
      'approval_notes', 'approved_by', 'internal_rating', 
      'internal_notes', 'preferred_partner', 'active'
    ]
    
    for (const field of fields) {
      if (speakerData[field as keyof Speaker] !== undefined) {
        setClause.push(`${field} = $${paramCount}`)
        values.push(speakerData[field as keyof Speaker])
        paramCount++
      }
    }
    
    // Handle JSONB fields
    if (speakerData.social_media !== undefined) {
      setClause.push(`social_media = $${paramCount}`)
      values.push(JSON.stringify(speakerData.social_media))
      paramCount++
    }
    
    // Handle array fields
    const arrayFields = ['primary_topics', 'secondary_topics', 'keywords', 'preferred_event_types', 
                        'blackout_dates', 'industries_served', 'notable_clients', 'certifications', 'awards']
    
    for (const field of arrayFields) {
      if (speakerData[field as keyof Speaker] !== undefined) {
        setClause.push(`${field} = $${paramCount}`)
        values.push(speakerData[field as keyof Speaker])
        paramCount++
      }
    }
    
    // Handle approval timestamp
    if (speakerData.status === 'approved' && speakerData.approved_by) {
      setClause.push(`approved_at = CURRENT_TIMESTAMP`)
    }
    
    if (setClause.length === 0) {
      console.warn("No fields to update")
      return null
    }
    
    values.push(id)
    
    const query = `
      UPDATE speakers 
      SET ${setClause.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `
    
    const [speaker] = await sql(query, values)
    console.log("Successfully updated speaker ID:", id)
    return speaker as Speaker
  } catch (error) {
    console.error("Error updating speaker:", error)
    return null
  }
}

// Search speakers
export async function searchSpeakers(searchTerm: string): Promise<Speaker[]> {
  initializeDatabase()
  
  if (!databaseAvailable || !sql) {
    console.warn("searchSpeakers: Database not available")
    return []
  }
  
  try {
    console.log("Searching speakers for term:", searchTerm)
    
    const speakers = await sql`
      SELECT * FROM speakers
      WHERE 
        search_vector @@ plainto_tsquery('english', ${searchTerm})
        OR name ILIKE ${'%' + searchTerm + '%'}
        OR bio ILIKE ${'%' + searchTerm + '%'}
        OR company ILIKE ${'%' + searchTerm + '%'}
      ORDER BY 
        ts_rank(search_vector, plainto_tsquery('english', ${searchTerm})) DESC,
        created_at DESC
    `
    
    console.log(`Found ${speakers.length} speakers matching search term`)
    return speakers as Speaker[]
  } catch (error) {
    console.error("Error searching speakers:", error)
    return []
  }
}

// Get speaker testimonials
export async function getSpeakerTestimonials(speakerId: number, onlyApproved: boolean = true): Promise<SpeakerTestimonial[]> {
  if (!databaseAvailable || !sql) {
    console.warn("getSpeakerTestimonials: Database not available")
    return []
  }
  
  try {
    let query = `SELECT * FROM speaker_testimonials WHERE speaker_id = ${speakerId}`
    if (onlyApproved) {
      query += ` AND approved = true`
    }
    query += ` ORDER BY is_featured DESC, display_order ASC, created_at DESC`
    
    const testimonials = await sql(query)
    return testimonials as SpeakerTestimonial[]
  } catch (error) {
    console.error("Error fetching speaker testimonials:", error)
    return []
  }
}

// Add speaker testimonial
export async function addSpeakerTestimonial(testimonialData: Omit<SpeakerTestimonial, 'id' | 'created_at'>): Promise<SpeakerTestimonial | null> {
  if (!databaseAvailable || !sql) {
    console.warn("addSpeakerTestimonial: Database not available")
    return null
  }
  
  try {
    const [testimonial] = await sql`
      INSERT INTO speaker_testimonials (
        speaker_id, client_name, client_title, client_company,
        testimonial_text, event_name, event_date, rating,
        is_featured, display_order, approved, approved_by, approved_at
      ) VALUES (
        ${testimonialData.speaker_id}, ${testimonialData.client_name}, 
        ${testimonialData.client_title}, ${testimonialData.client_company},
        ${testimonialData.testimonial_text}, ${testimonialData.event_name}, 
        ${testimonialData.event_date}, ${testimonialData.rating},
        ${testimonialData.is_featured || false}, ${testimonialData.display_order || 0}, 
        ${testimonialData.approved || false}, ${testimonialData.approved_by}, 
        ${testimonialData.approved_at}
      )
      RETURNING *
    `
    
    return testimonial as SpeakerTestimonial
  } catch (error) {
    console.error("Error adding speaker testimonial:", error)
    return null
  }
}

// Get speaker documents
export async function getSpeakerDocuments(speakerId: number, publicOnly: boolean = true): Promise<SpeakerDocument[]> {
  if (!databaseAvailable || !sql) {
    console.warn("getSpeakerDocuments: Database not available")
    return []
  }
  
  try {
    let query = `SELECT * FROM speaker_documents WHERE speaker_id = ${speakerId}`
    if (publicOnly) {
      query += ` AND is_public = true`
    }
    query += ` ORDER BY uploaded_at DESC`
    
    const documents = await sql(query)
    return documents as SpeakerDocument[]
  } catch (error) {
    console.error("Error fetching speaker documents:", error)
    return []
  }
}

// Get speaker engagements
export async function getSpeakerEngagements(speakerId: number): Promise<SpeakerEngagement[]> {
  if (!databaseAvailable || !sql) {
    console.warn("getSpeakerEngagements: Database not available")
    return []
  }
  
  try {
    const engagements = await sql`
      SELECT * FROM speaker_engagements 
      WHERE speaker_id = ${speakerId}
      ORDER BY event_date DESC
    `
    
    return engagements as SpeakerEngagement[]
  } catch (error) {
    console.error("Error fetching speaker engagements:", error)
    return []
  }
}

// Update speaker status (for approval workflow)
export async function updateSpeakerStatus(
  id: number, 
  status: Speaker['status'], 
  approvalNotes?: string, 
  approvedBy?: string
): Promise<Speaker | null> {
  if (!databaseAvailable || !sql) {
    console.warn("updateSpeakerStatus: Database not available")
    return null
  }
  
  try {
    console.log("Updating speaker status:", id, "to", status)
    
    const updateData: Partial<Speaker> = {
      status,
      approval_notes: approvalNotes
    }
    
    if (status === 'approved' && approvedBy) {
      updateData.approved_by = approvedBy
    }
    
    return await updateSpeaker(id, updateData)
  } catch (error) {
    console.error("Error updating speaker status:", error)
    return null
  }
}

// Delete speaker (soft delete by setting active = false)
export async function deleteSpeaker(id: number, hardDelete: boolean = false): Promise<boolean> {
  if (!databaseAvailable || !sql) {
    console.warn("deleteSpeaker: Database not available")
    return false
  }
  
  try {
    if (hardDelete) {
      console.log("Hard deleting speaker ID:", id)
      await sql`DELETE FROM speakers WHERE id = ${id}`
    } else {
      console.log("Soft deleting speaker ID:", id)
      await sql`UPDATE speakers SET active = false WHERE id = ${id}`
    }
    
    console.log("Successfully deleted speaker ID:", id)
    return true
  } catch (error) {
    console.error("Error deleting speaker:", error)
    return false
  }
}

// Test connection
export async function testSpeakersConnection(): Promise<boolean> {
  initializeDatabase()
  
  if (!databaseAvailable || !sql) {
    return false
  }
  
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error("Speakers database connection test failed:", error)
    return false
  }
}
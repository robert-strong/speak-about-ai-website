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
      console.log("Conferences DB: Database connection initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Neon client for conferences:", error)
      throw error
    }
  }
  return sql
}

export interface ConferenceCategory {
  id: number
  name: string
  slug: string
  description?: string
  icon?: string
  display_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Conference {
  id: number
  name: string
  slug: string
  category_id?: number
  category?: ConferenceCategory

  // Basic Info
  organization?: string
  website_url?: string
  description?: string

  // Date & Location
  start_date?: string
  end_date?: string
  date_display?: string
  location?: string
  city?: string
  state?: string
  country?: string
  venue?: string

  // Recurring Info
  is_recurring: boolean
  recurring_frequency?: string

  // Speaking Opportunities
  cfp_open: boolean
  cfp_link?: string
  cfp_deadline?: string
  cfp_deadline_display?: string
  speaker_benefits?: string
  cfp_notes?: string

  // Contact Information
  contact_name?: string
  contact_role?: string
  contact_email?: string
  contact_phone?: string
  contact_linkedin?: string

  // Status & Tracking
  status: 'to_do' | 'passed_watch' | 'blocked' | 'attending' | 'speaking'
  priority: 'low' | 'medium' | 'high'

  // Stats
  estimated_attendees?: number
  typical_speaker_count?: number

  // Media
  logo_url?: string
  banner_url?: string
  images?: any[]

  // Additional Info
  tags?: string[]
  topics?: string[]
  target_audience?: string
  event_format?: string

  // Internal tracking
  notes?: string
  internal_notes?: string

  // SEO
  meta_title?: string
  meta_description?: string

  // Flags
  featured: boolean
  verified: boolean
  published: boolean

  // Timestamps
  created_at: string
  updated_at: string
  published_at?: string

  // Admin
  created_by?: string
  updated_by?: string

  // Aggregated data
  average_rating?: number
  review_count?: number
  application_count?: number
}

export interface ConferenceApplication {
  id: number
  conference_id: number
  speaker_id: number

  application_date: string
  session_title?: string
  session_description?: string
  session_format?: string
  session_duration?: number

  status: 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn'
  submitted_at?: string
  reviewed_at?: string
  decision_date?: string
  decision_notes?: string

  follow_up_needed: boolean
  follow_up_date?: string
  follow_up_notes?: string

  confirmed: boolean
  speaking_date?: string
  speaking_time?: string
  room_assignment?: string
  compensation_amount?: number
  travel_covered: boolean
  accommodation_covered: boolean

  internal_notes?: string
  created_at: string
  updated_at: string
}

export interface ConferenceReview {
  id: number
  conference_id: number
  speaker_id: number

  overall_rating: number
  organization_rating?: number
  audience_quality_rating?: number
  networking_rating?: number

  review_title?: string
  review_text?: string
  pros?: string
  cons?: string

  attended_as: string
  would_return?: boolean
  would_recommend?: boolean

  year_attended?: number
  verified_attendance: boolean

  status: 'pending' | 'approved' | 'rejected'
  moderation_notes?: string

  created_at: string
  updated_at: string
}

export interface ConferenceSubscriber {
  id: number
  email: string
  name?: string
  company?: string
  role?: string

  interested_topics?: string[]
  preferred_locations?: string[]
  cfp_alerts: boolean
  newsletter: boolean

  subscription_status: 'active' | 'inactive' | 'unsubscribed'
  verified: boolean

  last_email_sent?: string
  email_count: number
  last_login?: string

  created_at: string
  updated_at: string
}

// ============ CATEGORY FUNCTIONS ============

export async function getConferenceCategories(): Promise<ConferenceCategory[]> {
  const db = getSQL()
  try {
    const categories = await db`
      SELECT * FROM conference_categories
      WHERE is_active = true
      ORDER BY display_order, name
    `
    return categories as ConferenceCategory[]
  } catch (error) {
    console.error("Error fetching conference categories:", error)
    throw error
  }
}

export async function getConferenceCategoryBySlug(slug: string): Promise<ConferenceCategory | null> {
  const db = getSQL()
  try {
    const result = await db`
      SELECT * FROM conference_categories
      WHERE slug = ${slug} AND is_active = true
    `
    return result.length > 0 ? result[0] as ConferenceCategory : null
  } catch (error) {
    console.error("Error fetching conference category by slug:", error)
    throw error
  }
}

// ============ CONFERENCE FUNCTIONS ============

export async function getPublishedConferences(): Promise<Conference[]> {
  const db = getSQL()
  try {
    const conferences = await db`
      SELECT
        c.*,
        cc.name as category_name,
        cc.slug as category_slug,
        cc.icon as category_icon,
        COALESCE(AVG(cr.overall_rating), 0) as average_rating,
        COUNT(DISTINCT cr.id) as review_count,
        COUNT(DISTINCT ca.id) as application_count
      FROM conferences c
      LEFT JOIN conference_categories cc ON c.category_id = cc.id
      LEFT JOIN conference_reviews cr ON c.id = cr.conference_id AND cr.status = 'approved'
      LEFT JOIN conference_applications ca ON c.id = ca.conference_id
      WHERE c.published = true
      GROUP BY c.id, cc.id
      ORDER BY c.featured DESC, c.start_date ASC, c.name
    `
    return conferences.map(c => ({
      ...c,
      category: c.category_name ? {
        id: c.category_id,
        name: c.category_name,
        slug: c.category_slug,
        icon: c.category_icon
      } : undefined
    })) as Conference[]
  } catch (error) {
    console.error("Error fetching published conferences:", error)
    throw error
  }
}

export async function getAllConferences(): Promise<Conference[]> {
  const db = getSQL()
  try {
    const conferences = await db`
      SELECT
        c.*,
        cc.name as category_name,
        cc.slug as category_slug,
        cc.icon as category_icon,
        COALESCE(AVG(cr.overall_rating), 0) as average_rating,
        COUNT(DISTINCT cr.id) as review_count,
        COUNT(DISTINCT ca.id) as application_count
      FROM conferences c
      LEFT JOIN conference_categories cc ON c.category_id = cc.id
      LEFT JOIN conference_reviews cr ON c.id = cr.conference_id AND cr.status = 'approved'
      LEFT JOIN conference_applications ca ON c.id = ca.conference_id
      GROUP BY c.id, cc.id
      ORDER BY c.created_at DESC
    `
    return conferences.map(c => ({
      ...c,
      category: c.category_name ? {
        id: c.category_id,
        name: c.category_name,
        slug: c.category_slug,
        icon: c.category_icon
      } : undefined
    })) as Conference[]
  } catch (error) {
    console.error("Error fetching all conferences:", error)
    throw error
  }
}

export async function getConferenceById(id: number): Promise<Conference | null> {
  const db = getSQL()
  try {
    const result = await db`
      SELECT
        c.*,
        cc.name as category_name,
        cc.slug as category_slug,
        cc.icon as category_icon,
        COALESCE(AVG(cr.overall_rating), 0) as average_rating,
        COUNT(DISTINCT cr.id) as review_count,
        COUNT(DISTINCT ca.id) as application_count
      FROM conferences c
      LEFT JOIN conference_categories cc ON c.category_id = cc.id
      LEFT JOIN conference_reviews cr ON c.id = cr.conference_id AND cr.status = 'approved'
      LEFT JOIN conference_applications ca ON c.id = ca.conference_id
      WHERE c.id = ${id}
      GROUP BY c.id, cc.id
    `
    if (result.length === 0) return null

    const conference = result[0]
    return {
      ...conference,
      category: conference.category_name ? {
        id: conference.category_id,
        name: conference.category_name,
        slug: conference.category_slug,
        icon: conference.category_icon
      } : undefined
    } as Conference
  } catch (error) {
    console.error("Error fetching conference by ID:", error)
    throw error
  }
}

export async function getConferenceBySlug(slug: string): Promise<Conference | null> {
  const db = getSQL()
  try {
    const result = await db`
      SELECT
        c.*,
        cc.name as category_name,
        cc.slug as category_slug,
        cc.icon as category_icon,
        COALESCE(AVG(cr.overall_rating), 0) as average_rating,
        COUNT(DISTINCT cr.id) as review_count,
        COUNT(DISTINCT ca.id) as application_count
      FROM conferences c
      LEFT JOIN conference_categories cc ON c.category_id = cc.id
      LEFT JOIN conference_reviews cr ON c.id = cr.conference_id AND cr.status = 'approved'
      LEFT JOIN conference_applications ca ON c.id = ca.conference_id
      WHERE c.slug = ${slug}
      GROUP BY c.id, cc.id
    `
    if (result.length === 0) return null

    const conference = result[0]
    return {
      ...conference,
      category: conference.category_name ? {
        id: conference.category_id,
        name: conference.category_name,
        slug: conference.category_slug,
        icon: conference.category_icon
      } : undefined
    } as Conference
  } catch (error) {
    console.error("Error fetching conference by slug:", error)
    throw error
  }
}

export async function searchConferences(filters: {
  search?: string
  category?: string
  location?: string
  cfp_open?: boolean
  status?: string
  start_date_from?: string
  start_date_to?: string
  topics?: string[]
}): Promise<Conference[]> {
  const db = getSQL()
  try {
    let query = `
      SELECT
        c.*,
        cc.name as category_name,
        cc.slug as category_slug,
        cc.icon as category_icon,
        COALESCE(AVG(cr.overall_rating), 0) as average_rating,
        COUNT(DISTINCT cr.id) as review_count,
        COUNT(DISTINCT ca.id) as application_count
      FROM conferences c
      LEFT JOIN conference_categories cc ON c.category_id = cc.id
      LEFT JOIN conference_reviews cr ON c.id = cr.conference_id AND cr.status = 'approved'
      LEFT JOIN conference_applications ca ON c.id = ca.conference_id
      WHERE c.published = true
    `

    const params: any[] = []

    if (filters.search) {
      query += ` AND (c.name ILIKE $${params.length + 1} OR c.description ILIKE $${params.length + 1} OR c.organization ILIKE $${params.length + 1})`
      params.push(`%${filters.search}%`)
    }

    if (filters.category) {
      query += ` AND cc.slug = $${params.length + 1}`
      params.push(filters.category)
    }

    if (filters.location) {
      query += ` AND (c.city ILIKE $${params.length + 1} OR c.country ILIKE $${params.length + 1} OR c.location ILIKE $${params.length + 1})`
      params.push(`%${filters.location}%`)
    }

    if (filters.cfp_open !== undefined) {
      query += ` AND c.cfp_open = $${params.length + 1}`
      params.push(filters.cfp_open)
    }

    if (filters.status) {
      query += ` AND c.status = $${params.length + 1}`
      params.push(filters.status)
    }

    if (filters.start_date_from) {
      query += ` AND c.start_date >= $${params.length + 1}`
      params.push(filters.start_date_from)
    }

    if (filters.start_date_to) {
      query += ` AND c.start_date <= $${params.length + 1}`
      params.push(filters.start_date_to)
    }

    query += `
      GROUP BY c.id, cc.id
      ORDER BY c.featured DESC, c.start_date ASC, c.name
    `

    const result = await db.query(query, params)
    const conferences = Array.isArray(result) ? result : result.rows || []
    return conferences.map((c: any) => ({
      ...c,
      category: c.category_name ? {
        id: c.category_id,
        name: c.category_name,
        slug: c.category_slug,
        icon: c.category_icon
      } : undefined
    })) as Conference[]
  } catch (error) {
    console.error("Error searching conferences:", error)
    throw error
  }
}

export async function createConference(conference: Partial<Conference>): Promise<Conference> {
  const db = getSQL()
  try {
    const result = await db`
      INSERT INTO conferences (
        name, slug, category_id, organization, website_url, description,
        start_date, end_date, date_display, location, city, state, country, venue,
        is_recurring, recurring_frequency,
        cfp_open, cfp_link, cfp_deadline, cfp_deadline_display, speaker_benefits, cfp_notes,
        contact_name, contact_role, contact_email, contact_phone, contact_linkedin,
        status, priority, estimated_attendees, typical_speaker_count,
        logo_url, banner_url, images,
        tags, topics, target_audience, event_format,
        notes, internal_notes, meta_title, meta_description,
        featured, verified, published, created_by
      ) VALUES (
        ${conference.name}, ${conference.slug}, ${conference.category_id || null},
        ${conference.organization || null}, ${conference.website_url || null}, ${conference.description || null},
        ${conference.start_date || null}, ${conference.end_date || null}, ${conference.date_display || null},
        ${conference.location || null}, ${conference.city || null}, ${conference.state || null},
        ${conference.country || null}, ${conference.venue || null},
        ${conference.is_recurring || false}, ${conference.recurring_frequency || null},
        ${conference.cfp_open || false}, ${conference.cfp_link || null}, ${conference.cfp_deadline || null},
        ${conference.cfp_deadline_display || null}, ${conference.speaker_benefits || null}, ${conference.cfp_notes || null},
        ${conference.contact_name || null}, ${conference.contact_role || null}, ${conference.contact_email || null},
        ${conference.contact_phone || null}, ${conference.contact_linkedin || null},
        ${conference.status || 'to_do'}, ${conference.priority || 'medium'},
        ${conference.estimated_attendees || null}, ${conference.typical_speaker_count || null},
        ${conference.logo_url || null}, ${conference.banner_url || null}, ${JSON.stringify(conference.images || [])},
        ${conference.tags || null}, ${conference.topics || null},
        ${conference.target_audience || null}, ${conference.event_format || null},
        ${conference.notes || null}, ${conference.internal_notes || null},
        ${conference.meta_title || null}, ${conference.meta_description || null},
        ${conference.featured || false}, ${conference.verified || false},
        ${conference.published || false}, ${conference.created_by || null}
      )
      RETURNING *
    `
    return result[0] as Conference
  } catch (error) {
    console.error("Error creating conference:", error)
    throw error
  }
}

export async function updateConference(id: number, updates: Partial<Conference>): Promise<Conference> {
  const db = getSQL()
  try {
    // Get current conference
    const current = await getConferenceById(id)
    if (!current) {
      throw new Error(`Conference with id ${id} not found`)
    }

    // Merge updates with current data
    const merged = { ...current, ...updates }

    const result = await db`
      UPDATE conferences
      SET
        name = ${merged.name},
        slug = ${merged.slug},
        category_id = ${merged.category_id},
        organization = ${merged.organization},
        website_url = ${merged.website_url},
        description = ${merged.description},
        start_date = ${merged.start_date},
        end_date = ${merged.end_date},
        date_display = ${merged.date_display},
        location = ${merged.location},
        city = ${merged.city},
        state = ${merged.state},
        country = ${merged.country},
        venue = ${merged.venue},
        is_recurring = ${merged.is_recurring},
        recurring_frequency = ${merged.recurring_frequency},
        cfp_open = ${merged.cfp_open},
        cfp_link = ${merged.cfp_link},
        cfp_deadline = ${merged.cfp_deadline},
        cfp_deadline_display = ${merged.cfp_deadline_display},
        speaker_benefits = ${merged.speaker_benefits},
        cfp_notes = ${merged.cfp_notes},
        contact_name = ${merged.contact_name},
        contact_role = ${merged.contact_role},
        contact_email = ${merged.contact_email},
        contact_phone = ${merged.contact_phone},
        contact_linkedin = ${merged.contact_linkedin},
        status = ${merged.status},
        priority = ${merged.priority},
        estimated_attendees = ${merged.estimated_attendees},
        typical_speaker_count = ${merged.typical_speaker_count},
        logo_url = ${merged.logo_url},
        banner_url = ${merged.banner_url},
        images = ${JSON.stringify(merged.images || [])},
        tags = ${merged.tags},
        topics = ${merged.topics},
        target_audience = ${merged.target_audience},
        event_format = ${merged.event_format},
        notes = ${merged.notes},
        internal_notes = ${merged.internal_notes},
        meta_title = ${merged.meta_title},
        meta_description = ${merged.meta_description},
        featured = ${merged.featured},
        verified = ${merged.verified},
        published = ${merged.published},
        updated_at = CURRENT_TIMESTAMP,
        updated_by = ${updates.updated_by}
      WHERE id = ${id}
      RETURNING *
    `

    if (!result || result.length === 0) {
      throw new Error(`Failed to update conference with id ${id}`)
    }

    return result[0] as Conference
  } catch (error) {
    console.error("Error updating conference:", error)
    throw error
  }
}

export async function deleteConference(id: number): Promise<boolean> {
  const db = getSQL()
  try {
    await db`DELETE FROM conferences WHERE id = ${id}`
    return true
  } catch (error) {
    console.error("Error deleting conference:", error)
    throw error
  }
}

// ============ SUBSCRIBER FUNCTIONS ============

export async function createConferenceSubscriber(subscriber: Partial<ConferenceSubscriber>): Promise<ConferenceSubscriber> {
  const db = getSQL()
  try {
    const result = await db`
      INSERT INTO conference_subscribers (
        email, name, company, role, interested_topics, preferred_locations,
        cfp_alerts, newsletter, subscription_status
      ) VALUES (
        ${subscriber.email}, ${subscriber.name || null}, ${subscriber.company || null},
        ${subscriber.role || null}, ${subscriber.interested_topics || null},
        ${subscriber.preferred_locations || null}, ${subscriber.cfp_alerts !== false},
        ${subscriber.newsletter !== false}, ${subscriber.subscription_status || 'active'}
      )
      ON CONFLICT (email)
      DO UPDATE SET
        name = COALESCE(${subscriber.name}, conference_subscribers.name),
        company = COALESCE(${subscriber.company}, conference_subscribers.company),
        role = COALESCE(${subscriber.role}, conference_subscribers.role),
        last_login = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `
    return result[0] as ConferenceSubscriber
  } catch (error) {
    console.error("Error creating conference subscriber:", error)
    throw error
  }
}

export async function getConferenceSubscriberByEmail(email: string): Promise<ConferenceSubscriber | null> {
  const db = getSQL()
  try {
    const result = await db`
      SELECT * FROM conference_subscribers
      WHERE email = ${email}
    `
    return result.length > 0 ? result[0] as ConferenceSubscriber : null
  } catch (error) {
    console.error("Error fetching conference subscriber:", error)
    throw error
  }
}

// ============ APPLICATIONS FUNCTIONS ============

export async function createConferenceApplication(application: Partial<ConferenceApplication>): Promise<ConferenceApplication> {
  const db = getSQL()
  try {
    const result = await db`
      INSERT INTO conference_applications (
        conference_id, speaker_id, session_title, session_description,
        session_format, session_duration, status, submitted_at
      ) VALUES (
        ${application.conference_id}, ${application.speaker_id},
        ${application.session_title || null}, ${application.session_description || null},
        ${application.session_format || null}, ${application.session_duration || null},
        ${application.status || 'submitted'}, CURRENT_TIMESTAMP
      )
      RETURNING *
    `
    return result[0] as ConferenceApplication
  } catch (error) {
    console.error("Error creating conference application:", error)
    throw error
  }
}

export async function getApplicationsByConference(conferenceId: number): Promise<ConferenceApplication[]> {
  const db = getSQL()
  try {
    const applications = await db`
      SELECT * FROM conference_applications
      WHERE conference_id = ${conferenceId}
      ORDER BY application_date DESC
    `
    return applications as ConferenceApplication[]
  } catch (error) {
    console.error("Error fetching applications for conference:", error)
    throw error
  }
}

export async function getApplicationsBySpeaker(speakerId: number): Promise<ConferenceApplication[]> {
  const db = getSQL()
  try {
    const applications = await db`
      SELECT ca.*, c.name as conference_name, c.slug as conference_slug
      FROM conference_applications ca
      JOIN conferences c ON ca.conference_id = c.id
      WHERE ca.speaker_id = ${speakerId}
      ORDER BY ca.application_date DESC
    `
    return applications as ConferenceApplication[]
  } catch (error) {
    console.error("Error fetching applications for speaker:", error)
    throw error
  }
}

// ============ REVIEWS FUNCTIONS ============

export async function getConferenceReviews(conferenceId: number): Promise<ConferenceReview[]> {
  const db = getSQL()
  try {
    const reviews = await db`
      SELECT * FROM conference_reviews
      WHERE conference_id = ${conferenceId} AND status = 'approved'
      ORDER BY created_at DESC
    `
    return reviews as ConferenceReview[]
  } catch (error) {
    console.error("Error fetching conference reviews:", error)
    throw error
  }
}

export async function createConferenceReview(review: Partial<ConferenceReview>): Promise<ConferenceReview> {
  const db = getSQL()
  try {
    const result = await db`
      INSERT INTO conference_reviews (
        conference_id, speaker_id, overall_rating, organization_rating,
        audience_quality_rating, networking_rating, review_title, review_text,
        pros, cons, attended_as, would_return, would_recommend, year_attended, status
      ) VALUES (
        ${review.conference_id}, ${review.speaker_id}, ${review.overall_rating},
        ${review.organization_rating || null}, ${review.audience_quality_rating || null},
        ${review.networking_rating || null}, ${review.review_title || null},
        ${review.review_text || null}, ${review.pros || null}, ${review.cons || null},
        ${review.attended_as || 'attendee'}, ${review.would_return || null},
        ${review.would_recommend || null}, ${review.year_attended || null},
        ${review.status || 'pending'}
      )
      RETURNING *
    `
    return result[0] as ConferenceReview
  } catch (error) {
    console.error("Error creating conference review:", error)
    throw error
  }
}

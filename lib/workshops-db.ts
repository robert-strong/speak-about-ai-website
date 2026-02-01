import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export interface Testimonial {
  name: string
  role: string
  company: string
  quote: string
  photo_url?: string
}

export interface PricingTier {
  name: string        // e.g., "Keynote", "Half-Day Workshop"
  duration: string    // e.g., "45-60 min", "4 hours"
  price: string       // e.g., "$10,000 - $15,000"
  description?: string // optional additional details
}

export interface Workshop {
  id: number
  title: string
  slug: string
  speaker_id: number | null
  description: string | null
  short_description: string | null
  duration_minutes: number | null
  format: string | null
  max_participants: number | null
  price_range: string | null
  learning_objectives: string[] | null
  target_audience: string | null
  prerequisites: string | null
  technical_experience_needed: string | null
  materials_included: string[] | null
  agenda: string | null
  key_takeaways: string[] | null
  topics: string[] | null
  thumbnail_url: string | null
  thumbnail_position: string | null  // CSS object-position value (e.g., "center", "top", "bottom")
  video_urls: string[] | null
  image_urls: string[] | null
  customizable: boolean
  custom_options: string | null
  meta_title: string | null
  meta_description: string | null
  keywords: string[] | null
  active: boolean
  featured: boolean
  popularity_score: number
  category: string | null
  display_order: number
  badge_text: string | null
  roi_stats: Record<string, string> | null
  testimonials: Testimonial[] | null
  client_logos: string[] | null
  pricing_tiers: PricingTier[] | null
  created_at: string
  updated_at: string
}

export interface WorkshopWithSpeaker extends Workshop {
  speaker_name?: string
  speaker_slug?: string
  speaker_headshot?: string
  speaker_location?: string
  speaker_one_liner?: string
  speaker_bio?: string
}

export interface CreateWorkshopInput {
  title: string
  slug: string
  speaker_id?: number | null
  description?: string
  short_description?: string
  duration_minutes?: number
  format?: string
  max_participants?: number
  price_range?: string
  learning_objectives?: string[]
  target_audience?: string
  prerequisites?: string
  technical_experience_needed?: string
  materials_included?: string[]
  agenda?: string
  key_takeaways?: string[]
  topics?: string[]
  thumbnail_url?: string
  thumbnail_position?: string
  video_urls?: string[]
  image_urls?: string[]
  customizable?: boolean
  custom_options?: string
  meta_title?: string
  meta_description?: string
  keywords?: string[]
  active?: boolean
  featured?: boolean
  popularity_score?: number
  category?: string | null
  display_order?: number
  badge_text?: string | null
  roi_stats?: Record<string, string> | null
  testimonials?: Testimonial[] | null
  client_logos?: string[] | null
  pricing_tiers?: PricingTier[] | null
}

export type UpdateWorkshopInput = Partial<CreateWorkshopInput>

/**
 * Get all workshops
 */
export async function getAllWorkshops(): Promise<WorkshopWithSpeaker[]> {
  try {
    const workshops = await sql`
      SELECT
        w.*,
        s.name as speaker_name,
        s.slug as speaker_slug,
        s.headshot_url as speaker_headshot,
        s.location as speaker_location
      FROM workshops w
      LEFT JOIN speakers s ON w.speaker_id = s.id
      ORDER BY w.featured DESC, w.popularity_score DESC, w.created_at DESC
    `
    return workshops as WorkshopWithSpeaker[]
  } catch (error) {
    console.error("Error fetching all workshops:", error)
    throw error
  }
}

/**
 * Get active workshops only
 */
export async function getActiveWorkshops(): Promise<WorkshopWithSpeaker[]> {
  try {
    const workshops = await sql`
      SELECT
        w.*,
        s.name as speaker_name,
        s.slug as speaker_slug,
        s.headshot_url as speaker_headshot,
        s.location as speaker_location
      FROM workshops w
      LEFT JOIN speakers s ON w.speaker_id = s.id
      WHERE w.active = true
      ORDER BY w.featured DESC, w.popularity_score DESC, w.created_at DESC
    `
    return workshops as WorkshopWithSpeaker[]
  } catch (error) {
    console.error("Error fetching active workshops:", error)
    throw error
  }
}

/**
 * Get workshop by ID
 */
export async function getWorkshopById(id: number): Promise<WorkshopWithSpeaker | null> {
  try {
    const workshops = await sql`
      SELECT
        w.*,
        s.name as speaker_name,
        s.slug as speaker_slug,
        s.headshot_url as speaker_headshot,
        s.location as speaker_location,
        s.bio as speaker_bio,
        s.one_liner as speaker_one_liner
      FROM workshops w
      LEFT JOIN speakers s ON w.speaker_id = s.id
      WHERE w.id = ${id}
    `
    return workshops[0] as WorkshopWithSpeaker || null
  } catch (error) {
    console.error("Error fetching workshop by ID:", error)
    throw error
  }
}

/**
 * Get workshop by slug
 */
export async function getWorkshopBySlug(slug: string): Promise<WorkshopWithSpeaker | null> {
  try {
    const workshops = await sql`
      SELECT
        w.*,
        s.name as speaker_name,
        s.slug as speaker_slug,
        s.headshot_url as speaker_headshot,
        s.location as speaker_location,
        s.bio as speaker_bio,
        s.one_liner as speaker_one_liner
      FROM workshops w
      LEFT JOIN speakers s ON w.speaker_id = s.id
      WHERE w.slug = ${slug}
    `
    return workshops[0] as WorkshopWithSpeaker || null
  } catch (error) {
    console.error("Error fetching workshop by slug:", error)
    throw error
  }
}

/**
 * Get workshops by speaker ID
 */
export async function getWorkshopsBySpeaker(speakerId: number): Promise<Workshop[]> {
  try {
    const workshops = await sql`
      SELECT * FROM workshops
      WHERE speaker_id = ${speakerId} AND active = true
      ORDER BY display_order ASC, category ASC, featured DESC, popularity_score DESC
    `
    return workshops as Workshop[]
  } catch (error) {
    console.error("Error fetching workshops by speaker:", error)
    throw error
  }
}

/**
 * Get workshops by speaker with category grouping
 */
export async function getWorkshopsBySpeakerGrouped(speakerId: number): Promise<Record<string, Workshop[]>> {
  try {
    const workshops = await sql`
      SELECT * FROM workshops
      WHERE speaker_id = ${speakerId} AND active = true
      ORDER BY display_order ASC, featured DESC
    `

    // Group by category
    const grouped: Record<string, Workshop[]> = {}
    for (const workshop of workshops as Workshop[]) {
      const category = workshop.category || 'Other Workshops'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(workshop)
    }

    return grouped
  } catch (error) {
    console.error("Error fetching grouped workshops by speaker:", error)
    throw error
  }
}

/**
 * Search workshops
 */
export async function searchWorkshops(query: string): Promise<WorkshopWithSpeaker[]> {
  try {
    const searchTerm = `%${query}%`
    const workshops = await sql`
      SELECT
        w.*,
        s.name as speaker_name,
        s.slug as speaker_slug,
        s.headshot_url as speaker_headshot,
        s.location as speaker_location
      FROM workshops w
      LEFT JOIN speakers s ON w.speaker_id = s.id
      WHERE w.active = true
        AND (
          w.title ILIKE ${searchTerm}
          OR w.description ILIKE ${searchTerm}
          OR w.short_description ILIKE ${searchTerm}
          OR w.target_audience ILIKE ${searchTerm}
          OR EXISTS (SELECT 1 FROM unnest(w.topics) topic WHERE topic ILIKE ${searchTerm})
          OR EXISTS (SELECT 1 FROM unnest(w.keywords) keyword WHERE keyword ILIKE ${searchTerm})
        )
      ORDER BY w.featured DESC, w.popularity_score DESC
    `
    return workshops as WorkshopWithSpeaker[]
  } catch (error) {
    console.error("Error searching workshops:", error)
    throw error
  }
}

/**
 * Create a new workshop
 */
export async function createWorkshop(input: CreateWorkshopInput): Promise<Workshop> {
  try {
    const workshops = await sql`
      INSERT INTO workshops (
        title, slug, speaker_id, description, short_description,
        duration_minutes, format, max_participants, price_range,
        learning_objectives, target_audience, prerequisites, technical_experience_needed,
        materials_included, agenda, key_takeaways, topics,
        thumbnail_url, thumbnail_position, video_urls, image_urls,
        customizable, custom_options,
        meta_title, meta_description, keywords,
        active, featured, popularity_score,
        category, display_order, badge_text, roi_stats,
        testimonials, client_logos, pricing_tiers
      ) VALUES (
        ${input.title},
        ${input.slug},
        ${input.speaker_id ?? null},
        ${input.description ?? null},
        ${input.short_description ?? null},
        ${input.duration_minutes ?? null},
        ${input.format ?? null},
        ${input.max_participants ?? null},
        ${input.price_range ?? null},
        ${input.learning_objectives ?? null},
        ${input.target_audience ?? null},
        ${input.prerequisites ?? null},
        ${input.technical_experience_needed ?? null},
        ${input.materials_included ?? null},
        ${input.agenda ?? null},
        ${input.key_takeaways ?? null},
        ${input.topics ?? null},
        ${input.thumbnail_url ?? null},
        ${input.thumbnail_position ?? 'center'},
        ${input.video_urls ?? null},
        ${input.image_urls ?? null},
        ${input.customizable ?? true},
        ${input.custom_options ?? null},
        ${input.meta_title ?? null},
        ${input.meta_description ?? null},
        ${input.keywords ?? null},
        ${input.active ?? true},
        ${input.featured ?? false},
        ${input.popularity_score ?? 0},
        ${input.category ?? null},
        ${input.display_order ?? 0},
        ${input.badge_text ?? null},
        ${input.roi_stats ?? null},
        ${JSON.stringify(input.testimonials ?? [])},
        ${input.client_logos ?? null},
        ${JSON.stringify(input.pricing_tiers ?? [])}
      )
      RETURNING *
    `
    return workshops[0] as Workshop
  } catch (error) {
    console.error("Error creating workshop:", error)
    throw error
  }
}

/**
 * Update a workshop
 */
export async function updateWorkshop(id: number, input: UpdateWorkshopInput): Promise<Workshop | null> {
  try {
    if (Object.keys(input).length === 0) {
      // No updates to perform
      return getWorkshopById(id) as Promise<Workshop | null>
    }

    // Use tagged template literal with explicit field updates
    const workshops = await sql`
      UPDATE workshops
      SET
        title = COALESCE(${input.title ?? null}, title),
        slug = COALESCE(${input.slug ?? null}, slug),
        speaker_id = ${input.speaker_id !== undefined ? input.speaker_id : sql`speaker_id`},
        description = ${input.description !== undefined ? input.description : sql`description`},
        short_description = ${input.short_description !== undefined ? input.short_description : sql`short_description`},
        duration_minutes = ${input.duration_minutes !== undefined ? input.duration_minutes : sql`duration_minutes`},
        format = ${input.format !== undefined ? input.format : sql`format`},
        max_participants = ${input.max_participants !== undefined ? input.max_participants : sql`max_participants`},
        price_range = ${input.price_range !== undefined ? input.price_range : sql`price_range`},
        learning_objectives = ${input.learning_objectives !== undefined ? input.learning_objectives : sql`learning_objectives`},
        target_audience = ${input.target_audience !== undefined ? input.target_audience : sql`target_audience`},
        prerequisites = ${input.prerequisites !== undefined ? input.prerequisites : sql`prerequisites`},
        technical_experience_needed = ${input.technical_experience_needed !== undefined ? input.technical_experience_needed : sql`technical_experience_needed`},
        materials_included = ${input.materials_included !== undefined ? input.materials_included : sql`materials_included`},
        agenda = ${input.agenda !== undefined ? input.agenda : sql`agenda`},
        key_takeaways = ${input.key_takeaways !== undefined ? input.key_takeaways : sql`key_takeaways`},
        topics = ${input.topics !== undefined ? input.topics : sql`topics`},
        thumbnail_url = ${input.thumbnail_url !== undefined ? input.thumbnail_url : sql`thumbnail_url`},
        thumbnail_position = ${input.thumbnail_position !== undefined ? input.thumbnail_position : sql`thumbnail_position`},
        video_urls = ${input.video_urls !== undefined ? input.video_urls : sql`video_urls`},
        image_urls = ${input.image_urls !== undefined ? input.image_urls : sql`image_urls`},
        customizable = ${input.customizable !== undefined ? input.customizable : sql`customizable`},
        custom_options = ${input.custom_options !== undefined ? input.custom_options : sql`custom_options`},
        meta_title = ${input.meta_title !== undefined ? input.meta_title : sql`meta_title`},
        meta_description = ${input.meta_description !== undefined ? input.meta_description : sql`meta_description`},
        keywords = ${input.keywords !== undefined ? input.keywords : sql`keywords`},
        active = ${input.active !== undefined ? input.active : sql`active`},
        featured = ${input.featured !== undefined ? input.featured : sql`featured`},
        popularity_score = ${input.popularity_score !== undefined ? input.popularity_score : sql`popularity_score`},
        category = ${input.category !== undefined ? input.category : sql`category`},
        display_order = ${input.display_order !== undefined ? input.display_order : sql`display_order`},
        badge_text = ${input.badge_text !== undefined ? input.badge_text : sql`badge_text`},
        roi_stats = ${input.roi_stats !== undefined ? input.roi_stats : sql`roi_stats`},
        testimonials = ${input.testimonials !== undefined ? JSON.stringify(input.testimonials) : sql`testimonials`},
        client_logos = ${input.client_logos !== undefined ? input.client_logos : sql`client_logos`},
        pricing_tiers = ${input.pricing_tiers !== undefined ? JSON.stringify(input.pricing_tiers) : sql`pricing_tiers`},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    return workshops.length > 0 ? (workshops[0] as Workshop) : null
  } catch (error) {
    console.error("Error updating workshop:", error)
    throw error
  }
}

/**
 * Delete a workshop
 */
export async function deleteWorkshop(id: number): Promise<boolean> {
  try {
    await sql`DELETE FROM workshops WHERE id = ${id}`
    return true
  } catch (error) {
    console.error("Error deleting workshop:", error)
    return false
  }
}

/**
 * Get featured workshops
 */
export async function getFeaturedWorkshops(limit: number = 6): Promise<WorkshopWithSpeaker[]> {
  try {
    const workshops = await sql`
      SELECT
        w.*,
        s.name as speaker_name,
        s.slug as speaker_slug,
        s.headshot_url as speaker_headshot,
        s.location as speaker_location
      FROM workshops w
      LEFT JOIN speakers s ON w.speaker_id = s.id
      WHERE w.active = true AND w.featured = true
      ORDER BY w.popularity_score DESC
      LIMIT ${limit}
    `
    return workshops as WorkshopWithSpeaker[]
  } catch (error) {
    console.error("Error fetching featured workshops:", error)
    throw error
  }
}

/**
 * Increment workshop popularity score
 */
export async function incrementWorkshopPopularity(id: number): Promise<void> {
  try {
    await sql`
      UPDATE workshops
      SET popularity_score = popularity_score + 1
      WHERE id = ${id}
    `
  } catch (error) {
    console.error("Error incrementing workshop popularity:", error)
  }
}

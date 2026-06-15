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
      console.log("Blog Queue DB: Database connection initialized successfully")
    } catch (error) {
      console.error("Failed to initialize Neon client for blog queue:", error)
      throw error
    }
  }
  return sql
}

// ============ TYPES ============

export type QueueStatus = 'queued' | 'processing' | 'drafted' | 'created' | 'error' | 'archived'

export type BlogCategory = 'AI Speakers' | 'Event Planning' | 'Industry Insights' | 'Speaker Spotlight' | 'Company News'

export interface BlogQueueItem {
  id: number
  status: QueueStatus

  // Content fields
  brief: string
  title?: string
  slug?: string
  excerpt?: string
  meta_description?: string
  body_path?: string
  body_content?: string

  // Media
  image_prompt?: string
  hero_image_url?: string

  // Categorization
  category?: BlogCategory
  tags?: string[]
  seo_keywords?: string

  // Publishing
  published_date?: string
  display_title?: string
  speakers?: string[]
  author_id?: string

  // Output (after Contentful publish)
  contentful_entry_id?: string
  contentful_entry_url?: string

  // Processing
  last_run?: string
  notes?: string
  error_message?: string

  // Audit
  created_at: string
  updated_at: string
}

export interface BlogSetting {
  id: number
  key: string
  value: string
  description?: string
  updated_at: string
}

export interface QueueStats {
  total: number
  queued: number
  processing: number
  drafted: number
  created: number
  error: number
  archived: number
}

// ============ QUEUE ITEM FUNCTIONS ============

export async function getQueueItems(filters?: {
  status?: QueueStatus
  search?: string
  limit?: number
  offset?: number
}): Promise<BlogQueueItem[]> {
  const db = getSQL()
  try {
    let query = `SELECT * FROM blog_queue WHERE 1=1`
    const params: any[] = []

    if (filters?.status) {
      params.push(filters.status)
      query += ` AND status = $${params.length}`
    }

    if (filters?.search) {
      params.push(`%${filters.search}%`)
      query += ` AND (brief ILIKE $${params.length} OR title ILIKE $${params.length})`
    }

    query += ` ORDER BY created_at DESC`

    if (filters?.limit) {
      params.push(filters.limit)
      query += ` LIMIT $${params.length}`
    }

    if (filters?.offset) {
      params.push(filters.offset)
      query += ` OFFSET $${params.length}`
    }

    const result = await db(query, params)
    return result as BlogQueueItem[]
  } catch (error) {
    console.error("Error fetching queue items:", error)
    throw error
  }
}

export async function getQueueItemById(id: number): Promise<BlogQueueItem | null> {
  const db = getSQL()
  try {
    const result = await db`
      SELECT * FROM blog_queue WHERE id = ${id}
    `
    return result.length > 0 ? result[0] as BlogQueueItem : null
  } catch (error) {
    console.error("Error fetching queue item by ID:", error)
    throw error
  }
}

export async function createQueueItem(item: Partial<BlogQueueItem>): Promise<BlogQueueItem> {
  const db = getSQL()
  try {
    const result = await db`
      INSERT INTO blog_queue (
        status,
        brief,
        title,
        slug,
        excerpt,
        meta_description,
        body_path,
        body_content,
        image_prompt,
        hero_image_url,
        category,
        tags,
        seo_keywords,
        published_date,
        display_title,
        speakers,
        author_id,
        contentful_entry_id,
        contentful_entry_url,
        notes
      ) VALUES (
        ${item.status || 'queued'},
        ${item.brief},
        ${item.title || null},
        ${item.slug || null},
        ${item.excerpt || null},
        ${item.meta_description || null},
        ${item.body_path || null},
        ${item.body_content || null},
        ${item.image_prompt || null},
        ${item.hero_image_url || null},
        ${item.category || null},
        ${item.tags || null},
        ${item.seo_keywords || null},
        ${item.published_date || null},
        ${item.display_title || null},
        ${item.speakers || null},
        ${item.author_id || '1VbdoaPazuvwGFuLwaZR6O'},
        ${item.contentful_entry_id || null},
        ${item.contentful_entry_url || null},
        ${item.notes || null}
      )
      RETURNING *
    `
    return result[0] as BlogQueueItem
  } catch (error) {
    console.error("Error creating queue item:", error)
    throw error
  }
}

export async function updateQueueItem(id: number, updates: Partial<BlogQueueItem>): Promise<BlogQueueItem> {
  const db = getSQL()
  try {
    const current = await getQueueItemById(id)
    if (!current) {
      throw new Error(`Queue item with id ${id} not found`)
    }

    const merged = { ...current, ...updates }

    const result = await db`
      UPDATE blog_queue
      SET
        status = ${merged.status},
        brief = ${merged.brief},
        title = ${merged.title},
        slug = ${merged.slug},
        excerpt = ${merged.excerpt},
        meta_description = ${merged.meta_description},
        body_path = ${merged.body_path},
        body_content = ${merged.body_content},
        image_prompt = ${merged.image_prompt},
        hero_image_url = ${merged.hero_image_url},
        category = ${merged.category},
        tags = ${merged.tags},
        seo_keywords = ${merged.seo_keywords},
        published_date = ${merged.published_date},
        display_title = ${merged.display_title},
        speakers = ${merged.speakers},
        author_id = ${merged.author_id},
        contentful_entry_id = ${merged.contentful_entry_id},
        contentful_entry_url = ${merged.contentful_entry_url},
        last_run = ${merged.last_run},
        notes = ${merged.notes},
        error_message = ${merged.error_message},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (!result || result.length === 0) {
      throw new Error(`Failed to update queue item with id ${id}`)
    }

    return result[0] as BlogQueueItem
  } catch (error) {
    console.error("Error updating queue item:", error)
    throw error
  }
}

export async function deleteQueueItem(id: number): Promise<boolean> {
  const db = getSQL()
  try {
    await db`DELETE FROM blog_queue WHERE id = ${id}`
    return true
  } catch (error) {
    console.error("Error deleting queue item:", error)
    throw error
  }
}

export async function bulkUpdateStatus(ids: number[], status: QueueStatus): Promise<number> {
  const db = getSQL()
  try {
    const result = await db`
      UPDATE blog_queue
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ANY(${ids})
    `
    return result.count || ids.length
  } catch (error) {
    console.error("Error bulk updating status:", error)
    throw error
  }
}

export async function bulkDeleteItems(ids: number[]): Promise<number> {
  const db = getSQL()
  try {
    const result = await db`
      DELETE FROM blog_queue WHERE id = ANY(${ids})
    `
    return result.count || ids.length
  } catch (error) {
    console.error("Error bulk deleting items:", error)
    throw error
  }
}

export async function getQueueStats(): Promise<QueueStats> {
  const db = getSQL()
  try {
    const result = await db`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'queued') as queued,
        COUNT(*) FILTER (WHERE status = 'processing') as processing,
        COUNT(*) FILTER (WHERE status = 'drafted') as drafted,
        COUNT(*) FILTER (WHERE status = 'created') as created,
        COUNT(*) FILTER (WHERE status = 'error') as error,
        COUNT(*) FILTER (WHERE status = 'archived') as archived
      FROM blog_queue
    `
    return {
      total: parseInt(result[0].total) || 0,
      queued: parseInt(result[0].queued) || 0,
      processing: parseInt(result[0].processing) || 0,
      drafted: parseInt(result[0].drafted) || 0,
      created: parseInt(result[0].created) || 0,
      error: parseInt(result[0].error) || 0,
      archived: parseInt(result[0].archived) || 0
    }
  } catch (error) {
    console.error("Error fetching queue stats:", error)
    throw error
  }
}

// ============ PIPELINE API FUNCTIONS ============

export async function getQueuedItems(): Promise<BlogQueueItem[]> {
  const db = getSQL()
  try {
    const result = await db`
      SELECT * FROM blog_queue
      WHERE status = 'queued'
      ORDER BY created_at ASC
    `
    return result as BlogQueueItem[]
  } catch (error) {
    console.error("Error fetching queued items:", error)
    throw error
  }
}

export async function getExistingBriefs(limit: number = 30): Promise<string[]> {
  const db = getSQL()
  try {
    const result = await db`
      SELECT brief FROM blog_queue
      WHERE brief IS NOT NULL AND brief != ''
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return result.map((r: any) => r.brief)
  } catch (error) {
    console.error("Error fetching existing briefs:", error)
    throw error
  }
}

export async function createBriefs(briefs: string[]): Promise<BlogQueueItem[]> {
  const db = getSQL()
  try {
    const created: BlogQueueItem[] = []
    for (const brief of briefs) {
      const result = await db`
        INSERT INTO blog_queue (status, brief)
        VALUES ('queued', ${brief})
        RETURNING *
      `
      created.push(result[0] as BlogQueueItem)
    }
    return created
  } catch (error) {
    console.error("Error creating briefs:", error)
    throw error
  }
}

// ============ SETTINGS FUNCTIONS ============

export async function getSettings(): Promise<BlogSetting[]> {
  const db = getSQL()
  try {
    const result = await db`
      SELECT * FROM blog_settings ORDER BY key
    `
    return result as BlogSetting[]
  } catch (error) {
    console.error("Error fetching settings:", error)
    throw error
  }
}

export async function getSetting(key: string): Promise<string | null> {
  const db = getSQL()
  try {
    const result = await db`
      SELECT value FROM blog_settings WHERE key = ${key}
    `
    return result.length > 0 ? result[0].value : null
  } catch (error) {
    console.error("Error fetching setting:", error)
    throw error
  }
}

export async function updateSetting(key: string, value: string): Promise<BlogSetting> {
  const db = getSQL()
  try {
    const result = await db`
      UPDATE blog_settings
      SET value = ${value}, updated_at = CURRENT_TIMESTAMP
      WHERE key = ${key}
      RETURNING *
    `
    if (!result || result.length === 0) {
      // Insert if not exists
      const insertResult = await db`
        INSERT INTO blog_settings (key, value)
        VALUES (${key}, ${value})
        RETURNING *
      `
      return insertResult[0] as BlogSetting
    }
    return result[0] as BlogSetting
  } catch (error) {
    console.error("Error updating setting:", error)
    throw error
  }
}

export async function updateSettings(settings: Record<string, string>): Promise<BlogSetting[]> {
  const updated: BlogSetting[] = []
  for (const [key, value] of Object.entries(settings)) {
    const result = await updateSetting(key, value)
    updated.push(result)
  }
  return updated
}

import { neon } from '@neondatabase/serverless'
import { getFlatDefaults, getDefaultByKey } from './content-defaults'

interface ContentItem {
  id: number
  page: string
  section: string
  content_key: string
  content_value: string
  updated_at: string
}

// Get all defaults as flat key-value pairs from centralized source
const defaults = getFlatDefaults()

// Cache for content to avoid hitting the database on every request
let contentCache: Record<string, string> = {}
let cacheTimestamp: number = 0
const CACHE_TTL = 60 * 1000 // 1 minute cache (short for near-real-time updates)

/**
 * Fetch a single content value
 */
export async function getContent(page: string, section: string, key: string): Promise<string> {
  const fullKey = `${page}.${section}.${key}`

  // Check if cache is still valid
  const now = Date.now()
  if (now - cacheTimestamp < CACHE_TTL && contentCache[fullKey] !== undefined) {
    return contentCache[fullKey]
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const result = await sql`
      SELECT content_value
      FROM website_content
      WHERE page = ${page} AND section = ${section} AND content_key = ${key}
    `

    if (result.length > 0) {
      contentCache[fullKey] = result[0].content_value
      cacheTimestamp = now
      return result[0].content_value
    }
  } catch (error) {
    console.error('Error fetching content:', error)
  }

  // Return default if not found
  return defaults[fullKey] || ''
}

/**
 * Fetch all content for a page (more efficient than multiple single fetches)
 */
export async function getPageContent(page: string): Promise<Record<string, string>> {
  // Check if cache is still valid
  const now = Date.now()
  if (now - cacheTimestamp < CACHE_TTL) {
    const pageContent: Record<string, string> = {}
    for (const [key, value] of Object.entries(contentCache)) {
      if (key.startsWith(`${page}.`)) {
        pageContent[key] = value
      }
    }
    if (Object.keys(pageContent).length > 0) {
      return pageContent
    }
  }

  try {
    const sql = neon(process.env.DATABASE_URL!)
    const result = await sql<ContentItem[]>`
      SELECT page, section, content_key, content_value
      FROM website_content
      WHERE page = ${page}
    `

    const content: Record<string, string> = {}
    for (const item of result) {
      const fullKey = `${item.page}.${item.section}.${item.content_key}`
      content[fullKey] = item.content_value
      contentCache[fullKey] = item.content_value
    }
    cacheTimestamp = now

    // Fill in defaults for missing content
    for (const [key, value] of Object.entries(defaults)) {
      if (key.startsWith(`${page}.`) && !content[key]) {
        content[key] = value
      }
    }

    return content
  } catch (error) {
    console.error('Error fetching page content:', error)

    // Return defaults for this page
    const pageDefaults: Record<string, string> = {}
    for (const [key, value] of Object.entries(defaults)) {
      if (key.startsWith(`${page}.`)) {
        pageDefaults[key] = value
      }
    }
    return pageDefaults
  }
}

/**
 * Clear the content cache (call this after updating content)
 */
export function clearContentCache() {
  contentCache = {}
  cacheTimestamp = 0
}

/**
 * Helper to get content from a pre-fetched content object
 */
export function getFromContent(content: Record<string, string>, page: string, section: string, key: string): string {
  const fullKey = `${page}.${section}.${key}`
  return content[fullKey] || defaults[fullKey] || ''
}

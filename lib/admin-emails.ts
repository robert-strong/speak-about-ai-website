import { neon } from '@neondatabase/serverless'

// Default admin emails if not set in database
const DEFAULT_ADMIN_EMAILS = ['human@speakabout.ai', 'noah@speakabout.ai']

// Cache for admin emails (refreshes every 5 minutes)
let cachedEmails: string[] | null = null
let cacheTimestamp: number = 0
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

/**
 * Get admin email addresses from the database
 * Falls back to default emails if database is unavailable or not configured
 */
export async function getAdminEmails(): Promise<string[]> {
  // Check cache first
  const now = Date.now()
  if (cachedEmails && (now - cacheTimestamp) < CACHE_DURATION) {
    return cachedEmails
  }

  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return DEFAULT_ADMIN_EMAILS
    }

    const sql = neon(databaseUrl)

    const result = await sql`
      SELECT content_value FROM website_content
      WHERE page = 'settings'
        AND section = 'emails'
        AND content_key = 'admin_emails'
      LIMIT 1
    `

    if (result.length > 0 && result[0].content_value) {
      // Parse comma-separated emails
      const emails = result[0].content_value
        .split(',')
        .map((email: string) => email.trim())
        .filter((email: string) => email.length > 0 && email.includes('@'))

      if (emails.length > 0) {
        // Update cache
        cachedEmails = emails
        cacheTimestamp = now
        return emails
      }
    }

    return DEFAULT_ADMIN_EMAILS
  } catch (error) {
    console.error('Error fetching admin emails from database:', error)
    return DEFAULT_ADMIN_EMAILS
  }
}

/**
 * Clear the admin emails cache
 * Call this after updating admin emails in settings
 */
export function clearAdminEmailsCache(): void {
  cachedEmails = null
  cacheTimestamp = 0
}

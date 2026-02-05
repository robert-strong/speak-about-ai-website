import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// Default admin emails if not set in database
const DEFAULT_ADMIN_EMAILS = ['human@speakabout.ai', 'noah@speakabout.ai']

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      // Return defaults if no database
      return NextResponse.json({ emails: DEFAULT_ADMIN_EMAILS })
    }

    const sql = neon(databaseUrl)

    // Try to fetch from database
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
        .filter((email: string) => email.length > 0)

      return NextResponse.json({ emails })
    }

    // Return defaults if not found in database
    return NextResponse.json({ emails: DEFAULT_ADMIN_EMAILS })
  } catch (error) {
    console.error('Error fetching admin emails:', error)
    // Return defaults on error
    return NextResponse.json({ emails: DEFAULT_ADMIN_EMAILS })
  }
}

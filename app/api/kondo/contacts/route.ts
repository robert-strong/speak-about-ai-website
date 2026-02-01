import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const contacts = await sql`
      SELECT
        id,
        kondo_id,
        first_name,
        last_name,
        email,
        linkedin_url,
        linkedin_uid,
        headline,
        location,
        picture_url,
        conversation_status,
        conversation_state,
        latest_message,
        latest_message_at,
        kondo_url,
        kondo_note,
        labels,
        created_at,
        updated_at
      FROM kondo_contacts
      ORDER BY updated_at DESC
      LIMIT 100
    `

    return NextResponse.json({ contacts })
  } catch (error) {
    console.error('Error fetching Kondo contacts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    )
  }
}

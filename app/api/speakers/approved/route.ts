import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not configured')
      return NextResponse.json([])
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // Get all active speakers (since status column might not exist yet)
    const speakers = await sql`
      SELECT 
        id, name, email, bio, short_bio, title, company,
        headshot_url, website, topics, speaking_fee_range,
        active, featured
      FROM speakers
      WHERE active = true
      ORDER BY name ASC
    `
    
    console.log(`Found ${speakers.length} active speakers`)
    
    return NextResponse.json(speakers)
  } catch (error) {
    console.error('Get approved speakers error:', error)
    return NextResponse.json([])
  }
}
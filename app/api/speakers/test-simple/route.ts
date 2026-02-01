import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Test full query
    const speakers = await sql`
      SELECT 
        id, name, email, 
        bio, short_bio, one_liner, headshot_url, website, social_media,
        topics, speaking_fee_range, travel_preferences,
        technical_requirements, dietary_restrictions,
        active, email_verified, featured, location, programs,
        listed, industries, ranking, image_position, image_offset,
        videos, testimonials, created_at, updated_at
      FROM speakers
      WHERE active = true AND name = 'Noah Cheyer'
      LIMIT 1
    `
    
    // Test parsing
    const parsed = speakers.map(speaker => ({
      name: speaker.name,
      programs: typeof speaker.programs === 'string' ? JSON.parse(speaker.programs) : (speaker.programs || [])
    }))
    
    return NextResponse.json({ 
      success: true,
      count: speakers.length,
      raw: speakers,
      parsed
    })
    
  } catch (error) {
    console.error('Test query error:', error)
    return NextResponse.json({ 
      error: 'Failed to query',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    console.log('Debug Murray Newlands: Starting check...')
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'Database URL not configured',
        hasDatabase: false
      }, { status: 500 })
    }
    
    const sql = neon(process.env.DATABASE_URL)
    
    // Test connection
    await sql`SELECT 1 as test`
    console.log('Debug Murray Newlands: Database connected')
    
    // Search for Murray Newlands by name (case-insensitive)
    const speakersByName = await sql`
      SELECT 
        id, name, slug, email, active, listed, featured, ranking,
        created_at, updated_at
      FROM speakers 
      WHERE 
        name ILIKE '%murray%' 
        OR name ILIKE '%newlands%'
        OR slug ILIKE '%murray%'
        OR email ILIKE '%murray%'
      ORDER BY id
    `
    
    console.log(`Found ${speakersByName.length} speakers matching Murray/Newlands`)
    
    // Also check specifically for exact match
    const exactMatch = await sql`
      SELECT 
        id, name, slug, email, active, listed, featured, ranking,
        bio, short_bio, headshot_url, programs, topics, industries,
        created_at, updated_at
      FROM speakers 
      WHERE name = 'Murray Newlands'
      LIMIT 1
    `
    
    // Get total speaker count
    const totalCount = await sql`
      SELECT COUNT(*) as count FROM speakers
    `
    
    // Check if the specific email exists
    const emailCheck = await sql`
      SELECT id, name, email, slug 
      FROM speakers 
      WHERE email = 'murray-newlands-speaker-64@speakaboutai.com'
    `
    
    // Get all speakers to see if Murray is there with a different format
    const allSpeakersPreview = await sql`
      SELECT id, name, slug, email 
      FROM speakers 
      ORDER BY name 
      LIMIT 100
    `
    
    return NextResponse.json({
      success: true,
      results: {
        searchResults: speakersByName,
        exactMatch: exactMatch.length > 0 ? exactMatch[0] : null,
        emailCheck: emailCheck.length > 0 ? emailCheck[0] : null,
        totalSpeakers: totalCount[0].count,
        speakersPreview: allSpeakersPreview.map(s => ({
          id: s.id,
          name: s.name,
          slug: s.slug,
          email: s.email
        })),
        analysis: {
          murrayFound: speakersByName.length > 0,
          exactMatchFound: exactMatch.length > 0,
          emailExists: emailCheck.length > 0,
          possibleIssues: []
        }
      }
    })
    
  } catch (error) {
    console.error('Debug Murray Newlands error:', error)
    return NextResponse.json({
      error: 'Failed to check Murray Newlands',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
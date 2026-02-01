import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { getAllSpeakers } from '@/lib/speakers-data'

// Get SQL client for each request to avoid connection issues
const getSqlClient = () => {
  if (!process.env.DATABASE_URL) {
    console.log('Admin speakers: No DATABASE_URL found')
    return null
  }
  try {
    return neon(process.env.DATABASE_URL)
  } catch (error) {
    console.error('Failed to initialize Neon client for admin speakers:', error)
    return null
  }
}

export async function POST(request: NextRequest) {
  let sql: ReturnType<typeof getSqlClient> = null
  
  try {
    // Authentication check
    const authError = requireAdminAuth(request)
    if (authError) {
      return authError
    }
    
    // Get SQL client
    sql = getSqlClient()
    
    if (!sql) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed'
      }, { status: 500 })
    }
    
    // Parse request body
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.email) {
      return NextResponse.json({
        success: false,
        error: 'Name and email are required'
      }, { status: 400 })
    }
    
    // Insert new speaker
    const result = await sql`
      INSERT INTO speakers (
        name, email, bio, short_bio, one_liner, headshot_url, website,
        location, programs, topics, industries, videos, testimonials,
        speaking_fee_range, travel_preferences, technical_requirements,
        dietary_restrictions, featured, active, listed, ranking, title, slug,
        social_media
      ) VALUES (
        ${body.name},
        ${body.email},
        ${body.bio || ''},
        ${body.short_bio || ''},
        ${body.one_liner || ''},
        ${body.headshot_url || ''},
        ${body.website || ''},
        ${body.location || ''},
        ${body.programs || ''},
        ${JSON.stringify(body.topics || [])},
        ${JSON.stringify(body.industries || [])},
        ${JSON.stringify(body.videos || [])},
        ${JSON.stringify(body.testimonials || [])},
        ${body.speaking_fee_range || ''},
        ${body.travel_preferences || ''},
        ${body.technical_requirements || ''},
        ${body.dietary_restrictions || ''},
        ${body.featured || false},
        ${body.active !== false},
        ${body.listed !== false},
        ${body.ranking || 0},
        ${body.title || ''},
        ${body.slug || body.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')},
        ${JSON.stringify(body.social_media || {})}
      )
      RETURNING *
    `
    
    console.log('Admin speakers: Created new speaker:', result[0])
    
    return NextResponse.json({
      success: true,
      speaker: result[0]
    })
    
  } catch (error) {
    console.error('Create speaker error:', error)
    
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json({
        error: 'A speaker with this email already exists'
      }, { status: 400 })
    }
    
    return NextResponse.json({
      error: 'Failed to create speaker',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  let sql: ReturnType<typeof getSqlClient> = null
  
  try {
    // Authentication check
    const authError = requireAdminAuth(request)
    if (authError) {
      // Authentication failed
      return authError
    }
    
    // Get SQL client
    sql = getSqlClient()
    
    // Database connection checked
    
    // Check if database is available
    if (!sql) {
      // Database not available, using fallback data
      
      // Use the static speaker data as fallback
      const fallbackSpeakers = await getAllSpeakers()
      
      // Transform the data to match the expected format from database
      const speakers = fallbackSpeakers.map((speaker, index) => ({
        id: index + 1,
        name: speaker.name || 'Unknown Speaker',
        email: speaker.email || `${(speaker.name || 'speaker').toLowerCase().replace(/\s+/g, '.')}@example.com`,
        bio: speaker.bio || '',
        short_bio: speaker.bio ? speaker.bio.substring(0, 200) : '',
        one_liner: speaker.title || '',
        headshot_url: speaker.image || '',
        website: speaker.website || '',
        location: speaker.location || '',
        topics: Array.isArray(speaker.topics) ? speaker.topics : [],
        industries: Array.isArray(speaker.industries) ? speaker.industries : [],
        videos: Array.isArray(speaker.videos) ? speaker.videos : [],
        testimonials: Array.isArray(speaker.testimonials) ? speaker.testimonials : [],
        speaking_fee_range: speaker.feeRange || speaker.fee || '',
        featured: speaker.featured || false,
        active: speaker.listed !== false,
        listed: speaker.listed !== false,
        ranking: speaker.ranking || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Add missing fields with defaults
        title: speaker.title || '',
        slug: speaker.slug || '',
        email_verified: false,
        image_position: null,
        image_offset: null,
        social_media: null,
        programs: '',
        travel_preferences: '',
        technical_requirements: '',
        dietary_restrictions: ''
      }))
      
      console.log(`Admin speakers: Returning ${speakers.length} speakers from fallback data`)
      
      return NextResponse.json({
        success: true,
        speakers: speakers,
        source: 'fallback'
      })
    }
    
    // Test basic connection first
    console.log('Admin speakers: Testing database connection...')
    try {
      await sql`SELECT 1 as test`
      console.log('Admin speakers: Database connection successful')
    } catch (connError) {
      console.error('Admin speakers: Database connection failed:', connError)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connError instanceof Error ? connError.message : 'Unknown connection error'
      }, { status: 500 })
    }
    
    // Get all speakers with only existing columns
    console.log('Admin speakers: Querying speakers table...')
    const speakers = await sql`
      SELECT 
        id, name, email, bio, short_bio, one_liner, headshot_url, website,
        location, programs, topics, industries, videos, testimonials,
        speaking_fee_range, travel_preferences, technical_requirements, 
        dietary_restrictions, featured, active, listed, ranking,
        created_at, updated_at, title, slug, email_verified,
        image_position, image_offset, social_media
      FROM speakers
      ORDER BY 
        CASE WHEN featured = true THEN 0 ELSE 1 END,
        ranking DESC NULLS LAST,
        name ASC
    `
    
    console.log(`Admin speakers: Found ${speakers.length} speakers`)

    return NextResponse.json({
      success: true,
      speakers: speakers
    })

  } catch (error) {
    console.error('Get admin speakers error:', error)
    
    // Provide detailed error information
    let errorMessage = 'Failed to fetch speakers'
    let errorDetails = 'Unknown error'
    
    if (error instanceof Error) {
      errorMessage = error.message
      errorDetails = error.stack || error.message
      
      // Check for specific error types
      if (error.message.includes('relation "speakers" does not exist')) {
        errorMessage = 'Speakers table not found in database'
        errorDetails = 'The speakers table may not exist. Please check your database schema.'
      } else if (error.message.includes('permission denied')) {
        errorMessage = 'Database permission denied'
        errorDetails = 'The database connection may not have proper permissions.'
      } else if (error.message.includes('connect')) {
        errorMessage = 'Database connection failed'
        errorDetails = 'Unable to connect to the database. Check DATABASE_URL and network.'
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        hasDatabase: !!process.env.DATABASE_URL,
        hasSqlClient: !!sql
      },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { revalidatePath } from 'next/cache'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { getAllSpeakers } from '@/lib/speakers-data'

// Get SQL client for each request to avoid connection issues
const getSqlClient = () => {
  if (!process.env.DATABASE_URL) {
    console.log('Admin speaker detail: No DATABASE_URL found')
    return null
  }
  try {
    return neon(process.env.DATABASE_URL)
  } catch (error) {
    console.error('Failed to initialize Neon client for admin speaker detail:', error)
    return null
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    // Await params as required in Next.js 15
    const params = await context.params
    
    // Check authentication - allows dev bypass with x-dev-admin-bypass header
    const authError = requireAdminAuth(request)
    if (authError) {
      console.log('Admin speaker delete: Authentication failed')
      return authError
    }
    
    const speakerId = parseInt(params.id)
    if (isNaN(speakerId)) {
      return NextResponse.json({
        error: 'Invalid speaker ID'
      }, { status: 400 })
    }
    
    console.log(`Admin speaker delete: Deleting speaker ${speakerId}`)
    
    // Get SQL client
    const sql = getSqlClient()
    
    // Check if database is available
    if (!sql) {
      return NextResponse.json({
        error: 'Database not available'
      }, { status: 503 })
    }
    
    try {
      // Check if speaker exists
      const existingResult = await sql`
        SELECT id, name FROM speakers WHERE id = ${speakerId}
      `
      
      if (!existingResult || existingResult.length === 0) {
        return NextResponse.json({
          error: 'Speaker not found'
        }, { status: 404 })
      }
      
      const speakerName = existingResult[0].name
      
      // Delete the speaker
      await sql`
        DELETE FROM speakers WHERE id = ${speakerId}
      `
      
      console.log(`Admin speaker delete: Successfully deleted speaker ${speakerId} (${speakerName})`)
      
      return NextResponse.json({
        success: true,
        message: `Speaker ${speakerName} deleted successfully`,
        deletedId: speakerId
      })
      
    } catch (dbError: any) {
      console.error('Database error deleting speaker:', dbError)
      return NextResponse.json({
        error: 'Failed to delete speaker',
        details: dbError.message || 'Unknown database error'
      }, { status: 500 })
    }
    
  } catch (error: any) {
    console.error('Error deleting speaker:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  console.log('GET /api/admin/speakers/[id] - Starting request')
  try {
    // Await params as required in Next.js 15
    const params = await context.params
    console.log('GET /api/admin/speakers/[id] - Raw params.id:', params.id, 'Type:', typeof params.id)

    // Check authentication - allows dev bypass with x-dev-admin-bypass header
    const authError = requireAdminAuth(request)
    if (authError) {
      console.log('Admin speaker detail: Authentication failed')
      return authError
    }

    const speakerId = parseInt(params.id)
    console.log('GET /api/admin/speakers/[id] - Parsed speakerId:', speakerId, 'isNaN:', isNaN(speakerId))

    if (isNaN(speakerId)) {
      return NextResponse.json({
        error: 'Invalid speaker ID',
        receivedId: params.id
      }, { status: 400 })
    }

    console.log(`Admin speaker detail: Fetching speaker ${speakerId}`)
    // Get SQL client
    const sql = getSqlClient()
    
    console.log('Admin speaker detail: DATABASE_URL available:', !!process.env.DATABASE_URL)
    console.log('Admin speaker detail: sql client initialized:', !!sql)
    
    // Check if database is available
    if (!sql) {
      console.log('Admin speaker detail: Database not available, using fallback data')
      
      // Use fallback data from getAllSpeakers
      const allSpeakers = await getAllSpeakers()
      const speaker = allSpeakers.find((s, index) => (index + 1) === speakerId)
      
      if (!speaker) {
        console.log(`Admin speaker detail: Speaker ${speakerId} not found in fallback data`)
        return NextResponse.json({
          error: 'Speaker not found'
        }, { status: 404 })
      }
      
      // Transform to match database format
      const transformedSpeaker = {
        id: speakerId,
        name: speaker.name,
        email: `${speaker.name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
        bio: speaker.bio || '',
        short_bio: speaker.bio ? speaker.bio.substring(0, 200) : '',
        one_liner: speaker.title || '',
        headshot_url: speaker.image || '',
        website: speaker.website || '',
        location: speaker.location || '',
        programs: speaker.programs || [],
        topics: speaker.topics || [],
        industries: speaker.industries || [],
        videos: speaker.videos || [],
        testimonials: speaker.testimonials || [],
        speaking_fee_range: speaker.feeRange || speaker.fee || '',
        travel_preferences: '',
        technical_requirements: '',
        dietary_restrictions: '',
        featured: speaker.featured || false,
        active: speaker.listed !== false,
        listed: speaker.listed !== false,
        ranking: speaker.ranking || 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log(`Admin speaker detail: Returning fallback data for ${speaker.name}`)
      
      return NextResponse.json({
        success: true,
        speaker: transformedSpeaker
      })
    }
    
    // Test basic connection first
    console.log('Admin speaker detail: Testing database connection...')
    try {
      await sql`SELECT 1 as test`
      console.log('Admin speaker detail: Database connection successful')
    } catch (connError) {
      console.error('Admin speaker detail: Database connection failed:', connError)
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connError instanceof Error ? connError.message : 'Unknown connection error'
      }, { status: 500 })
    }

    // Get speaker data
    console.log(`Admin speaker detail: Querying speaker ${speakerId}...`)
    const speakers = await sql`
      SELECT
        id, name, email, slug,
        bio, short_bio, one_liner, headshot_url, website,
        location, programs, topics, industries, videos, testimonials,
        speaking_fee_range, travel_preferences, technical_requirements,
        dietary_restrictions, featured, active, listed, ranking,
        created_at, updated_at, email_verified,
        image_position, image_offset, social_media
      FROM speakers
      WHERE id = ${speakerId}
      LIMIT 1
    `

    if (speakers.length === 0) {
      console.log(`Admin speaker detail: Speaker ${speakerId} not found`)
      return NextResponse.json({
        error: 'Speaker not found'
      }, { status: 404 })
    }

    const speaker = speakers[0]
    console.log(`Admin speaker detail: Found speaker ${speaker.name}`)

    // Ensure arrays are properly parsed with error handling
    const parseFieldAsArray = (field: any, fieldName: string): any[] => {
      if (!field) return []
      if (Array.isArray(field)) return field
      if (typeof field === 'string') {
        try {
          // Try to parse as JSON
          const parsed = JSON.parse(field)
          return Array.isArray(parsed) ? parsed : []
        } catch (e) {
          // If it's not valid JSON, treat it as a single string item
          console.log(`Admin speaker detail: Field ${fieldName} is not valid JSON, treating as string: ${field.substring(0, 50)}...`)
          return fieldName === 'programs' ? [field] : []
        }
      }
      return []
    }
    
    speaker.programs = parseFieldAsArray(speaker.programs, 'programs')
    speaker.topics = parseFieldAsArray(speaker.topics, 'topics')
    speaker.industries = parseFieldAsArray(speaker.industries, 'industries')
    speaker.videos = parseFieldAsArray(speaker.videos, 'videos')
    speaker.testimonials = parseFieldAsArray(speaker.testimonials, 'testimonials')

    // Parse social media links from social_media JSONB field
    const socialMedia = speaker.social_media || {}
    speaker.linkedin_url = socialMedia.linkedin_url || ''
    speaker.twitter_url = socialMedia.twitter_url || ''
    speaker.youtube_url = socialMedia.youtube_url || ''
    speaker.instagram_url = socialMedia.instagram_url || ''

    return NextResponse.json({
      success: true,
      speaker: speaker
    })

  } catch (error) {
    console.error('Get admin speaker detail error:', error)
    
    // Provide detailed error information
    let errorMessage = 'Failed to fetch speaker'
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
        hasDatabase: !!process.env.DATABASE_URL
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    console.log('PUT /api/admin/speakers/[id] - Starting request')
    
    // Await params as required in Next.js 15
    const params = await context.params
    console.log(`Speaker ID: ${params.id}`)
    
    // Log headers for debugging
    console.log('Headers received:', {
      authorization: request.headers.get('authorization') ? 'Present' : 'Missing',
      'x-dev-admin-bypass': request.headers.get('x-dev-admin-bypass'),
      'content-type': request.headers.get('content-type'),
    })
    
    // Check authentication - allows dev bypass with x-dev-admin-bypass header
    const authError = requireAdminAuth(request)
    if (authError) {
      console.log('Admin speaker update: Authentication failed', authError)
      return authError
    }
    console.log('Authentication passed')
    
    const speakerId = params.id
    const updateData = await request.json()
    console.log('Update data received, fields:', Object.keys(updateData))
    
    // Validate and truncate fields to match database constraints
    if (updateData.short_bio && updateData.short_bio.length > 500) {
      updateData.short_bio = updateData.short_bio.substring(0, 497) + '...'
    }
    if (updateData.title && updateData.title.length > 255) {
      updateData.title = updateData.title.substring(0, 255)
    }
    if (updateData.one_liner && updateData.one_liner.length > 255) {
      updateData.one_liner = updateData.one_liner.substring(0, 255)
    }
    
    // Get SQL client
    const sql = getSqlClient()
    
    if (!sql) {
      console.error('Database client not available - check DATABASE_URL')
      return NextResponse.json({
        error: 'Database not available',
        details: 'Unable to connect to database'
      }, { status: 503 })
    }
    console.log('Database client obtained')

    // Prepare social_media JSONB from individual social fields
    const currentSpeakerData = await sql`SELECT social_media FROM speakers WHERE id = ${parseInt(speakerId)}`
    const currentSocialMedia = currentSpeakerData[0]?.social_media || {}
    const socialMedia = {
      linkedin_url: updateData.linkedin_url !== undefined ? updateData.linkedin_url : currentSocialMedia.linkedin_url,
      twitter_url: updateData.twitter_url !== undefined ? updateData.twitter_url : currentSocialMedia.twitter_url,
      youtube_url: updateData.youtube_url !== undefined ? updateData.youtube_url : currentSocialMedia.youtube_url,
      instagram_url: updateData.instagram_url !== undefined ? updateData.instagram_url : currentSocialMedia.instagram_url
    }

    // Update speaker profile with all fields
    console.log(`Attempting to update speaker ${speakerId} in database`)
    const [updatedSpeaker] = await sql`
      UPDATE speakers SET
        name = COALESCE(${updateData.name || null}, name),
        email = COALESCE(${updateData.email || null}, email),
        slug = COALESCE(${updateData.slug || null}, slug),
        bio = COALESCE(${updateData.bio || null}, bio),
        short_bio = COALESCE(${updateData.short_bio || null}, short_bio),
        one_liner = COALESCE(${updateData.one_liner || null}, one_liner),
        headshot_url = COALESCE(${updateData.headshot_url || null}, headshot_url),
        website = COALESCE(${updateData.website || null}, website),
        location = COALESCE(${updateData.location || null}, location),
        social_media = ${JSON.stringify(socialMedia)},
        programs = COALESCE(${JSON.stringify(updateData.programs) || null}, programs),
        topics = COALESCE(${JSON.stringify(updateData.topics) || null}, topics),
        industries = COALESCE(${JSON.stringify(updateData.industries) || null}, industries),
        videos = COALESCE(${JSON.stringify(updateData.videos) || null}, videos),
        testimonials = COALESCE(${JSON.stringify(updateData.testimonials) || null}, testimonials),
        speaking_fee_range = COALESCE(${updateData.speaking_fee_range || null}, speaking_fee_range),
        travel_preferences = COALESCE(${updateData.travel_preferences || null}, travel_preferences),
        technical_requirements = COALESCE(${updateData.technical_requirements || null}, technical_requirements),
        dietary_restrictions = COALESCE(${updateData.dietary_restrictions || null}, dietary_restrictions),
        featured = COALESCE(${updateData.featured}, featured),
        active = COALESCE(${updateData.active}, active),
        listed = COALESCE(${updateData.listed}, listed),
        ranking = COALESCE(${updateData.ranking || null}, ranking),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${parseInt(speakerId)}
      RETURNING
        id, name, email, slug, bio, short_bio, one_liner,
        headshot_url, website, social_media,
        location, programs, topics, industries, videos, testimonials,
        speaking_fee_range, travel_preferences, technical_requirements,
        dietary_restrictions, featured, active, listed, ranking, created_at, updated_at
    `

    if (!updatedSpeaker) {
      console.error(`No speaker returned from update for ID ${speakerId}`)
      return NextResponse.json(
        { error: 'Speaker not found or update failed' },
        { status: 404 }
      )
    }

    console.log(`Successfully updated speaker ${speakerId}`)
    
    // Revalidate the public speaker page cache
    try {
      if (updatedSpeaker.slug) {
        revalidatePath(`/speakers/${updatedSpeaker.slug}`)
        revalidatePath('/speakers') // Also revalidate the speakers list
        console.log(`Revalidated cache for /speakers/${updatedSpeaker.slug}`)
      }
    } catch (revalidateError) {
      console.error('Failed to revalidate cache:', revalidateError)
      // Don't fail the update if revalidation fails
    }
    
    return NextResponse.json({
      success: true,
      message: 'Speaker updated successfully',
      speaker: {
        id: updatedSpeaker.id,
        name: updatedSpeaker.name,
        email: updatedSpeaker.email,
        slug: updatedSpeaker.slug,
        bio: updatedSpeaker.bio,
        short_bio: updatedSpeaker.short_bio,
        one_liner: updatedSpeaker.one_liner,
        headshot_url: updatedSpeaker.headshot_url,
        website: updatedSpeaker.website,
        linkedin_url: updatedSpeaker.social_media?.linkedin_url || '',
        twitter_url: updatedSpeaker.social_media?.twitter_url || '',
        youtube_url: updatedSpeaker.social_media?.youtube_url || '',
        instagram_url: updatedSpeaker.social_media?.instagram_url || '',
        social_media: updatedSpeaker.social_media,
        location: updatedSpeaker.location,
        programs: updatedSpeaker.programs,
        topics: updatedSpeaker.topics || [],
        industries: updatedSpeaker.industries || [],
        videos: updatedSpeaker.videos || [],
        testimonials: updatedSpeaker.testimonials || [],
        speaking_fee_range: updatedSpeaker.speaking_fee_range,
        travel_preferences: updatedSpeaker.travel_preferences,
        technical_requirements: updatedSpeaker.technical_requirements,
        dietary_restrictions: updatedSpeaker.dietary_restrictions,
        featured: updatedSpeaker.featured,
        active: updatedSpeaker.active,
        listed: updatedSpeaker.listed,
        ranking: updatedSpeaker.ranking,
        updated_at: updatedSpeaker.updated_at
      }
    })

  } catch (error) {
    console.error('Update admin speaker error:', error)
    
    // Check for specific database errors
    if (error instanceof Error) {
      if (error.message.includes('value too long for type character varying')) {
        return NextResponse.json(
          { 
            error: 'One or more fields exceed the maximum allowed length',
            details: 'Please ensure short_bio is under 500 chars, title and one_liner are under 255 chars'
          },
          { status: 400 }
        )
      }
      if (error.message.includes('violates check constraint')) {
        return NextResponse.json(
          { 
            error: 'Invalid data format',
            details: error.message
          },
          { status: 400 }
        )
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to update speaker',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
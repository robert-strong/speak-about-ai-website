import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// Helper to safely parse JSON or comma-separated strings into arrays
function safeParseArray(value: unknown): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    // Try JSON parse first
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      // If not JSON, split by comma (handles "Keynotes, Workshops" format)
      return value.split(',').map(s => s.trim()).filter(Boolean)
    }
  }
  return []
}

export async function GET(request: NextRequest) {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is not configured')
      return NextResponse.json(
        { error: 'Database configuration missing' },
        { status: 503 }
      )
    }

    // Initialize Neon client
    const sql = neon(process.env.DATABASE_URL)
    // Get all listed speakers (listed controls public visibility)
    const speakers = await sql`
      SELECT
        id, name, slug, email,
        bio, short_bio, one_liner, headshot_url, website, social_media,
        topics, speaking_fee_range, travel_preferences,
        technical_requirements, dietary_restrictions,
        active, email_verified, featured, location, programs,
        listed, industries, ranking, image_position, image_offset,
        videos, testimonials, created_at, updated_at
      FROM speakers
      WHERE listed = true
      ORDER BY ranking DESC NULLS LAST, name ASC
    `

    // Parse JSON fields safely
    const parsedSpeakers = speakers.map(speaker => {
      try {
        return {
        id: speaker.id,
        slug: speaker.slug || speaker.name?.toLowerCase().replace(/\s+/g, '-') || `speaker-${speaker.id}`,
        name: speaker.name,
        email: speaker.email,
        phone: '', // Column doesn't exist yet
        company: '', // Column doesn't exist yet
        title: speaker.one_liner,
        bio: speaker.bio,
        shortBio: speaker.short_bio,
        oneLiner: speaker.one_liner,
        image: speaker.headshot_url,
        imagePosition: speaker.image_position || 'center',
        imageOffsetY: speaker.image_offset || '0%',
        website: speaker.website,
        linkedin: speaker.social_media?.linkedin_url || '',
        linkedinUrl: speaker.social_media?.linkedin_url || '',
        twitter: speaker.social_media?.twitter_url || '',
        twitterUrl: speaker.social_media?.twitter_url || '',
        instagram: speaker.social_media?.instagram_url || '',
        instagramUrl: speaker.social_media?.instagram_url || '',
        youtube: speaker.social_media?.youtube_url || '',
        youtubeUrl: speaker.social_media?.youtube_url || '',
        topics: safeParseArray(speaker.topics),
        programs: safeParseArray(speaker.programs),
        industries: safeParseArray(speaker.industries),
        expertise: safeParseArray(speaker.topics), // Using topics as expertise for compatibility
        fee: speaker.speaking_fee_range || 'Please Inquire',
        feeRange: speaker.speaking_fee_range,
        speakingFeeRange: speaker.speaking_fee_range,
        location: speaker.location,
        travelPreferences: speaker.travel_preferences,
        technicalRequirements: speaker.technical_requirements,
        dietaryRestrictions: speaker.dietary_restrictions,
        featured: speaker.featured || false,
        listed: speaker.listed !== false,
        ranking: speaker.ranking || 0,
        videos: safeParseArray(speaker.videos),
        testimonials: safeParseArray(speaker.testimonials),
        active: speaker.active,
        emailVerified: speaker.email_verified,
        createdAt: speaker.created_at,
        updatedAt: speaker.updated_at
        }
      } catch (parseError) {
        console.error(`Error parsing speaker ${speaker.id}:`, parseError)
        // Return minimal speaker data if parsing fails
        return {
          id: speaker.id,
          slug: speaker.slug || speaker.name?.toLowerCase().replace(/\s+/g, '-') || `speaker-${speaker.id}`,
          name: speaker.name,
          image: speaker.headshot_url,
          programs: [],
          industries: [],
          topics: [],
          videos: [],
          testimonials: []
        }
      }
    })
    
    return NextResponse.json({
      success: true,
      speakers: parsedSpeakers
    })

  } catch (error) {
    console.error('Get speakers error:', error)
    
    // Return empty array as fallback to prevent site from breaking
    return NextResponse.json({
      success: false,
      speakers: [],
      error: 'Database temporarily unavailable'
    })
  }
}
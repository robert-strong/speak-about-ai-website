import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Try to find speaker by slug
    const { slug } = await params

    // Convert slug back to possible names for fallback
    const possibleName = slug.replace(/-/g, ' ')
    const possibleNameTitleCase = possibleName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')

    // Query for speaker by slug column first, then fall back to name matching
    // Only return speakers that are listed (public visibility control)
    const speakers = await sql`
      SELECT
        id, email, name, slug, bio, short_bio, one_liner,
        headshot_url, website, social_media,
        topics, industries, programs, videos, testimonials,
        speaking_fee_range,
        travel_preferences, technical_requirements, dietary_restrictions,
        location,
        featured, active, listed, ranking,
        created_at, updated_at
      FROM speakers
      WHERE
        listed = true
        AND (
          slug = ${slug}
          OR LOWER(REPLACE(name, ' ', '-')) = ${slug}
          OR LOWER(name) = ${possibleName.toLowerCase()}
          OR name = ${possibleNameTitleCase}
        )
      LIMIT 1
    `
    
    if (speakers.length === 0) {
      return NextResponse.json({ found: false })
    }
    
    const speaker = speakers[0]
    
    // Transform database data to match frontend Speaker interface
    const transformedSpeaker = {
      slug: speaker.slug || slug,
      name: speaker.name || '',
      title: speaker.one_liner || '',
      bio: speaker.bio || speaker.short_bio || '',
      image: speaker.headshot_url || '',
      programs: Array.isArray(speaker.programs) ? speaker.programs : [],
      industries: Array.isArray(speaker.industries) ? speaker.industries : [],
      fee: speaker.speaking_fee_range || '',
      feeRange: speaker.speaking_fee_range || '',
      location: speaker.location || '',
      linkedin: speaker.social_media?.linkedin_url || '',
      twitter: speaker.social_media?.twitter_url || '',
      website: speaker.website || '',
      featured: speaker.featured || false,
      videos: Array.isArray(speaker.videos) ? speaker.videos : [],
      testimonials: Array.isArray(speaker.testimonials) ? speaker.testimonials : [],
      topics: Array.isArray(speaker.topics) ? speaker.topics : [],
      listed: speaker.listed !== false,
      ranking: speaker.ranking || 0,
      // Additional fields from social_media
      youtube: speaker.social_media?.youtube_url || '',
      instagram: speaker.social_media?.instagram_url || ''
    }
    
    return NextResponse.json({ 
      found: true,
      speaker: transformedSpeaker
    })
    
  } catch (error) {
    console.error('Error fetching public speaker profile:', error)
    return NextResponse.json({ 
      found: false,
      error: 'Failed to fetch speaker profile' 
    })
  }
}
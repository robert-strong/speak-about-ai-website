import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Get Noah's profile by email instead of ID
    const speakers = await sql`
      SELECT 
        id, email, name, bio, short_bio, one_liner,
        headshot_url, website, social_media,
        topics, industries, programs, videos, testimonials,
        speaking_fee_range, 
        travel_preferences, technical_requirements, dietary_restrictions,
        location,
        featured, active, listed, ranking,
        created_at, updated_at
      FROM speakers
      WHERE email = 'noah@speakabout.ai'
      LIMIT 1
    `
    
    if (speakers.length === 0) {
      return NextResponse.json({ error: 'Noah not found' }, { status: 404 })
    }
    
    const speaker = speakers[0]
    
    // Parse name into first and last
    const nameParts = speaker.name ? speaker.name.trim().split(' ') : ['', '']
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''
    
    // Transform data to match frontend expectations
    const profile = {
      id: speaker.id,
      first_name: firstName,
      last_name: lastName,
      email: speaker.email,
      phone: '', // Not in current database
      title: speaker.one_liner?.includes(' at ') ? speaker.one_liner.split(' at ')[0] : (speaker.one_liner || ''),
      company: speaker.one_liner?.includes(' at ') ? speaker.one_liner.split(' at ')[1] : '',
      location: speaker.location || '',
      timezone: 'PST', // Default
      
      bio: speaker.bio || '',
      short_bio: speaker.short_bio || '',
      one_liner: speaker.one_liner || '',
      
      headshot_url: speaker.headshot_url || '',
      banner_url: '', // Not in current database
      
      expertise_areas: speaker.industries || [],
      speaking_topics: speaker.topics || [],
      programs: speaker.programs || [],
      
      signature_talks: [], // Not in current database
      achievements: [], // Not in current database
      
      education: [], // Not in current database
      certifications: [], // Not in current database
      
      languages: ['English'], // Default
      
      speaking_fee_range: speaker.speaking_fee_range || '',
      available_formats: ['keynote', 'panel', 'fireside', 'virtual', 'executive'], // Default
      
      travel_preferences: speaker.travel_preferences || '',
      booking_requirements: '', // Not in current database
      technical_requirements: speaker.technical_requirements || '',
      dietary_restrictions: speaker.dietary_restrictions || '',
      
      website: speaker.website || '',
      linkedin_url: speaker.social_media?.linkedin_url || '',
      twitter_url: speaker.social_media?.twitter_url || '',
      youtube_url: speaker.social_media?.youtube_url || '',
      instagram_url: speaker.social_media?.instagram_url || '',
      
      videos: speaker.videos || [],
      publications: [], // Column doesn't exist in database
      testimonials: speaker.testimonials || [],
      
      featured: speaker.featured,
      active: speaker.active,
      listed: speaker.listed,
      ranking: speaker.ranking,
      
      created_at: speaker.created_at,
      updated_at: speaker.updated_at
    }
    
    return NextResponse.json({ 
      success: true,
      profile,
      raw: speaker
    })
    
  } catch (error) {
    console.error('Error fetching Noah profile:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch profile',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
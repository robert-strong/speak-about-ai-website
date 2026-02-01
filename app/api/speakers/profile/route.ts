import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import jwt from 'jsonwebtoken'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify and decode token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const speakerId = decoded.speakerId
    
    if (!speakerId) {
      return NextResponse.json({ error: 'Invalid token - no speaker ID' }, { status: 401 })
    }
    
    // Fetch speaker data from database - only query existing columns
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
      WHERE id = ${speakerId}
      LIMIT 1
    `

    if (speakers.length === 0) {
      return NextResponse.json({ error: 'Speaker not found' }, { status: 404 })
    }

    const speaker = speakers[0]

    // Also fetch internal info from speaker_accounts
    let internalInfo: any = {}
    try {
      const accountsResult = await sql`
        SELECT internal_info
        FROM speaker_accounts
        WHERE speaker_id = ${speakerId}
        LIMIT 1
      `
      if (accountsResult.length > 0 && accountsResult[0].internal_info) {
        internalInfo = accountsResult[0].internal_info
      }
    } catch (accountError) {
      console.log('Note: Could not fetch speaker_accounts internal_info:', accountError)
    }

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
      phone: internalInfo.phone || '', // From speaker_accounts
      // Store title and company in one_liner field separated by ' at '
      // Parse them back out for display
      title: speaker.one_liner?.includes(' at ') ? speaker.one_liner.split(' at ')[0] : (speaker.one_liner || ''),
      company: speaker.one_liner?.includes(' at ') ? speaker.one_liner.split(' at ')[1] : '',
      location: speaker.location || '',
      timezone: 'PST', // Default, not in current database
      
      bio: speaker.bio || '',
      short_bio: speaker.short_bio || '',
      one_liner: speaker.one_liner || '',
      
      headshot_url: speaker.headshot_url || '',
      banner_url: '', // Not in current database
      
      // Parse topics if they're in JSON format
      expertise_areas: speaker.industries || [],
      speaking_topics: speaker.topics || [],
      programs: speaker.programs || [],
      
      signature_talks: [], // Not in current database
      achievements: [], // Not in current database
      
      education: [], // Not in current database
      certifications: [], // Not in current database
      
      languages: ['English'], // Default, not in current database
      
      speaking_fee_range: speaker.speaking_fee_range || '',
      available_formats: ['keynote', 'panel', 'fireside', 'virtual', 'executive'], // Default
      
      travel_preferences: speaker.travel_preferences || '',
      booking_requirements: internalInfo.booking_requirements || '',
      technical_requirements: speaker.technical_requirements || '',
      dietary_restrictions: speaker.dietary_restrictions || '',

      // Internal info from speaker_accounts
      emergency_contact: internalInfo.emergency_contact || '',
      assistant_contact: internalInfo.assistant_contact || '',
      preferred_airport: internalInfo.preferred_airport || '',
      alternate_airports: internalInfo.alternate_airports || '',
      hotel_preferences: internalInfo.hotel_preferences || '',
      ground_transport: internalInfo.ground_transport || '',
      av_requirements: internalInfo.av_requirements || '',
      stage_requirements: internalInfo.stage_requirements || '',

      // Fee structure from speaker_accounts
      fee_keynote: internalInfo.fee_keynote || '',
      fee_workshop: internalInfo.fee_workshop || '',
      fee_panel: internalInfo.fee_panel || '',
      fee_virtual: internalInfo.fee_virtual || '',
      fee_local: internalInfo.fee_local || '',
      fee_domestic: internalInfo.fee_domestic || '',
      fee_international: internalInfo.fee_international || '',
      fee_nonprofit: internalInfo.fee_nonprofit || '',

      // Other internal info
      payment_details: internalInfo.payment_details || '',
      w9_status: internalInfo.w9_status || '',
      medical_notes: internalInfo.medical_notes || '',
      accessibility_needs: internalInfo.accessibility_needs || '',
      
      website: speaker.website || '',
      linkedin_url: speaker.social_media?.linkedin_url || '',
      twitter_url: speaker.social_media?.twitter_url || '',
      youtube_url: speaker.social_media?.youtube_url || '',
      instagram_url: speaker.social_media?.instagram_url || '',
      
      videos: speaker.videos || [],
      publications: [], // Column doesn't exist yet
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
      profile 
    })

  } catch (error) {
    console.error('Error fetching speaker profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Verify and decode token
    let decoded: any
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const speakerId = decoded.speakerId
    const speakerEmail = decoded.email
    const data = await request.json()
    
    // Fetch current speaker data for comparison
    const currentData = await sql`
      SELECT * FROM speakers WHERE id = ${speakerId}
    `
    
    if (currentData.length === 0) {
      return NextResponse.json({ error: 'Speaker not found' }, { status: 404 })
    }
    
    const current = currentData[0]
    
    // Parse current name into first and last
    const [currentFirstName, ...currentLastNameParts] = (current.name || '').split(' ')
    const currentLastName = currentLastNameParts.join(' ')

    // Combine first and last name - use existing values if not provided
    const firstName = data.first_name !== undefined ? data.first_name : currentFirstName
    const lastName = data.last_name !== undefined ? data.last_name : currentLastName
    const fullName = `${firstName} ${lastName}`.trim() || current.name

    // Use existing email if not provided
    const email = data.email || current.email

    // Prepare social media data - merge with existing
    const currentSocialMedia = current.social_media || {}
    const socialMedia = {
      linkedin_url: data.linkedin_url !== undefined ? data.linkedin_url : currentSocialMedia.linkedin_url || null,
      twitter_url: data.twitter_url !== undefined ? data.twitter_url : currentSocialMedia.twitter_url || null,
      youtube_url: data.youtube_url !== undefined ? data.youtube_url : currentSocialMedia.youtube_url || null,
      instagram_url: data.instagram_url !== undefined ? data.instagram_url : currentSocialMedia.instagram_url || null
    }

    // Prepare internal info data (to be stored in speaker_accounts)
    const internalInfo = {
      phone: data.phone || null,
      emergency_contact: data.emergency_contact || null,
      assistant_contact: data.assistant_contact || null,
      preferred_airport: data.preferred_airport || null,
      alternate_airports: data.alternate_airports || null,
      hotel_preferences: data.hotel_preferences || null,
      ground_transport: data.ground_transport || null,
      av_requirements: data.av_requirements || null,
      stage_requirements: data.stage_requirements || null,
      fee_keynote: data.fee_keynote || null,
      fee_workshop: data.fee_workshop || null,
      fee_panel: data.fee_panel || null,
      fee_virtual: data.fee_virtual || null,
      fee_local: data.fee_local || null,
      fee_domestic: data.fee_domestic || null,
      fee_international: data.fee_international || null,
      fee_nonprofit: data.fee_nonprofit || null,
      booking_requirements: data.booking_requirements || null,
      payment_details: data.payment_details || null,
      w9_status: data.w9_status || null,
      medical_notes: data.medical_notes || null,
      accessibility_needs: data.accessibility_needs || null
    }

    // Update speaker in database - only update columns that exist
    const result = await sql`
      UPDATE speakers
      SET
        name = ${fullName},
        email = ${email},
        location = ${data.location !== undefined ? data.location : current.location},
        bio = ${data.bio !== undefined ? data.bio : current.bio},
        short_bio = ${data.short_bio !== undefined ? data.short_bio : current.short_bio},
        one_liner = ${data.title && data.company ? `${data.title} at ${data.company}` : (data.one_liner !== undefined ? data.one_liner : current.one_liner)},
        headshot_url = ${data.headshot_url !== undefined ? data.headshot_url : current.headshot_url},
        website = ${data.website !== undefined ? data.website : current.website},
        social_media = ${JSON.stringify(socialMedia)},
        topics = ${data.speaking_topics !== undefined ? JSON.stringify(data.speaking_topics) : JSON.stringify(current.topics || [])},
        industries = ${data.expertise_areas !== undefined ? JSON.stringify(data.expertise_areas) : JSON.stringify(current.industries || [])},
        programs = ${data.programs !== undefined ? JSON.stringify(data.programs) : JSON.stringify(current.programs || [])},
        videos = ${data.videos !== undefined ? JSON.stringify(data.videos) : JSON.stringify(current.videos || [])},
        testimonials = ${data.testimonials !== undefined ? JSON.stringify(data.testimonials) : JSON.stringify(current.testimonials || [])},
        speaking_fee_range = ${data.speaking_fee_range !== undefined ? data.speaking_fee_range : current.speaking_fee_range},
        travel_preferences = ${data.travel_preferences !== undefined ? data.travel_preferences : current.travel_preferences},
        technical_requirements = ${data.technical_requirements !== undefined ? data.technical_requirements : current.technical_requirements},
        dietary_restrictions = ${data.dietary_restrictions !== undefined ? data.dietary_restrictions : current.dietary_restrictions},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${speakerId}
      RETURNING id, email, name, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Speaker not found' }, { status: 404 })
    }

    // Also update internal info in speaker_accounts table
    try {
      await sql`
        UPDATE speaker_accounts
        SET
          internal_info = ${JSON.stringify(internalInfo)},
          updated_at = CURRENT_TIMESTAMP
        WHERE speaker_id = ${speakerId}
      `
      console.log('Updated speaker_accounts internal_info for speaker:', speakerId)
    } catch (accountError) {
      // speaker_accounts may not have internal_info column yet
      console.log('Note: Could not update speaker_accounts internal_info:', accountError)
    }
    
    // Log changes to speaker_updates table
    const changes = []
    const fieldsToTrack = [
      { field: 'name', old: current.name, new: fullName },
      { field: 'email', old: current.email, new: data.email },
      { field: 'location', old: current.location, new: data.location },
      { field: 'bio', old: current.bio, new: data.bio },
      { field: 'short_bio', old: current.short_bio, new: data.short_bio },
      { field: 'one_liner', old: current.one_liner, new: data.one_liner || data.title },
      { field: 'headshot_url', old: current.headshot_url, new: data.headshot_url },
      { field: 'website', old: current.website, new: data.website },
      { field: 'linkedin', old: current.social_media?.linkedin_url, new: socialMedia.linkedin_url },
      { field: 'twitter', old: current.social_media?.twitter_url, new: socialMedia.twitter_url },
      { field: 'instagram', old: current.social_media?.instagram_url, new: socialMedia.instagram_url },
      { field: 'youtube', old: current.social_media?.youtube_url, new: socialMedia.youtube_url },
      { field: 'topics', old: current.topics, new: JSON.stringify(data.speaking_topics || []) },
      { field: 'industries', old: current.industries, new: JSON.stringify(data.expertise_areas || []) },
      { field: 'programs', old: current.programs, new: JSON.stringify(data.programs || []) },
      { field: 'videos', old: current.videos, new: JSON.stringify(data.videos || []) },
      { field: 'testimonials', old: current.testimonials, new: JSON.stringify(data.testimonials || []) },
      { field: 'speaking_fee_range', old: current.speaking_fee_range, new: data.speaking_fee_range },
      { field: 'travel_preferences', old: current.travel_preferences, new: data.travel_preferences },
      { field: 'technical_requirements', old: current.technical_requirements, new: data.technical_requirements },
      { field: 'dietary_restrictions', old: current.dietary_restrictions, new: data.dietary_restrictions }
    ]
    
    // Insert update logs for changed fields
    for (const item of fieldsToTrack) {
      // Skip if values are the same (considering null/undefined as equal to empty string)
      let oldVal = item.old || ''
      let newVal = item.new || ''
      
      // For JSON fields, stringify them if they're objects/arrays
      if (typeof oldVal === 'object') {
        oldVal = JSON.stringify(oldVal)
      }
      if (typeof newVal === 'object') {
        newVal = JSON.stringify(newVal)
      }
      
      // Convert to string for comparison
      oldVal = String(oldVal)
      newVal = String(newVal)
      
      if (oldVal !== newVal) {
        await sql`
          INSERT INTO speaker_updates (
            speaker_id,
            speaker_name,
            speaker_email,
            field_name,
            old_value,
            new_value,
            changed_by,
            change_type,
            metadata
          ) VALUES (
            ${speakerId},
            ${fullName},
            ${data.email},
            ${item.field},
            ${oldVal.toString()},
            ${newVal.toString()},
            ${speakerEmail || 'self'},
            'update',
            ${JSON.stringify({ source: 'speaker_profile_update' })}
          )
        `
        changes.push(item.field)
      }
    }

    return NextResponse.json({ 
      success: true,
      speaker: result[0],
      changes_logged: changes
    })

  } catch (error) {
    console.error('Error updating speaker profile:', error)
    return NextResponse.json(
      { error: 'Failed to update profile' },
      { status: 500 }
    )
  }
}
import { NextResponse } from "next/server"
import { createSpeaker } from "@/lib/speakers-db"

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    // Validate required fields
    if (!data.name || !data.email || !data.bio || !data.short_bio) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    // Prepare speaker data for database
    const speakerData = {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      title: data.title || null,
      company: data.company || null,
      website: data.website || null,
      bio: data.bio,
      short_bio: data.short_bio,
      one_liner: data.one_liner || null,
      headshot_url: data.headshot_url || null,
      profile_photo_url: data.headshot_url || null, // Use same as headshot
      speaker_reel_url: data.speaker_reel_url || null,
      one_sheet_url: data.one_sheet_url || null,
      social_media: data.social_media || {},
      primary_topics: data.primary_topics || [],
      secondary_topics: data.secondary_topics || [],
      keywords: data.keywords || [],
      speaking_fee_range: data.speaking_fee_range || null,
      speaking_fee_min: data.speaking_fee_min || null,
      speaking_fee_max: data.speaking_fee_max || null,
      travel_preferences: data.travel_preferences || null,
      technical_requirements: data.technical_requirements || null,
      dietary_restrictions: data.dietary_restrictions || null,
      preferred_event_types: data.preferred_event_types || [],
      years_speaking: data.years_speaking || null,
      total_engagements: data.total_engagements || null,
      industries_served: data.industries_served || [],
      notable_clients: data.notable_clients || [],
      certifications: data.certifications || [],
      awards: data.awards || [],
      // status: 'pending', // Column doesn't exist in DB
      active: true
    }

    // Create speaker profile
    const speaker = await createSpeaker(speakerData)

    if (!speaker) {
      return NextResponse.json(
        { error: "Failed to create speaker profile" },
        { status: 500 }
      )
    }

    // TODO: Send notification email to admin about new application
    // TODO: Send confirmation email to speaker

    return NextResponse.json({
      success: true,
      speaker: {
        id: speaker.id,
        name: speaker.name,
        email: speaker.email
        // status: speaker.status // Column doesn't exist
      }
    })
  } catch (error) {
    console.error("Error creating speaker application:", error)
    
    // Check for duplicate email
    if (error instanceof Error && error.message.includes('duplicate key')) {
      return NextResponse.json(
        { error: "A speaker profile with this email already exists" },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
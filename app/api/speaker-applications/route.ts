import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"
import { sendEmail } from "@/lib/email"

const sql = neon(process.env.DATABASE_URL!)

const ADMIN_EMAIL = 'human@speakabout.ai'

// Public endpoint for submitting applications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['first_name', 'last_name', 'email', 'bio', 'location', 'title', 'company', 'speaking_topics']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field.replace('_', ' ')} is required` },
          { status: 400 }
        )
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await sql`
      SELECT id FROM speaker_applications 
      WHERE email = ${body.email.toLowerCase()}
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An application with this email already exists" },
        { status: 400 }
      )
    }

    // Insert application with all fields
    const [application] = await sql`
      INSERT INTO speaker_applications (
        first_name,
        last_name,
        email,
        phone,
        website,
        linkedin_url,
        location,
        timezone,
        headshot_url,
        title,
        company,
        bio,
        short_bio,
        achievements,
        education,
        certifications,
        expertise_areas,
        speaking_topics,
        signature_talks,
        industries_experience,
        case_studies,
        years_speaking,
        total_engagements,
        previous_engagements,
        client_testimonials,
        video_links,
        media_coverage,
        twitter_url,
        youtube_url,
        instagram_url,
        blog_url,
        published_content,
        podcast_appearances,
        reference_contacts,
        past_client_references,
        speaker_bureau_experience,
        speaking_fee_range,
        travel_requirements,
        available_formats,
        booking_lead_time,
        availability_constraints,
        technical_requirements,
        speaking_experience,
        notable_organizations,
        ai_expertise,
        unique_perspective,
        audience_size_preference,
        why_speak_about_ai,
        additional_info,
        agree_to_terms,
        status
      ) VALUES (
        ${body.first_name},
        ${body.last_name},
        ${body.email.toLowerCase()},
        ${body.phone || null},
        ${body.website || null},
        ${body.linkedin_url || null},
        ${body.location},
        ${body.timezone || null},
        ${body.headshot_url || null},
        ${body.title},
        ${body.company},
        ${body.bio},
        ${body.short_bio || null},
        ${body.achievements || null},
        ${body.education || null},
        ${body.certifications || null},
        ${body.expertise_areas || []},
        ${body.speaking_topics},
        ${body.signature_talks || null},
        ${body.industries_experience || []},
        ${body.case_studies || null},
        ${body.years_speaking || null},
        ${body.total_engagements || null},
        ${body.previous_engagements || null},
        ${body.client_testimonials || null},
        ${body.video_links || []},
        ${body.media_coverage || null},
        ${body.twitter_url || null},
        ${body.youtube_url || null},
        ${body.instagram_url || null},
        ${body.blog_url || null},
        ${body.published_content || null},
        ${body.podcast_appearances || null},
        ${body.reference_contacts || null},
        ${body.past_client_references || null},
        ${body.speaker_bureau_experience || null},
        ${body.speaking_fee_range || null},
        ${body.travel_requirements || null},
        ${body.available_formats || []},
        ${body.booking_lead_time || null},
        ${body.availability_constraints || null},
        ${body.technical_requirements || null},
        ${body.speaking_experience || null},
        ${body.notable_organizations || null},
        ${body.ai_expertise || null},
        ${body.unique_perspective || null},
        ${body.audience_size_preference || null},
        ${body.why_speak_about_ai || null},
        ${body.additional_info || null},
        ${body.agree_to_terms || false},
        'pending'
      )
      RETURNING id, email, first_name, last_name
    `

    // Send notification email to admin about new application
    try {
      const adminHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a1a2e;">🎤 New Speaker Application</h1>
          <p>A new speaker application has been submitted:</p>

          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #333;">${body.first_name} ${body.last_name}</h2>
            <p><strong>Title:</strong> ${body.title}</p>
            <p><strong>Company:</strong> ${body.company}</p>
            <p><strong>Email:</strong> <a href="mailto:${body.email}">${body.email}</a></p>
            <p><strong>Location:</strong> ${body.location}</p>
            ${body.phone ? `<p><strong>Phone:</strong> ${body.phone}</p>` : ''}
            ${body.linkedin_url ? `<p><strong>LinkedIn:</strong> <a href="${body.linkedin_url}">${body.linkedin_url}</a></p>` : ''}
            ${body.website ? `<p><strong>Website:</strong> <a href="${body.website}">${body.website}</a></p>` : ''}
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Bio</h3>
            <p style="white-space: pre-wrap;">${body.bio}</p>
          </div>

          <div style="margin: 20px 0;">
            <h3 style="color: #333;">Speaking Topics</h3>
            <p style="white-space: pre-wrap;">${body.speaking_topics}</p>
          </div>

          ${body.ai_expertise ? `
          <div style="margin: 20px 0;">
            <h3 style="color: #333;">AI Expertise</h3>
            <p style="white-space: pre-wrap;">${body.ai_expertise}</p>
          </div>
          ` : ''}

          ${body.years_speaking ? `<p><strong>Years Speaking:</strong> ${body.years_speaking}</p>` : ''}
          ${body.speaking_fee_range ? `<p><strong>Fee Range:</strong> ${body.speaking_fee_range}</p>` : ''}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
            <p><strong>Application ID:</strong> ${application.id}</p>
            <p>
              <a href="https://speakabout.ai/admin/speaker-applications"
                 style="background: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Review Application
              </a>
            </p>
          </div>
        </div>
      `

      const adminText = `
New Speaker Application

Name: ${body.first_name} ${body.last_name}
Title: ${body.title}
Company: ${body.company}
Email: ${body.email}
Location: ${body.location}
${body.phone ? `Phone: ${body.phone}` : ''}
${body.linkedin_url ? `LinkedIn: ${body.linkedin_url}` : ''}
${body.website ? `Website: ${body.website}` : ''}

Bio:
${body.bio}

Speaking Topics:
${body.speaking_topics}

${body.ai_expertise ? `AI Expertise:\n${body.ai_expertise}` : ''}

${body.years_speaking ? `Years Speaking: ${body.years_speaking}` : ''}
${body.speaking_fee_range ? `Fee Range: ${body.speaking_fee_range}` : ''}

Application ID: ${application.id}
Review at: https://speakabout.ai/admin/speaker-applications
      `.trim()

      await sendEmail({
        to: ADMIN_EMAIL,
        subject: `🎤 New Speaker Application: ${body.first_name} ${body.last_name}`,
        html: adminHtml,
        text: adminText
      })
    } catch (emailError) {
      console.error('Failed to send admin notification email:', emailError)
      // Don't fail the request if email fails - application was still saved
    }

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      applicationId: application.id
    })

  } catch (error) {
    console.error("Error submitting speaker application:", error)
    return NextResponse.json(
      { 
        error: "Failed to submit application",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Admin endpoint to get all applications (requires auth)
export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    const authError = requireAdminAuth(request)
    if (authError) {
      return authError
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Build query with proper parameterization to prevent SQL injection
    let applications

    if (status && status !== 'all' && search) {
      // Both status and search filters
      const searchPattern = `%${search}%`
      applications = await sql`
        SELECT * FROM speaker_applications
        WHERE status = ${status}
        AND (
          LOWER(first_name) LIKE LOWER(${searchPattern}) OR
          LOWER(last_name) LIKE LOWER(${searchPattern}) OR
          LOWER(email) LIKE LOWER(${searchPattern}) OR
          LOWER(company) LIKE LOWER(${searchPattern})
        )
        ORDER BY created_at DESC
      `
    } else if (status && status !== 'all') {
      // Only status filter
      applications = await sql`
        SELECT * FROM speaker_applications
        WHERE status = ${status}
        ORDER BY created_at DESC
      `
    } else if (search) {
      // Only search filter
      const searchPattern = `%${search}%`
      applications = await sql`
        SELECT * FROM speaker_applications
        WHERE
          LOWER(first_name) LIKE LOWER(${searchPattern}) OR
          LOWER(last_name) LIKE LOWER(${searchPattern}) OR
          LOWER(email) LIKE LOWER(${searchPattern}) OR
          LOWER(company) LIKE LOWER(${searchPattern})
        ORDER BY created_at DESC
      `
    } else {
      // No filters
      applications = await sql`
        SELECT * FROM speaker_applications
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json({
      applications,
      total: applications.length
    })

  } catch (error) {
    console.error("Error fetching speaker applications:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch applications",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
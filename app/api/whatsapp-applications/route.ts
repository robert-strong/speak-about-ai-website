import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

// Public endpoint for submitting applications
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const requiredFields = ['email', 'full_name', 'linkedin_url', 'phone_number', 'primary_role']
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

    // Validate LinkedIn URL
    if (!body.linkedin_url.includes('linkedin.com')) {
      return NextResponse.json(
        { error: "Please provide a valid LinkedIn profile URL" },
        { status: 400 }
      )
    }

    // Check if "Other" role requires other_role field
    if (body.primary_role === 'Other' && !body.other_role) {
      return NextResponse.json(
        { error: "Please specify your role when selecting 'Other'" },
        { status: 400 }
      )
    }

    // Check if user agreed to rules
    if (!body.agree_to_rules) {
      return NextResponse.json(
        { error: "You must agree to the community rules to apply" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existing = await sql`
      SELECT id FROM whatsapp_applications
      WHERE email = ${body.email.toLowerCase()}
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An application with this email already exists" },
        { status: 400 }
      )
    }

    // Get IP and user agent
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const userAgent = request.headers.get("user-agent")

    // Insert application
    const [application] = await sql`
      INSERT INTO whatsapp_applications (
        email,
        full_name,
        linkedin_url,
        phone_number,
        primary_role,
        other_role,
        value_expectations,
        agree_to_rules,
        submission_ip,
        user_agent,
        status
      ) VALUES (
        ${body.email.toLowerCase()},
        ${body.full_name},
        ${body.linkedin_url},
        ${body.phone_number},
        ${body.primary_role},
        ${body.other_role || null},
        ${body.value_expectations || []},
        ${body.agree_to_rules},
        ${ip},
        ${userAgent},
        'pending'
      )
      RETURNING id, email, full_name
    `

    // TODO: Send notification email to admin about new application
    // TODO: Send confirmation email to applicant

    return NextResponse.json({
      success: true,
      message: "Application submitted successfully",
      applicationId: application.id
    })

  } catch (error) {
    console.error("Error submitting WhatsApp application:", error)
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
        SELECT * FROM whatsapp_applications
        WHERE status = ${status}
        AND (
          LOWER(full_name) LIKE LOWER(${searchPattern}) OR
          LOWER(email) LIKE LOWER(${searchPattern}) OR
          LOWER(primary_role) LIKE LOWER(${searchPattern})
        )
        ORDER BY created_at DESC
      `
    } else if (status && status !== 'all') {
      // Only status filter
      applications = await sql`
        SELECT * FROM whatsapp_applications
        WHERE status = ${status}
        ORDER BY created_at DESC
      `
    } else if (search) {
      // Only search filter
      const searchPattern = `%${search}%`
      applications = await sql`
        SELECT * FROM whatsapp_applications
        WHERE
          LOWER(full_name) LIKE LOWER(${searchPattern}) OR
          LOWER(email) LIKE LOWER(${searchPattern}) OR
          LOWER(primary_role) LIKE LOWER(${searchPattern})
        ORDER BY created_at DESC
      `
    } else {
      // No filters
      applications = await sql`
        SELECT * FROM whatsapp_applications
        ORDER BY created_at DESC
      `
    }

    return NextResponse.json({
      applications,
      total: applications.length
    })

  } catch (error) {
    console.error("Error fetching WhatsApp applications:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch applications",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

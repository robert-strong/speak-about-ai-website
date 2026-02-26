import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// GET - Validate token and check if it's still valid (no OTP yet)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Find the link
    const [link] = await sql`
      SELECT
        id,
        client_email,
        client_name,
        expires_at,
        viewed_at,
        is_active,
        view_count,
        max_views
      FROM bank_info_links
      WHERE token_id = ${token}
    `

    if (!link) {
      return NextResponse.json(
        { error: "Invalid or expired link", code: "INVALID_LINK" },
        { status: 404 }
      )
    }

    // Check if link is still valid
    const now = new Date()
    const expiresAt = new Date(link.expires_at)

    if (!link.is_active) {
      return NextResponse.json(
        { error: "This link has been revoked", code: "LINK_REVOKED" },
        { status: 403 }
      )
    }

    if (expiresAt < now) {
      return NextResponse.json(
        { error: "This link has expired", code: "LINK_EXPIRED" },
        { status: 403 }
      )
    }

    if (link.view_count >= link.max_views) {
      return NextResponse.json(
        { error: "This link has already been used", code: "LINK_USED" },
        { status: 403 }
      )
    }

    // Log the access attempt
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await sql`
      INSERT INTO bank_info_audit_log (link_id, action, client_email, ip_address, user_agent, details)
      VALUES (
        ${link.id},
        'link_accessed',
        ${link.client_email},
        ${ip},
        ${request.headers.get('user-agent') || 'Unknown'},
        '{}'
      )
    `

    // Return masked email for OTP display
    const emailParts = link.client_email.split('@')
    const maskedEmail = emailParts[0].slice(0, 2) + '***@' + emailParts[1]

    return NextResponse.json({
      valid: true,
      clientName: link.client_name,
      maskedEmail,
      expiresAt: link.expires_at
    })
  } catch (error) {
    console.error("Error validating token:", error)
    return NextResponse.json(
      { error: "Failed to validate link" },
      { status: 500 }
    )
  }
}

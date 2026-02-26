import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"
import { generateSecureToken } from "@/lib/bank-encryption"
import { sendEmail } from "@/lib/email-utils"

const sql = neon(process.env.DATABASE_URL!)

// POST - Generate a secure magic link for a client
export async function POST(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { clientEmail, clientName, expiresInHours = 1, maxViews = 1 } = body

    // Validate email
    if (!clientEmail || !clientEmail.includes('@')) {
      return NextResponse.json(
        { error: "Valid client email is required" },
        { status: 400 }
      )
    }

    // Check if bank info exists
    const [bankInfo] = await sql`
      SELECT id FROM secure_bank_info LIMIT 1
    `

    if (!bankInfo) {
      return NextResponse.json(
        { error: "Please save your bank info first before generating links" },
        { status: 400 }
      )
    }

    // Generate secure token
    const tokenId = generateSecureToken()

    // Calculate expiration (default 1 hour)
    const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000)

    // Create the link record
    const [link] = await sql`
      INSERT INTO bank_info_links (
        token_id,
        client_email,
        client_name,
        expires_at,
        max_views
      ) VALUES (
        ${tokenId},
        ${clientEmail},
        ${clientName || null},
        ${expiresAt.toISOString()},
        ${maxViews}
      )
      RETURNING id, token_id, expires_at
    `

    // Generate the magic link URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000'
    const magicLink = `${baseUrl}/secure/bank-info/${tokenId}`

    // Log the action
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await sql`
      INSERT INTO bank_info_audit_log (link_id, action, client_email, ip_address, user_agent, details)
      VALUES (
        ${link.id},
        'link_generated',
        ${clientEmail},
        ${ip},
        ${request.headers.get('user-agent') || 'Unknown'},
        ${JSON.stringify({ clientName, expiresAt: expiresAt.toISOString(), maxViews })}
      )
    `

    // Send email with magic link
    try {
      await sendEmail({
        to: clientEmail,
        subject: "Secure Bank Details Access - Speak About AI",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Secure Bank Details Access</h2>
            <p>Hello${clientName ? ` ${clientName}` : ''},</p>
            <p>You have been granted secure access to view bank details for payment purposes.</p>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 15px 0;"><strong>Important:</strong></p>
              <ul style="margin: 0; padding-left: 20px;">
                <li>This link expires in ${expiresInHours} hour${expiresInHours > 1 ? 's' : ''}</li>
                <li>Can only be viewed ${maxViews} time${maxViews > 1 ? 's' : ''}</li>
                <li>You will need to verify with a one-time code sent to this email</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${magicLink}"
                 style="background: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 500;">
                View Bank Details
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              If you did not request this access, please ignore this email.
            </p>

            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            <p style="color: #999; font-size: 12px;">
              Speak About AI - Secure Payment Portal
            </p>
          </div>
        `
      })
    } catch (emailError) {
      console.error("Failed to send magic link email:", emailError)
      // Still return success - link was created, just email failed
    }

    return NextResponse.json({
      success: true,
      link: {
        id: link.id,
        tokenId: link.token_id,
        magicLink,
        expiresAt: link.expires_at,
        clientEmail,
        clientName
      }
    })
  } catch (error) {
    console.error("Error generating magic link:", error)
    return NextResponse.json(
      { error: "Failed to generate secure link" },
      { status: 500 }
    )
  }
}

// GET - List all active links
export async function GET(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const links = await sql`
      SELECT
        id,
        token_id,
        client_email,
        client_name,
        expires_at,
        viewed_at,
        is_active,
        view_count,
        max_views,
        created_at,
        CASE
          WHEN viewed_at IS NOT NULL THEN 'viewed'
          WHEN expires_at < NOW() THEN 'expired'
          WHEN is_active = false THEN 'revoked'
          ELSE 'active'
        END as status
      FROM bank_info_links
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({ links })
  } catch (error) {
    console.error("Error fetching links:", error)
    return NextResponse.json(
      { error: "Failed to fetch links" },
      { status: 500 }
    )
  }
}

// DELETE - Revoke a link
export async function DELETE(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const linkId = searchParams.get('id')

    if (!linkId) {
      return NextResponse.json(
        { error: "Link ID is required" },
        { status: 400 }
      )
    }

    await sql`
      UPDATE bank_info_links
      SET is_active = false
      WHERE id = ${parseInt(linkId)}
    `

    // Log the action
    await sql`
      INSERT INTO bank_info_audit_log (link_id, action, details)
      VALUES (${parseInt(linkId)}, 'link_revoked', '{}')
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error revoking link:", error)
    return NextResponse.json(
      { error: "Failed to revoke link" },
      { status: 500 }
    )
  }
}

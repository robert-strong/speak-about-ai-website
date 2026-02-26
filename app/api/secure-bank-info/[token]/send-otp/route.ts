import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { generateOTP, hashOTP } from "@/lib/bank-encryption"
import { sendEmail } from "@/lib/email-utils"

const sql = neon(process.env.DATABASE_URL!)

// POST - Send OTP to client email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // Find and validate the link
    const [link] = await sql`
      SELECT
        id,
        client_email,
        client_name,
        expires_at,
        is_active,
        view_count,
        max_views
      FROM bank_info_links
      WHERE token_id = ${token}
    `

    if (!link) {
      return NextResponse.json(
        { error: "Invalid link" },
        { status: 404 }
      )
    }

    // Validate link is still usable
    const now = new Date()
    const expiresAt = new Date(link.expires_at)

    if (!link.is_active || expiresAt < now || link.view_count >= link.max_views) {
      return NextResponse.json(
        { error: "This link is no longer valid" },
        { status: 403 }
      )
    }

    // Check for existing unexpired OTP (rate limiting)
    const [existingOtp] = await sql`
      SELECT id, created_at
      FROM bank_info_otps
      WHERE link_id = ${link.id}
        AND expires_at > NOW()
        AND verified_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (existingOtp) {
      const createdAt = new Date(existingOtp.created_at)
      const cooldown = 60 * 1000 // 1 minute cooldown
      if (now.getTime() - createdAt.getTime() < cooldown) {
        const waitSeconds = Math.ceil((cooldown - (now.getTime() - createdAt.getTime())) / 1000)
        return NextResponse.json(
          { error: `Please wait ${waitSeconds} seconds before requesting a new code` },
          { status: 429 }
        )
      }
    }

    // Generate new OTP
    const otp = generateOTP()
    const otpHash = hashOTP(otp)
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

    // Store OTP
    await sql`
      INSERT INTO bank_info_otps (link_id, otp_hash, expires_at)
      VALUES (${link.id}, ${otpHash}, ${otpExpires.toISOString()})
    `

    // Log the action
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await sql`
      INSERT INTO bank_info_audit_log (link_id, action, client_email, ip_address, user_agent, details)
      VALUES (
        ${link.id},
        'otp_sent',
        ${link.client_email},
        ${ip},
        ${request.headers.get('user-agent') || 'Unknown'},
        '{}'
      )
    `

    // Send OTP email
    try {
      await sendEmail({
        to: link.client_email,
        subject: "Your Verification Code - Speak About AI",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Verification Code</h2>
            <p>Hello${link.client_name ? ` ${link.client_name}` : ''},</p>
            <p>Your one-time verification code is:</p>

            <div style="background: #f5f5f5; padding: 30px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">
                ${otp}
              </span>
            </div>

            <p style="color: #666; font-size: 14px;">
              This code will expire in 10 minutes.
            </p>

            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If you did not request this code, please ignore this email.
            </p>
          </div>
        `
      })
    } catch (emailError) {
      console.error("Failed to send OTP email:", emailError)
      return NextResponse.json(
        { error: "Failed to send verification code" },
        { status: 500 }
      )
    }

    // Mask email for response
    const emailParts = link.client_email.split('@')
    const maskedEmail = emailParts[0].slice(0, 2) + '***@' + emailParts[1]

    return NextResponse.json({
      success: true,
      message: `Verification code sent to ${maskedEmail}`,
      expiresIn: 600 // 10 minutes in seconds
    })
  } catch (error) {
    console.error("Error sending OTP:", error)
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    )
  }
}

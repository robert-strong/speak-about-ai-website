import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { verifyOTP, decryptBankInfo } from "@/lib/bank-encryption"

const sql = neon(process.env.DATABASE_URL!)

// POST - Verify OTP and return decrypted bank info
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params
    const body = await request.json()
    const { otp } = body

    if (!otp || otp.length !== 6) {
      return NextResponse.json(
        { error: "Please enter a valid 6-digit code" },
        { status: 400 }
      )
    }

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

    // Find the most recent unexpired OTP for this link
    const [otpRecord] = await sql`
      SELECT id, otp_hash, attempts, max_attempts, expires_at
      FROM bank_info_otps
      WHERE link_id = ${link.id}
        AND expires_at > NOW()
        AND verified_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `

    if (!otpRecord) {
      return NextResponse.json(
        { error: "No valid verification code found. Please request a new code." },
        { status: 400 }
      )
    }

    // Check attempts
    if (otpRecord.attempts >= otpRecord.max_attempts) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code." },
        { status: 429 }
      )
    }

    // Increment attempts
    await sql`
      UPDATE bank_info_otps
      SET attempts = attempts + 1
      WHERE id = ${otpRecord.id}
    `

    // Verify OTP
    if (!verifyOTP(otp, otpRecord.otp_hash)) {
      const remainingAttempts = otpRecord.max_attempts - otpRecord.attempts - 1
      return NextResponse.json(
        { error: `Invalid code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` },
        { status: 401 }
      )
    }

    // Mark OTP as verified
    await sql`
      UPDATE bank_info_otps
      SET verified_at = NOW()
      WHERE id = ${otpRecord.id}
    `

    // Mark link as viewed and increment view count
    await sql`
      UPDATE bank_info_links
      SET
        viewed_at = COALESCE(viewed_at, NOW()),
        view_count = view_count + 1
      WHERE id = ${link.id}
    `

    // Log the successful verification
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'Unknown'
    await sql`
      INSERT INTO bank_info_audit_log (link_id, action, client_email, ip_address, user_agent, details)
      VALUES (
        ${link.id},
        'bank_info_viewed',
        ${link.client_email},
        ${ip},
        ${request.headers.get('user-agent') || 'Unknown'},
        '{}'
      )
    `

    // Fetch and decrypt bank info
    const [bankInfo] = await sql`
      SELECT encrypted_data, iv, auth_tag
      FROM secure_bank_info
      ORDER BY id DESC
      LIMIT 1
    `

    if (!bankInfo) {
      return NextResponse.json(
        { error: "Bank information not available" },
        { status: 404 }
      )
    }

    // Decrypt bank info in memory
    const decrypted = decryptBankInfo(
      bankInfo.encrypted_data,
      bankInfo.iv,
      bankInfo.auth_tag
    )

    // Return decrypted bank info (only this one time!)
    return NextResponse.json({
      success: true,
      bankInfo: {
        bankName: decrypted.bankName,
        routingNumber: decrypted.routingNumber,
        accountNumber: decrypted.accountNumber,
        accountType: decrypted.accountType || 'Checking',
        wireRoutingNumber: decrypted.wireRoutingNumber || null,
        swiftCode: decrypted.swiftCode || null
      },
      // Include warning for the client
      securityNote: "Please verify these details via voice call before making any transfers."
    })
  } catch (error) {
    console.error("Error verifying OTP:", error)
    return NextResponse.json(
      { error: "Failed to verify code" },
      { status: 500 }
    )
  }
}

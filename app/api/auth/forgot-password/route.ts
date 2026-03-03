import { NextRequest, NextResponse } from "next/server"
import { randomBytes } from "crypto"
import { hashPassword } from "@/lib/password-utils"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter"
import { neon } from "@neondatabase/serverless"
import { Resend } from "resend"

// Lazy initialize Resend
let resend: Resend | null = null
function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(12)
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length]
  }
  // Ensure it meets password requirements
  return password.slice(0, 4) + 'A' + 'a' + '1' + password.slice(7)
}

const SUCCESS_MESSAGE = "If an account with that email exists, a temporary password has been sent."

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 requests per 30 minutes per IP
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(request, `forgot-password:${clientId}`, 3, 30 * 60 * 1000)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later.", retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000) },
        { status: 429 }
      )
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    const { email } = body

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // 1-second delay to prevent timing-based email enumeration
    await new Promise(resolve => setTimeout(resolve, 1000))

    try {
      const sql = neon(process.env.DATABASE_URL!)
      const members = await sql`
        SELECT id, name, email, status
        FROM team_members
        WHERE LOWER(email) = LOWER(${email.trim()})
      `

      if (members.length > 0 && members[0].status === 'active') {
        const member = members[0]
        const tempPassword = generateTempPassword()
        const passwordHash = hashPassword(tempPassword)

        // Update password and flag must_change_password
        await sql`
          UPDATE team_members
          SET password_hash = ${passwordHash}, must_change_password = TRUE
          WHERE id = ${member.id}
        `

        // Send email with temp password
        await sendTempPasswordEmail(member.email, member.name, tempPassword)
      }
    } catch (dbError) {
      // Log but don't reveal to client
      console.error("Forgot password DB error:", dbError)
    }

    // Always return success to prevent email enumeration
    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE })

  } catch (error) {
    console.error("Forgot password error:", error)
    // Still return success to prevent information leakage
    return NextResponse.json({ success: true, message: SUCCESS_MESSAGE })
  }
}

async function sendTempPasswordEmail(email: string, name: string, tempPassword: string) {
  const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/admin`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Password Reset - Speak About AI</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Speak About AI</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Password Reset</p>
      </div>
      <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hi ${name},</h2>
        <p style="color: #4b5563; font-size: 16px;">
          We received a request to reset your password. Here is your temporary password:
        </p>
        <div style="background: #f3f4f6; border: 2px dashed #d1d5db; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0;">
          <code style="font-size: 24px; font-weight: bold; color: #1f2937; letter-spacing: 2px;">${tempPassword}</code>
        </div>
        <p style="color: #4b5563; font-size: 16px;">
          Use this password to log in. You will be asked to set a new password immediately after logging in.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${loginUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Log In Now
          </a>
        </div>
        <p style="color: #ef4444; font-size: 14px; font-weight: 600;">
          If you did not request this password reset, please contact your administrator immediately.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions, please reach out to us at
          <a href="mailto:hello@speakabout.ai" style="color: #3b82f6;">hello@speakabout.ai</a>
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
          Best regards,<br>
          <strong>The Speak About AI Team</strong>
        </p>
      </div>
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Speak About AI. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  const textContent = `Hi ${name},

We received a request to reset your password. Here is your temporary password:

${tempPassword}

Use this password to log in at ${loginUrl}. You will be asked to set a new password immediately after logging in.

If you did not request this password reset, please contact your administrator immediately.

Best regards,
The Speak About AI Team`

  const { error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Speak About AI <hello@speakabout.ai>',
    to: email,
    subject: 'Password Reset - Speak About AI',
    html: htmlContent,
    text: textContent
  })

  if (error) {
    console.error('Failed to send temp password email:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }
}

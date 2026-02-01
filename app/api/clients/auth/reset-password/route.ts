import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex')
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return `${salt}:${hash}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, password } = body

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    // Find client by reset token
    const clients = await sql`
      SELECT id, email, reset_token_expires
      FROM clients
      WHERE reset_token = ${token}
      LIMIT 1
    `

    if (clients.length === 0) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    const client = clients[0]

    // Check if token has expired
    if (new Date(client.reset_token_expires) < new Date()) {
      return NextResponse.json(
        { error: "Reset token has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = hashPassword(password)

    // Update password and clear reset token
    await sql`
      UPDATE clients
      SET
        password_hash = ${passwordHash},
        reset_token = NULL,
        reset_token_expires = NULL,
        email_verified = true,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${client.id}
    `

    return NextResponse.json({
      success: true,
      message: "Password has been reset successfully. You can now log in."
    })

  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Find client by email
    const clients = await sql`
      SELECT id, name, email
      FROM clients
      WHERE LOWER(email) = ${email.toLowerCase()}
      LIMIT 1
    `

    // Always return success to prevent email enumeration
    if (clients.length === 0) {
      return NextResponse.json({
        success: true,
        message: "If an account exists with this email, you will receive a password reset link."
      })
    }

    const client = clients[0]

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Store reset token
    await sql`
      UPDATE clients
      SET
        reset_token = ${resetToken},
        reset_token_expires = ${resetTokenExpires.toISOString()}
      WHERE id = ${client.id}
    `

    // TODO: Send password reset email
    // The reset link would be: ${process.env.NEXT_PUBLIC_APP_URL}/client-portal/reset-password?token=${resetToken}
    console.log(`Password reset token for ${email}: ${resetToken}`)

    return NextResponse.json({
      success: true,
      message: "If an account exists with this email, you will receive a password reset link."
    })

  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "An error occurred" },
      { status: 500 }
    )
  }
}

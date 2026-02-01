import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Verification token is required' },
        { status: 400 }
      )
    }

    // Find speaker with this verification token
    const speakers = await sql`
      SELECT id, email, name, email_verified
      FROM speakers
      WHERE verification_token = ${token} AND active = true
      LIMIT 1
    `

    if (speakers.length === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired verification token' },
        { status: 400 }
      )
    }

    const speaker = speakers[0]

    if (speaker.email_verified) {
      return NextResponse.json(
        { message: 'Email already verified. You can now log in.' },
        { status: 200 }
      )
    }

    // Verify the email and clear the verification token
    await sql`
      UPDATE speakers
      SET 
        email_verified = true,
        verification_token = NULL,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${speaker.id}
    `

    return NextResponse.json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
      speaker: {
        id: speaker.id,
        email: speaker.email,
        name: speaker.name
      }
    })

  } catch (error) {
    console.error('Email verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email. Please try again.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Find speaker by email
    const speakers = await sql`
      SELECT id, email, name, email_verified, verification_token
      FROM speakers
      WHERE email = ${email.toLowerCase()} AND active = true
      LIMIT 1
    `

    if (speakers.length === 0) {
      return NextResponse.json(
        { error: 'No account found with this email address' },
        { status: 404 }
      )
    }

    const speaker = speakers[0]

    if (speaker.email_verified) {
      return NextResponse.json(
        { message: 'Email is already verified' },
        { status: 200 }
      )
    }

    // Generate new verification token if needed
    let verificationToken = speaker.verification_token
    if (!verificationToken) {
      const { generateSecureToken } = await import('@/lib/password-utils')
      verificationToken = generateSecureToken()
      
      await sql`
        UPDATE speakers
        SET verification_token = ${verificationToken}
        WHERE id = ${speaker.id}
      `
    }

    // In a real application, send verification email here
    const response: any = {
      success: true,
      message: 'Verification email sent. Please check your inbox.'
    }

    // In development, include verification token for testing
    if (process.env.NODE_ENV === 'development') {
      response.verificationToken = verificationToken
      response.verificationUrl = `/api/auth/speaker-verify?token=${verificationToken}`
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Resend verification error:', error)
    return NextResponse.json(
      { error: 'Failed to resend verification email' },
      { status: 500 }
    )
  }
}
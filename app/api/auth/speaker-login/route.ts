import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { verifyPassword } from '@/lib/password-utils'

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Add small delay to prevent brute force attacks
    await new Promise(resolve => setTimeout(resolve, 1000))

    // First try speaker_accounts table (for portal login - same as password reset)
    const accounts = await sql`
      SELECT
        sa.id as account_id,
        sa.speaker_id,
        sa.speaker_email as email,
        sa.speaker_name as name,
        sa.is_active as active,
        sa.password_hash,
        sa.email_verified
      FROM speaker_accounts sa
      WHERE LOWER(sa.speaker_email) = ${email.toLowerCase()}
        AND sa.is_active = true
      LIMIT 1
    `

    let speaker = null
    let useAccountsTable = false

    if (accounts.length > 0) {
      speaker = accounts[0]
      useAccountsTable = true
    } else {
      // Fallback to speakers table
      const speakers = await sql`
        SELECT id, email, name, active, password_hash, email_verified
        FROM speakers
        WHERE email = ${email.toLowerCase()} AND active = true
        LIMIT 1
      `
      if (speakers.length > 0) {
        speaker = speakers[0]
      }
    }

    if (!speaker) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check if speaker has set a password
    if (!speaker.password_hash) {
      return NextResponse.json(
        { error: 'Please set your password first. Contact admin for assistance.' },
        { status: 401 }
      )
    }

    // Verify password
    if (!verifyPassword(password, speaker.password_hash)) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    // Check email verification
    if (!speaker.email_verified) {
      return NextResponse.json(
        { error: 'Please verify your email address first' },
        { status: 401 }
      )
    }

    // Get the speaker_id - use speaker_id from accounts table if available, otherwise use id
    const speakerId = useAccountsTable ? speaker.speaker_id : speaker.id

    // Generate session token
    const sessionToken = Buffer.from(`speaker:${speakerId}:${Date.now()}`).toString('base64')

    return NextResponse.json({
      success: true,
      speaker: {
        id: speakerId,
        email: speaker.email,
        name: speaker.name
      },
      sessionToken
    })

  } catch (error) {
    console.error('Speaker login error:', error)
    return NextResponse.json(
      { error: 'Failed to authenticate speaker' },
      { status: 500 }
    )
  }
}

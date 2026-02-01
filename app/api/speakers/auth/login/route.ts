import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

// Password verification function (same as admin)
function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(':')
  const hashToVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return storedHash === hashToVerify
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Find speaker account by email
    const accounts = await sql`
      SELECT 
        sa.id,
        sa.speaker_id,
        sa.speaker_name,
        sa.speaker_email,
        sa.password_hash,
        sa.is_active,
        sa.profile_status,
        sa.email_verified,
        s.name as speaker_full_name,
        s.id as speaker_table_id
      FROM speaker_accounts sa
      LEFT JOIN speakers s ON sa.speaker_id = s.id
      WHERE LOWER(sa.speaker_email) = ${email.toLowerCase()}
      LIMIT 1
    `

    if (accounts.length === 0) {
      console.log('❌ Login failed: No account found for email:', email)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const account = accounts[0]
    console.log('✅ Account found:', {
      id: account.id,
      email: account.speaker_email,
      hasPassword: !!account.password_hash,
      isActive: account.is_active,
      emailVerified: account.email_verified,
      profileStatus: account.profile_status
    })

    // Check if account has a password
    if (!account.password_hash) {
      console.log('❌ Login failed: No password set')
      return NextResponse.json(
        { error: "Password not set. Please contact support." },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = verifyPassword(password, account.password_hash)
    console.log('🔐 Password verification result:', isValidPassword)

    if (!isValidPassword) {
      console.log('❌ Login failed: Invalid password')
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Check if account is active
    if (!account.is_active) {
      console.log('❌ Login failed: Account not active')
      return NextResponse.json(
        { error: "Account is not active. Please contact support." },
        { status: 403 }
      )
    }

    // Check if email is verified
    if (!account.email_verified) {
      console.log('❌ Login failed: Email not verified')
      return NextResponse.json(
        { error: "Please verify your email before logging in." },
        { status: 403 }
      )
    }

    // Check profile status
    if (account.profile_status !== 'approved') {
      console.log('❌ Login failed: Profile not approved, status:', account.profile_status)
      return NextResponse.json(
        { error: "Your profile is pending approval. Please wait for admin approval." },
        { status: 403 }
      )
    }

    // Update last login
    await sql`
      UPDATE speaker_accounts 
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = ${account.id}
    `

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: account.id,
        speakerId: account.speaker_id || account.speaker_table_id,
        email: account.speaker_email,
        name: account.speaker_name || account.speaker_full_name,
        type: 'speaker'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      token,
      speakerId: account.speaker_id || account.speaker_table_id,
      speakerName: account.speaker_name || account.speaker_full_name,
      email: account.speaker_email
    })

  } catch (error) {
    console.error("Speaker login error:", error)
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    )
  }
}
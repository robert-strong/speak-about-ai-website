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
    const { name, email, password, company, phone } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
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

    // Check if email already exists
    const existing = await sql`
      SELECT id FROM clients WHERE LOWER(email) = ${email.toLowerCase()}
    `

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = hashPassword(password)

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')

    // Create client
    const result = await sql`
      INSERT INTO clients (
        name,
        email,
        password_hash,
        company,
        phone,
        email_verification_token,
        email_verified,
        portal_enabled,
        is_active,
        source,
        created_at
      ) VALUES (
        ${name},
        ${email.toLowerCase()},
        ${passwordHash},
        ${company || null},
        ${phone || null},
        ${verificationToken},
        false,
        true,
        true,
        'self_registration',
        CURRENT_TIMESTAMP
      )
      RETURNING id, name, email, company
    `

    // TODO: Send verification email
    // await sendVerificationEmail(email, verificationToken)

    return NextResponse.json({
      success: true,
      message: "Account created successfully. Please check your email to verify your account.",
      client: {
        id: result[0].id,
        name: result[0].name,
        email: result[0].email,
        company: result[0].company
      }
    })

  } catch (error) {
    console.error("Client registration error:", error)
    return NextResponse.json(
      { error: "An error occurred during registration" },
      { status: 500 }
    )
  }
}

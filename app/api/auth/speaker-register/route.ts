import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { hashPassword, validatePassword, generateSecureToken } from '@/lib/password-utils'

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, confirmPassword } = await request.json()

    // Validate required fields
    if (!email || !password || !name || !confirmPassword) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please enter a valid email address' },
        { status: 400 }
      )
    }

    // Validate password match
    if (password !== confirmPassword) {
      return NextResponse.json(
        { error: 'Passwords do not match' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingSpeaker = await sql`
      SELECT id, email, active 
      FROM speakers 
      WHERE email = ${email.toLowerCase()}
      LIMIT 1
    `

    if (existingSpeaker.length > 0) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // Hash password
    const passwordHash = hashPassword(password)
    
    // Generate verification token
    const verificationToken = generateSecureToken()

    // Create new speaker account
    const [newSpeaker] = await sql`
      INSERT INTO speakers (
        email, 
        name, 
        password_hash, 
        verification_token,
        email_verified,
        active
      ) VALUES (
        ${email.toLowerCase()},
        ${name.trim()},
        ${passwordHash},
        ${verificationToken},
        false,
        true
      )
      RETURNING id, email, name
    `

    // In a real application, you would send an email verification here
    // For now, we'll return the verification token in development
    const response: any = {
      success: true,
      message: 'Account created successfully. Please verify your email address.',
      speaker: {
        id: newSpeaker.id,
        email: newSpeaker.email,
        name: newSpeaker.name
      }
    }

    // In development, include verification token for testing
    if (process.env.NODE_ENV === 'development') {
      response.verificationToken = verificationToken
      response.verificationUrl = `/api/auth/speaker-verify?token=${verificationToken}`
    }

    return NextResponse.json(response, { status: 201 })

  } catch (error) {
    console.error('Speaker registration error:', error)
    
    // Handle unique constraint violation
    if (error instanceof Error && error.message.includes('unique constraint')) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
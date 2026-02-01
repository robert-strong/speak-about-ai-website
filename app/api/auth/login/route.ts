import { NextRequest, NextResponse } from "next/server"
import { verifyPassword } from "@/lib/password-utils"
import { createToken } from "@/lib/jwt-utils"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for login attempts
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(request, `login:${clientId}`, 5, 15 * 60 * 1000) // 5 attempts per 15 minutes
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          error: "Too many login attempts. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        }, 
        { status: 429 }
      )
    }
    let body: any
    try {
      body = await request.json()
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError)
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      )
    }
    const { email, password } = body

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Get admin credentials from environment variables
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH
    
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) {
      console.error("Admin credentials not configured in environment variables")
      return NextResponse.json({ error: "Authentication service unavailable" }, { status: 503 })
    }

    // Add small delay to prevent brute force attacks
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Check credentials
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || !verifyPassword(password, ADMIN_PASSWORD_HASH)) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      )
    }

    // Generate secure JWT token (with error handling for missing JWT_SECRET)
    let sessionToken: string
    try {
      sessionToken = createToken({
        email: ADMIN_EMAIL,
        role: "admin"
      }, 24) // 24 hour expiration
    } catch (tokenError) {
      console.error("JWT token creation failed:", tokenError)
      return NextResponse.json(
        { error: "Authentication service configuration error" },
        { status: 503 }
      )
    }

    // Return success response
    const response = NextResponse.json({
      success: true,
      user: {
        email: ADMIN_EMAIL,
        name: "Admin User",
        role: "admin"
      },
      sessionToken
    })

    // Set HTTP-only cookie for additional security
    response.cookies.set('adminLoggedIn', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    response.cookies.set('adminSessionToken', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })

    return response

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
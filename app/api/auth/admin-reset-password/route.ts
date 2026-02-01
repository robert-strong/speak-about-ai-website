import { NextRequest, NextResponse } from "next/server"
import { hashPassword } from "@/lib/password-utils"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting for password reset attempts
    const clientId = getClientIdentifier(request)
    const rateLimit = checkRateLimit(request, `admin-reset:${clientId}`, 3, 30 * 60 * 1000) // 3 attempts per 30 minutes
    
    if (!rateLimit.success) {
      return NextResponse.json(
        { 
          error: "Too many reset attempts. Please try again later.",
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        }, 
        { status: 429 }
      )
    }

    const body = await request.json()
    const { email, newPassword, resetKey } = body

    // Validate input
    if (!email || !newPassword || !resetKey) {
      return NextResponse.json(
        { error: "Email, new password, and reset key are required" },
        { status: 400 }
      )
    }

    // Get admin credentials from environment variables
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL
    const ADMIN_RESET_KEY = process.env.ADMIN_RESET_KEY
    
    if (!ADMIN_EMAIL || !ADMIN_RESET_KEY) {
      console.error("Admin credentials not configured in environment variables")
      return NextResponse.json({ error: "Reset service unavailable" }, { status: 503 })
    }

    // Verify admin email and reset key
    if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase() || resetKey !== ADMIN_RESET_KEY) {
      return NextResponse.json(
        { error: "Invalid email or reset key" },
        { status: 401 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    // Generate new password hash
    const newPasswordHash = hashPassword(newPassword)

    // Return the new hash that needs to be set in environment variables
    return NextResponse.json({
      success: true,
      message: "Password hash generated successfully",
      newPasswordHash,
      instructions: [
        "1. Copy the newPasswordHash value below",
        "2. Update your ADMIN_PASSWORD_HASH environment variable with this value",
        "3. Restart your application",
        "4. You can then login with your new password"
      ]
    })

  } catch (error) {
    console.error("Admin password reset error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
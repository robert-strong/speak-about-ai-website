import { NextRequest, NextResponse } from "next/server"
import { verifyToken, createToken } from "@/lib/jwt-utils"

export async function POST(request: NextRequest) {
  try {
    // Get the current session token
    const authHeader = request.headers.get('authorization')
    let token: string | null = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    } else {
      token = request.cookies.get('adminSessionToken')?.value || null
    }

    if (!token) {
      return NextResponse.json(
        { error: 'No session token provided', code: 'NO_TOKEN' },
        { status: 401 }
      )
    }

    // Verify the current token with a 7-day grace period for expired tokens
    // This allows users to refresh their session even if the token expired recently
    // (e.g., after sleeping overnight or being away for a day)
    const SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60
    const payload = verifyToken(token, SEVEN_DAYS_IN_SECONDS)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json(
        { error: 'Invalid or expired session', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }

    // Create a new token with refreshed expiration (8 hours from now)
    // This prevents frequent logouts during active use
    const newToken = createToken({
      email: payload.email,
      role: 'admin'
    }, 8) // 8 hour expiration

    // Return the new token
    const response = NextResponse.json({
      success: true,
      sessionToken: newToken,
      expiresIn: 8 * 3600 // 8 hours in seconds
    })

    // Update the cookie
    response.cookies.set('adminSessionToken', newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/'
    })

    response.cookies.set('adminLoggedIn', 'true', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 8 * 60 * 60, // 8 hours
      path: '/'
    })

    return response

  } catch (error) {
    console.error("Session refresh error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

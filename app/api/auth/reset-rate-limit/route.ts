import { NextRequest, NextResponse } from "next/server"

// Access the rate limit store directly to clear it
const rateLimitStore = new Map()

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not available" }, { status: 404 })
  }

  // Clear all rate limits
  rateLimitStore.clear()
  
  return NextResponse.json({
    success: true,
    message: "Rate limits cleared"
  })
}
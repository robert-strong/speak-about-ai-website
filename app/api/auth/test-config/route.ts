import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const config = {
      adminEmailSet: !!process.env.ADMIN_EMAIL,
      adminPasswordHashSet: !!process.env.ADMIN_PASSWORD_HASH,
      jwtSecretSet: !!process.env.JWT_SECRET,
      databaseUrlSet: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
    }

    return NextResponse.json({
      success: true,
      config,
      message: "Configuration check completed"
    })

  } catch (error) {
    console.error("Config test error:", error)
    return NextResponse.json(
      { error: "Failed to check configuration" },
      { status: 500 }
    )
  }
}
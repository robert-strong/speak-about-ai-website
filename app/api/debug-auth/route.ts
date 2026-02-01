import { NextRequest, NextResponse } from "next/server"
import { verifyPassword } from "@/lib/password-utils"

export async function GET(request: NextRequest) {
  // Only allow in development for debugging
  if (process.env.NODE_ENV === 'production' && !request.headers.get('x-debug-key')) {
    return NextResponse.json({ error: "Not available" }, { status: 404 })
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH
  const JWT_SECRET = process.env.JWT_SECRET

  // Test password verification with the expected password
  let passwordTest = "Unable to test"
  if (ADMIN_PASSWORD_HASH) {
    try {
      const testPassword = "SpeakAboutAI2025!"
      const result = verifyPassword(testPassword, ADMIN_PASSWORD_HASH)
      passwordTest = result ? "✅ Password verification works" : "❌ Password doesn't match hash"
    } catch (error: any) {
      passwordTest = `❌ Error: ${error.message}`
    }
  }

  return NextResponse.json({
    status: "Debug Info",
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      hasAdminEmail: !!ADMIN_EMAIL,
      adminEmail: ADMIN_EMAIL ? ADMIN_EMAIL.substring(0, 5) + "***" : "NOT SET",
      hasPasswordHash: !!ADMIN_PASSWORD_HASH,
      passwordHashLength: ADMIN_PASSWORD_HASH?.length || 0,
      hasJwtSecret: !!JWT_SECRET,
      jwtSecretLength: JWT_SECRET?.length || 0
    },
    passwordVerification: passwordTest,
    issues: [
      !ADMIN_EMAIL && "ADMIN_EMAIL not set",
      !ADMIN_PASSWORD_HASH && "ADMIN_PASSWORD_HASH not set",
      !JWT_SECRET && "JWT_SECRET not set",
      ADMIN_PASSWORD_HASH && ADMIN_PASSWORD_HASH.includes('\\') && "Password hash contains backslashes (escape issue)",
      ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD_HASH.includes(':') && "Password hash missing colon separator"
    ].filter(Boolean)
  })
}
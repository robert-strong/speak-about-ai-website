import { NextRequest, NextResponse } from "next/server"
import { verifyPassword, hashPassword } from "@/lib/password-utils"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { password } = body

    if (!password) {
      return NextResponse.json({ error: "Password required" }, { status: 400 })
    }

    const ADMIN_EMAIL = process.env.ADMIN_EMAIL
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH

    // Generate a new hash for the provided password
    const newHash = hashPassword(password)
    
    // Verify against stored hash
    const isValid = ADMIN_PASSWORD_HASH ? verifyPassword(password, ADMIN_PASSWORD_HASH) : false
    
    // Test with common password
    const testPassword = "SpeakAboutAI2025!"
    const testHash = hashPassword(testPassword)
    const testValid = ADMIN_PASSWORD_HASH ? verifyPassword(testPassword, ADMIN_PASSWORD_HASH) : false

    return NextResponse.json({
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      adminEmailConfigured: !!ADMIN_EMAIL,
      adminHashConfigured: !!ADMIN_PASSWORD_HASH,
      hashLength: ADMIN_PASSWORD_HASH?.length || 0,
      providedPassword: password.substring(0, 3) + "***",
      isValidWithStoredHash: isValid,
      newHashForProvidedPassword: newHash,
      testPasswordResult: {
        password: "SpeakAboutAI2025!",
        isValid: testValid,
        testHash: testHash
      },
      suggestion: !isValid ? "Update ADMIN_PASSWORD_HASH in Vercel with the newHashForProvidedPassword value" : "Password is valid"
    })
  } catch (error) {
    return NextResponse.json({ error: "Test failed", details: error.message }, { status: 500 })
  }
}
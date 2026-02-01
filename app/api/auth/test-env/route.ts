import { NextRequest, NextResponse } from "next/server"
import { verifyPassword } from "@/lib/password-utils"

export async function GET(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: "Not available" }, { status: 404 })
  }

  const ADMIN_EMAIL = process.env.ADMIN_EMAIL
  const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH
  
  // Test password verification with a known password
  const testPassword = request.nextUrl.searchParams.get('password') || 'test'
  
  let verifyResult = false
  let verifyError = null
  
  try {
    if (ADMIN_PASSWORD_HASH) {
      verifyResult = verifyPassword(testPassword, ADMIN_PASSWORD_HASH)
    }
  } catch (error) {
    verifyError = error instanceof Error ? error.message : 'Unknown error'
  }

  return NextResponse.json({
    env_check: {
      admin_email_set: !!ADMIN_EMAIL,
      admin_email_value: ADMIN_EMAIL || 'NOT SET',
      password_hash_set: !!ADMIN_PASSWORD_HASH,
      hash_length: ADMIN_PASSWORD_HASH?.length || 0,
      hash_preview: ADMIN_PASSWORD_HASH ? ADMIN_PASSWORD_HASH.substring(0, 50) + '...' : 'NOT SET',
      node_env: process.env.NODE_ENV
    },
    verification_test: {
      tested_password: testPassword,
      result: verifyResult,
      error: verifyError
    }
  })
}
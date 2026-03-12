import { NextRequest, NextResponse } from "next/server"
import { hashPassword, verifyPassword, validatePassword } from "@/lib/password-utils"
import { verifyToken } from "@/lib/jwt-utils"
import { neon } from "@neondatabase/serverless"

export async function POST(request: NextRequest) {
  try {
    // Extract token from Authorization header or cookie
    let token: string | null = null
    const authHeader = request.headers.get("authorization")
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7)
    }
    if (!token) {
      token = request.cookies.get("adminSessionToken")?.value || null
    }

    if (!token) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
    }

    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json({ error: "Invalid request format" }, { status: 400 })
    }

    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Current password and new password are required" }, { status: 400 })
    }

    // Validate new password strength
    const validation = validatePassword(newPassword)
    if (!validation.valid) {
      return NextResponse.json({ error: validation.message }, { status: 400 })
    }

    const sql = neon(process.env.DATABASE_URL!)
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH

    // Check if user is the environment admin (for password verification purposes)
    const isEnvAdmin = ADMIN_EMAIL && ADMIN_PASSWORD_HASH &&
        payload.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()

    // Look up team member by email from JWT
    const members = await sql`
      SELECT id, password_hash
      FROM team_members
      WHERE LOWER(email) = LOWER(${payload.email})
    `

    // If team member exists, update their password
    if (members.length > 0) {
      const member = members[0]

      // Verify current password - accept either database password OR env admin password
      const dbPasswordValid = member.password_hash && verifyPassword(currentPassword, member.password_hash)
      const envPasswordValid = isEnvAdmin && verifyPassword(currentPassword, ADMIN_PASSWORD_HASH!)

      if (!dbPasswordValid && !envPasswordValid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 })
      }

      // Hash new password and update
      const newHash = hashPassword(newPassword)
      await sql`
        UPDATE team_members
        SET password_hash = ${newHash}, must_change_password = FALSE
        WHERE id = ${member.id}
      `

      return NextResponse.json({ success: true, message: "Password changed successfully" })
    }

    // No team member - if env admin only, they can't change password via UI
    if (isEnvAdmin) {
      return NextResponse.json({
        error: "Environment admin password must be changed via environment variables"
      }, { status: 400 })
    }

    // No valid account found
    return NextResponse.json({ error: "Account not found" }, { status: 404 })

  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

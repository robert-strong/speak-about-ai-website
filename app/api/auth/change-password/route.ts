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

    // Look up team member by email from JWT
    const members = await sql`
      SELECT id, password_hash
      FROM team_members
      WHERE LOWER(email) = LOWER(${payload.email})
    `

    if (members.length === 0) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 })
    }

    const member = members[0]

    // Verify current password
    if (!member.password_hash || !verifyPassword(currentPassword, member.password_hash)) {
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

  } catch (error) {
    console.error("Change password error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

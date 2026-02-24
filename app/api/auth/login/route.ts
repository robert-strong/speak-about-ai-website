import { NextRequest, NextResponse } from "next/server"
import { verifyPassword } from "@/lib/password-utils"
import { createToken } from "@/lib/jwt-utils"
import { checkRateLimit, getClientIdentifier } from "@/lib/rate-limiter"
import { neon } from "@neondatabase/serverless"

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

    // Add small delay to prevent brute force attacks
    await new Promise(resolve => setTimeout(resolve, 1000))

    // ---- Check 1: Environment admin (superadmin) ----
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL
    const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH

    if (ADMIN_EMAIL && ADMIN_PASSWORD_HASH &&
        email.toLowerCase() === ADMIN_EMAIL.toLowerCase() &&
        verifyPassword(password, ADMIN_PASSWORD_HASH)) {

      // Env admin gets all permissions
      const allPermissions = getAllPermissions()

      return buildLoginResponse({
        email: ADMIN_EMAIL,
        name: "Admin",
        role: "admin",
        role_name: "Admin Team",
        user_id: null,
        permissions: allPermissions,
      })
    }

    // ---- Check 2: Team member from database ----
    try {
      const sql = neon(process.env.DATABASE_URL!)
      const members = await sql`
        SELECT tm.id, tm.name, tm.email, tm.password_hash, tm.status,
               tm.must_change_password, tm.role_id,
               r.name as role_name, r.permissions as role_permissions
        FROM team_members tm
        LEFT JOIN roles r ON tm.role_id = r.id
        WHERE LOWER(tm.email) = LOWER(${email})
      `

      if (members.length > 0) {
        const member = members[0]

        // Check if account is active
        if (member.status !== 'active') {
          return NextResponse.json(
            { error: "Your account has been deactivated. Contact an administrator." },
            { status: 403 }
          )
        }

        // Verify password
        if (!member.password_hash || !verifyPassword(password, member.password_hash)) {
          return NextResponse.json(
            { error: "Invalid credentials" },
            { status: 401 }
          )
        }

        // Update last login
        await sql`UPDATE team_members SET last_login = NOW() WHERE id = ${member.id}`

        const permissions = member.role_permissions || {}

        return buildLoginResponse({
          email: member.email,
          name: member.name,
          role: "admin",
          role_name: member.role_name || "Team Member",
          user_id: member.id,
          permissions,
          must_change_password: member.must_change_password,
        })
      }
    } catch (dbError) {
      // If team_members table doesn't exist yet, just fall through to invalid credentials
      console.warn("Team member lookup failed (table may not exist):", dbError)
    }

    // ---- No match found ----
    return NextResponse.json(
      { error: "Invalid credentials" },
      { status: 401 }
    )

  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

function getAllPermissions(): Record<string, boolean> {
  return {
    master_panel: true, crm: true, contacts: true, projects: true,
    proposals: true, contracts: true, invoices: true, finances: true,
    page_editor: true, case_studies: true, speakers: true, analytics: true,
    workshops: true, newsletter: true, blog: true, vendor_directory: true,
    landing_resources: true, whatsapp: true, system: true, settings: true,
  }
}

function buildLoginResponse(user: {
  email: string
  name: string
  role: string
  role_name: string
  user_id: number | null
  permissions: Record<string, boolean>
  must_change_password?: boolean
}) {
  let sessionToken: string
  try {
    sessionToken = createToken({
      email: user.email,
      role: "admin"
    }, 24)
  } catch (tokenError) {
    console.error("JWT token creation failed:", tokenError)
    return NextResponse.json(
      { error: "Authentication service configuration error" },
      { status: 503 }
    )
  }

  const response = NextResponse.json({
    success: true,
    user: {
      email: user.email,
      name: user.name,
      role: user.role,
      role_name: user.role_name,
      user_id: user.user_id,
      permissions: user.permissions,
      must_change_password: user.must_change_password || false,
    },
    sessionToken
  })

  response.cookies.set('adminLoggedIn', 'true', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/'
  })

  response.cookies.set('adminSessionToken', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/'
  })

  return response
}

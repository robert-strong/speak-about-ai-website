import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { hashPassword } from '@/lib/password-utils'
import { randomBytes } from 'crypto'

const sql = neon(process.env.DATABASE_URL!)

// GET - List all team members with their roles
export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const members = await sql`
      SELECT
        tm.id, tm.name, tm.email, tm.role_id, tm.status,
        tm.last_login, tm.must_change_password, tm.created_by,
        tm.created_at, tm.updated_at,
        r.name as role_name, r.permissions as role_permissions
      FROM team_members tm
      LEFT JOIN roles r ON tm.role_id = r.id
      ORDER BY
        CASE WHEN tm.status = 'active' THEN 0 ELSE 1 END,
        tm.name ASC
    `

    // Also fetch available roles for the dropdown
    const roles = await sql`SELECT id, name FROM roles ORDER BY name`

    return NextResponse.json({ members, roles })
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      return NextResponse.json({
        members: [],
        roles: [],
        needs_migration: true
      })
    }
    console.error('Error fetching team members:', error)
    return NextResponse.json({ error: 'Failed to fetch team members' }, { status: 500 })
  }
}

// POST - Create a new team member
export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const { name, email, role_id, password } = await request.json()

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    // Generate temp password if none provided
    const tempPassword = password?.trim() || generateTempPassword()
    const passwordHash = hashPassword(tempPassword)

    const result = await sql`
      INSERT INTO team_members (name, email, password_hash, role_id, status, must_change_password, created_by)
      VALUES (
        ${name.trim()},
        ${email.trim().toLowerCase()},
        ${passwordHash},
        ${role_id || null},
        'active',
        TRUE,
        'admin'
      )
      RETURNING id, name, email, role_id, status, must_change_password, created_at
    `

    return NextResponse.json({
      member: result[0],
      temporary_password: tempPassword
    }, { status: 201 })
  } catch (error: any) {
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return NextResponse.json({ error: 'A team member with this email already exists' }, { status: 409 })
    }
    console.error('Error creating team member:', error)
    return NextResponse.json({ error: 'Failed to create team member' }, { status: 500 })
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  const bytes = randomBytes(12)
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length]
  }
  // Ensure it meets password requirements
  return password.slice(0, 4) + 'A' + 'a' + '1' + password.slice(7)
}

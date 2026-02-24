import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { hashPassword } from '@/lib/password-utils'
import { randomBytes } from 'crypto'

const sql = neon(process.env.DATABASE_URL!)

// PUT - Update a team member
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const { id } = await params

  try {
    const { name, email, role_id, status, reset_password } = await request.json()

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 })
    }

    let tempPassword: string | null = null

    if (reset_password) {
      // Generate new temp password
      const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
      const bytes = randomBytes(12)
      let pwd = ''
      for (let i = 0; i < 12; i++) {
        pwd += chars[bytes[i] % chars.length]
      }
      tempPassword = pwd.slice(0, 4) + 'A' + 'a' + '1' + pwd.slice(7)

      const passwordHash = hashPassword(tempPassword)
      const result = await sql`
        UPDATE team_members
        SET name = ${name.trim()},
            email = ${email.trim().toLowerCase()},
            role_id = ${role_id || null},
            status = ${status || 'active'},
            password_hash = ${passwordHash},
            must_change_password = TRUE,
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING id, name, email, role_id, status, must_change_password, updated_at
      `
      if (result.length === 0) {
        return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
      }
      return NextResponse.json({ member: result[0], temporary_password: tempPassword })
    }

    const result = await sql`
      UPDATE team_members
      SET name = ${name.trim()},
          email = ${email.trim().toLowerCase()},
          role_id = ${role_id || null},
          status = ${status || 'active'},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, email, role_id, status, must_change_password, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    return NextResponse.json({ member: result[0] })
  } catch (error: any) {
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return NextResponse.json({ error: 'A team member with this email already exists' }, { status: 409 })
    }
    console.error('Error updating team member:', error)
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 })
  }
}

// DELETE - Remove a team member
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const { id } = await params

  try {
    const result = await sql`
      DELETE FROM team_members WHERE id = ${id}
      RETURNING name, email
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, deleted: result[0].name })
  } catch (error) {
    console.error('Error deleting team member:', error)
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 })
  }
}

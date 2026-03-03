import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'

const sql = neon(process.env.DATABASE_URL!)

// Permission keys mapped to sidebar menu items
export const PERMISSION_KEYS = [
  { key: 'master_panel', label: 'Master Panel', section: 'standalone', description: 'Operations Hub dashboard' },
  { key: 'crm', label: 'CRM', section: 'Sales', description: 'Active Deals pipeline' },
  { key: 'contacts', label: 'Contacts', section: 'Sales', description: 'All Contacts database' },
  { key: 'projects', label: 'Project Management', section: 'Operations', description: 'Live Projects tracker' },
  { key: 'proposals', label: 'Proposals', section: 'Operations', description: 'Client Proposals' },
  { key: 'contracts', label: 'Contracts Hub', section: 'Operations', description: 'Contract Management' },
  { key: 'invoices', label: 'Invoices', section: 'Operations', description: 'Invoice Management' },
  { key: 'finances', label: 'Finances', section: 'Operations', description: 'Revenue & Commissions' },
  { key: 'page_editor', label: 'Page Editor', section: 'Website', description: 'Edit Page Content' },
  { key: 'case_studies', label: 'Case Studies', section: 'Website', description: 'Testimonials & Success Stories' },
  { key: 'speakers', label: 'Speaker Management', section: 'Website', description: 'Profiles & Content' },
  { key: 'analytics', label: 'Analytics', section: 'Website', description: 'Website Insights' },
  { key: 'workshops', label: 'Workshops', section: 'Website', description: 'Workshop Management' },
  { key: 'newsletter', label: 'Newsletter', section: 'Marketing', description: 'Subscriber Management' },
  { key: 'blog', label: 'Blog', section: 'Marketing', description: 'Content & Outrank' },
  { key: 'vendor_directory', label: 'Vendor Directory', section: 'Marketing', description: 'Vendor Management' },
  { key: 'landing_resources', label: 'Landing Resources', section: 'Marketing', description: 'Email Resources' },
  { key: 'whatsapp', label: 'WhatsApp Group', section: 'Marketing', description: 'Event Pro Community' },
  { key: 'google_ads', label: 'Google Ads', section: 'Marketing', description: 'Campaign Manager' },
  { key: 'system', label: 'System / Database', section: 'System', description: 'System Debug tools' },
  { key: 'settings', label: 'Settings', section: 'System', description: 'Admin Settings pages' },
]

export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const roles = await sql`
      SELECT id, name, description, permissions, is_default, created_at, updated_at
      FROM roles
      ORDER BY
        CASE WHEN name = 'Admin Team' THEN 0 ELSE 1 END,
        name ASC
    `

    return NextResponse.json({
      roles,
      permission_keys: PERMISSION_KEYS
    })
  } catch (error: any) {
    // If table doesn't exist, return empty with instructions
    if (error.message?.includes('does not exist')) {
      return NextResponse.json({
        roles: [],
        permission_keys: PERMISSION_KEYS,
        needs_migration: true,
        migration_hint: 'Run migration 014_create_roles_table.sql to create the roles table'
      })
    }
    console.error('Error fetching roles:', error)
    return NextResponse.json({ error: 'Failed to fetch roles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const { name, description, permissions } = await request.json()

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
    }

    // Validate permissions object
    const validKeys = PERMISSION_KEYS.map(p => p.key)
    const cleanPermissions: Record<string, boolean> = {}
    for (const key of validKeys) {
      cleanPermissions[key] = permissions?.[key] === true
    }

    const result = await sql`
      INSERT INTO roles (name, description, permissions)
      VALUES (${name.trim()}, ${description || ''}, ${JSON.stringify(cleanPermissions)})
      RETURNING id, name, description, permissions, is_default, created_at, updated_at
    `

    return NextResponse.json({ role: result[0] }, { status: 201 })
  } catch (error: any) {
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return NextResponse.json({ error: 'A role with this name already exists' }, { status: 409 })
    }
    console.error('Error creating role:', error)
    return NextResponse.json({ error: 'Failed to create role' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const { id, name, description, permissions } = await request.json()

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
    }

    // Validate permissions object
    const validKeys = PERMISSION_KEYS.map(p => p.key)
    const cleanPermissions: Record<string, boolean> = {}
    for (const key of validKeys) {
      cleanPermissions[key] = permissions?.[key] === true
    }

    const result = await sql`
      UPDATE roles
      SET name = ${name.trim()},
          description = ${description || ''},
          permissions = ${JSON.stringify(cleanPermissions)},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, description, permissions, is_default, created_at, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }

    return NextResponse.json({ role: result[0] })
  } catch (error: any) {
    if (error.message?.includes('unique') || error.message?.includes('duplicate')) {
      return NextResponse.json({ error: 'A role with this name already exists' }, { status: 409 })
    }
    console.error('Error updating role:', error)
    return NextResponse.json({ error: 'Failed to update role' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Role ID is required' }, { status: 400 })
    }

    // Prevent deleting default roles
    const role = await sql`SELECT is_default, name FROM roles WHERE id = ${id}`
    if (role.length === 0) {
      return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    }
    if (role[0].is_default) {
      return NextResponse.json({ error: 'Cannot delete the default admin role' }, { status: 403 })
    }

    await sql`DELETE FROM roles WHERE id = ${id}`

    return NextResponse.json({ success: true, deleted: role[0].name })
  } catch (error) {
    console.error('Error deleting role:', error)
    return NextResponse.json({ error: 'Failed to delete role' }, { status: 500 })
  }
}

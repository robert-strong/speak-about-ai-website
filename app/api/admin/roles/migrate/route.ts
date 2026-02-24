import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    // Create the roles table
    await sql`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        description TEXT,
        permissions JSONB NOT NULL DEFAULT '{}',
        is_default BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `

    // Insert default roles if they don't exist
    const defaultRoles = [
      {
        name: 'Admin Team',
        description: 'Full access to all areas of the admin dashboard',
        permissions: {
          master_panel: true, crm: true, contacts: true, projects: true,
          proposals: true, contracts: true, invoices: true, finances: true,
          page_editor: true, case_studies: true, speakers: true, analytics: true,
          workshops: true, newsletter: true, blog: true, vendor_directory: true,
          landing_resources: true, whatsapp: true, system: true, settings: true
        },
        is_default: true
      },
      {
        name: 'Sales Team',
        description: 'Access to CRM, contacts, proposals, and contracts',
        permissions: {
          master_panel: true, crm: true, contacts: true, projects: false,
          proposals: true, contracts: true, invoices: false, finances: false,
          page_editor: false, case_studies: false, speakers: true, analytics: false,
          workshops: false, newsletter: false, blog: false, vendor_directory: false,
          landing_resources: false, whatsapp: false, system: false, settings: false
        },
        is_default: false
      },
      {
        name: 'Web Developer',
        description: 'Access to website management and technical tools',
        permissions: {
          master_panel: true, crm: false, contacts: false, projects: false,
          proposals: false, contracts: false, invoices: false, finances: false,
          page_editor: true, case_studies: true, speakers: true, analytics: true,
          workshops: true, newsletter: false, blog: true, vendor_directory: true,
          landing_resources: true, whatsapp: false, system: true, settings: false
        },
        is_default: false
      },
      {
        name: 'Operations',
        description: 'Access to project management, contracts, and invoicing',
        permissions: {
          master_panel: true, crm: false, contacts: true, projects: true,
          proposals: true, contracts: true, invoices: true, finances: true,
          page_editor: false, case_studies: false, speakers: true, analytics: false,
          workshops: true, newsletter: false, blog: false, vendor_directory: true,
          landing_resources: false, whatsapp: false, system: false, settings: false
        },
        is_default: false
      },
      {
        name: 'Speaker Relations',
        description: 'Access to speaker management and related content',
        permissions: {
          master_panel: true, crm: false, contacts: true, projects: true,
          proposals: true, contracts: true, invoices: false, finances: false,
          page_editor: false, case_studies: true, speakers: true, analytics: false,
          workshops: true, newsletter: false, blog: false, vendor_directory: false,
          landing_resources: false, whatsapp: false, system: false, settings: false
        },
        is_default: false
      },
      {
        name: 'Marketing',
        description: 'Access to marketing tools, content, and analytics',
        permissions: {
          master_panel: true, crm: false, contacts: false, projects: false,
          proposals: false, contracts: false, invoices: false, finances: false,
          page_editor: false, case_studies: true, speakers: true, analytics: true,
          workshops: false, newsletter: true, blog: true, vendor_directory: true,
          landing_resources: true, whatsapp: true, system: false, settings: false
        },
        is_default: false
      },
      {
        name: 'Accountant',
        description: 'Access to financial data, invoices, and contracts',
        permissions: {
          master_panel: true, crm: false, contacts: false, projects: false,
          proposals: false, contracts: true, invoices: true, finances: true,
          page_editor: false, case_studies: false, speakers: false, analytics: false,
          workshops: false, newsletter: false, blog: false, vendor_directory: false,
          landing_resources: false, whatsapp: false, system: false, settings: false
        },
        is_default: false
      }
    ]

    for (const role of defaultRoles) {
      await sql`
        INSERT INTO roles (name, description, permissions, is_default)
        VALUES (${role.name}, ${role.description}, ${JSON.stringify(role.permissions)}, ${role.is_default})
        ON CONFLICT (name) DO NOTHING
      `
    }

    return NextResponse.json({ success: true, message: 'Roles table created and seeded with default roles' })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({ error: 'Failed to run migration' }, { status: 500 })
  }
}

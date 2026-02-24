import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'

const sql = neon(process.env.DATABASE_URL!)

// GET - Fetch email template by key
export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const templateKey = searchParams.get('key') || 'welcome_team_member'

  try {
    const rows = await sql`
      SELECT * FROM email_templates WHERE template_key = ${templateKey}
    `

    if (rows.length === 0) {
      return NextResponse.json({
        template: {
          template_key: templateKey,
          subject: 'Welcome to the {{company_name}} Team!',
          body_html: '',
        },
        is_new: true
      })
    }

    return NextResponse.json({ template: rows[0] })
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      return NextResponse.json({ template: null, needs_migration: true })
    }
    console.error('Error fetching email template:', error)
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}

// PUT - Update or create email template
export async function PUT(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const { template_key, subject, body_html } = await request.json()

    if (!template_key || !subject?.trim() || !body_html?.trim()) {
      return NextResponse.json({ error: 'Template key, subject, and body are required' }, { status: 400 })
    }

    const existing = await sql`
      SELECT id FROM email_templates WHERE template_key = ${template_key}
    `

    if (existing.length > 0) {
      await sql`
        UPDATE email_templates
        SET subject = ${subject.trim()},
            body_html = ${body_html},
            updated_at = NOW()
        WHERE template_key = ${template_key}
      `
    } else {
      await sql`
        INSERT INTO email_templates (template_key, subject, body_html)
        VALUES (${template_key}, ${subject.trim()}, ${body_html})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving email template:', error)
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
  }
}

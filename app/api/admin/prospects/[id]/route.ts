import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    const { id } = await params
    const body = await request.json()
    const { source, name, email, phone, company, linkedin } = body

    const sourceId = parseInt(id)
    if (isNaN(sourceId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    switch (source) {
      case 'Deal': {
        await sql`
          UPDATE deals SET
            client_name = ${name || ''},
            client_email = ${email || ''},
            client_phone = ${phone || ''},
            company = ${company || ''},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${sourceId}
        `
        break
      }
      case 'Form Submission': {
        await sql`
          UPDATE form_submissions SET
            name = ${name || ''},
            email = ${email || ''},
            phone = ${phone || ''},
            organization_name = ${company || ''},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${sourceId}
        `
        break
      }
      case 'Newsletter': {
        await sql`
          UPDATE newsletter_signups SET
            name = ${name || ''},
            email = ${email || ''},
            company = ${company || ''},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${sourceId}
        `
        break
      }
      case 'WhatsApp': {
        await sql`
          UPDATE whatsapp_applications SET
            full_name = ${name || ''},
            email = ${email || ''},
            phone_number = ${phone || ''},
            linkedin_url = ${linkedin || ''},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${sourceId}
        `
        break
      }
      default:
        return NextResponse.json({ error: 'Invalid source type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating contact:', error)
    return NextResponse.json(
      { error: 'Failed to update contact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source')

    const sourceId = parseInt(id)
    if (isNaN(sourceId)) {
      return NextResponse.json({ error: 'Invalid ID' }, { status: 400 })
    }

    switch (source) {
      case 'Deal':
        await sql`DELETE FROM deals WHERE id = ${sourceId}`
        break
      case 'Form Submission':
        await sql`DELETE FROM form_submissions WHERE id = ${sourceId}`
        break
      case 'Newsletter':
        await sql`DELETE FROM newsletter_signups WHERE id = ${sourceId}`
        break
      case 'WhatsApp':
        await sql`DELETE FROM whatsapp_applications WHERE id = ${sourceId}`
        break
      default:
        return NextResponse.json({ error: 'Invalid source type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contact:', error)
    return NextResponse.json(
      { error: 'Failed to delete contact', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

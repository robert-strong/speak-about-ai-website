import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)

    // Query all 4 data sources in parallel
    const [deals, formSubmissions, newsletter, whatsapp] = await Promise.all([
      sql`
        SELECT
          id, client_name, client_email, client_phone, company,
          event_title, status, deal_value, created_at
        FROM deals
        ORDER BY created_at DESC
      `.catch(() => []),

      sql`
        SELECT
          id, name, email, phone, organization_name,
          submission_type, status, created_at
        FROM form_submissions
        ORDER BY created_at DESC
      `.catch(() => []),

      sql`
        SELECT
          id, email, name, company, status, source, subscribed_at
        FROM newsletter_signups
        ORDER BY subscribed_at DESC
      `.catch(() => []),

      sql`
        SELECT
          id, full_name, email, phone_number, linkedin_url,
          primary_role, status, created_at
        FROM whatsapp_applications
        ORDER BY created_at DESC
      `.catch(() => [])
    ])

    // Map deals
    const dealProspects = deals.map((d: any) => {
      const statusLabel = d.status === 'won' ? 'Won' : d.status === 'lost' ? 'Lost' : d.status.charAt(0).toUpperCase() + d.status.slice(1)
      return {
        name: d.client_name || '',
        email: d.client_email || '',
        phone: d.client_phone || '',
        company: d.company || '',
        linkedin: '',
        source: 'Deal' as const,
        relationship: `${statusLabel} — ${d.event_title || 'Untitled'}`,
        deal_value: d.deal_value || null,
        date: d.created_at,
        status: d.status || '',
        source_id: d.id
      }
    })

    // Map form submissions
    const formProspects = formSubmissions.map((f: any) => {
      const statusLabel = f.status ? f.status.charAt(0).toUpperCase() + f.status.slice(1) : 'New'
      const typeLabel = f.submission_type || 'Inquiry'
      return {
        name: f.name || '',
        email: f.email || '',
        phone: f.phone || '',
        company: f.organization_name || '',
        linkedin: '',
        source: 'Form Submission' as const,
        relationship: `${statusLabel} — ${typeLabel}`,
        deal_value: null,
        date: f.created_at,
        status: f.status || 'new',
        source_id: f.id
      }
    })

    // Map newsletter
    const newsletterProspects = newsletter.map((n: any) => ({
      name: n.name || '',
      email: n.email || '',
      phone: '',
      company: n.company || '',
      linkedin: '',
      source: 'Newsletter' as const,
      relationship: n.status === 'active' ? 'Active Subscriber' : 'Unsubscribed',
      deal_value: null,
      date: n.subscribed_at,
      status: n.status || 'active',
      source_id: n.id
    }))

    // Map whatsapp
    const whatsappProspects = whatsapp.map((w: any) => {
      const statusLabel = w.status ? w.status.charAt(0).toUpperCase() + w.status.slice(1) : 'Pending'
      return {
        name: w.full_name || '',
        email: w.email || '',
        phone: w.phone_number || '',
        company: '',
        linkedin: w.linkedin_url || '',
        source: 'WhatsApp' as const,
        relationship: `${statusLabel} — ${w.primary_role || 'Unknown'}`,
        deal_value: null,
        date: w.created_at,
        status: w.status || 'pending',
        source_id: w.id
      }
    })

    const prospects = [
      ...dealProspects,
      ...formProspects,
      ...newsletterProspects,
      ...whatsappProspects
    ]

    // Sort by date descending
    prospects.sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0
      const dateB = b.date ? new Date(b.date).getTime() : 0
      return dateB - dateA
    })

    return NextResponse.json({
      success: true,
      prospects,
      stats: {
        total: prospects.length,
        deals: dealProspects.length,
        form_submissions: formProspects.length,
        newsletter: newsletterProspects.length,
        whatsapp: whatsappProspects.length
      }
    })
  } catch (error) {
    console.error('Error fetching prospects:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prospects' },
      { status: 500 }
    )
  }
}

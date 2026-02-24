import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()
    const { search } = body

    // Find the project by client name or project name, join deal for fallback email
    const projects = await sql`
      SELECT p.*,
        (SELECT COUNT(*) FROM invoices i WHERE i.project_id = p.id) as invoice_count,
        d.client_email as deal_client_email
      FROM projects p
      LEFT JOIN deals d ON p.deal_id = d.id
      WHERE p.client_name ILIKE ${'%' + search + '%'}
        OR p.project_name ILIKE ${'%' + search + '%'}
        OR p.company ILIKE ${'%' + search + '%'}
      ORDER BY p.created_at DESC
    `

    if (projects.length === 0) {
      return NextResponse.json({ error: 'No projects found matching search', search }, { status: 404 })
    }

    // Find projects missing invoices
    const missing = projects.filter((p: any) => Number(p.invoice_count) === 0)

    if (missing.length === 0) {
      return NextResponse.json({
        message: 'All matching projects already have invoices',
        projects: projects.map((p: any) => ({
          id: p.id,
          name: p.project_name,
          client: p.client_name,
          company: p.company,
          invoiceCount: Number(p.invoice_count),
          budget: p.budget,
          speakerFee: p.speaker_fee
        }))
      })
    }

    const created: any[] = []

    for (const project of missing) {
      const totalAmount = parseFloat(project.speaker_fee || project.budget || '0')
      if (totalAmount === 0) continue

      const clientEmail = project.client_email || project.deal_client_email || project.billing_contact_email || `${project.client_name.toLowerCase().replace(/\s+/g, '.')}@pending.info`
      const depositPercentage = 0.5
      const depositAmount = totalAmount * depositPercentage
      const finalAmount = totalAmount - depositAmount

      const depDate = new Date()
      const depYear = depDate.getFullYear()
      const depMonth = String(depDate.getMonth() + 1).padStart(2, '0')
      const depositInvoiceNumber = `INV-DEP-${depYear}${depMonth}-${project.id}`

      const [depositInvoice] = await sql`
        INSERT INTO invoices (
          project_id, invoice_number, invoice_type, amount, status,
          issue_date, due_date, description,
          client_name, client_email, client_company
        ) VALUES (
          ${project.id},
          ${depositInvoiceNumber},
          'deposit',
          ${depositAmount},
          'draft',
          CURRENT_TIMESTAMP,
          CURRENT_TIMESTAMP + INTERVAL '30 days',
          ${'Initial deposit (50% of total fee) for keynote presentation'},
          ${project.client_name},
          ${clientEmail},
          ${project.company}
        )
        RETURNING *
      `

      const finalInvoiceNumber = `INV-FIN-${depYear}${depMonth}-${project.id}`
      const eventDate = project.event_date || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

      const [finalInvoice] = await sql`
        INSERT INTO invoices (
          project_id, invoice_number, invoice_type, amount, status,
          issue_date, due_date, description,
          client_name, client_email, client_company,
          parent_invoice_id
        ) VALUES (
          ${project.id},
          ${finalInvoiceNumber},
          'final',
          ${finalAmount},
          'draft',
          CURRENT_TIMESTAMP,
          ${eventDate},
          ${'Final payment (50% of total fee) due on event date'},
          ${project.client_name},
          ${clientEmail},
          ${project.company},
          ${depositInvoice.id}
        )
        RETURNING *
      `

      created.push({
        projectId: project.id,
        projectName: project.project_name,
        clientName: project.client_name,
        totalAmount,
        depositInvoice: { id: depositInvoice.id, number: depositInvoiceNumber, amount: depositAmount },
        finalInvoice: { id: finalInvoice.id, number: finalInvoiceNumber, amount: finalAmount }
      })
    }

    return NextResponse.json({
      success: true,
      message: `Created invoice pairs for ${created.length} project(s)`,
      created
    })
  } catch (error) {
    console.error('Create missing invoice error:', error)
    return NextResponse.json({
      error: 'Failed to create missing invoices',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

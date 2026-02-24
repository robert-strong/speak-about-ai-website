import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request?: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Find ALL projects that don't have any invoices yet
    const projects = await sql`
      SELECT p.*,
        d.client_email as deal_client_email
      FROM projects p
      LEFT JOIN deals d ON p.deal_id = d.id
      WHERE NOT EXISTS (
        SELECT 1 FROM invoices i WHERE i.project_id = p.id
      )
      AND p.client_name IS NOT NULL
      ORDER BY p.created_at DESC
    `

    let created = 0
    let skipped = 0
    let errors = 0
    const createdInvoices: any[] = []
    const skippedProjects: any[] = []

    for (const project of projects) {
      try {
        const totalAmount = parseFloat(project.speaker_fee || project.budget || '0')
        if (totalAmount === 0) {
          skipped++
          skippedProjects.push({
            id: project.id,
            name: project.project_name,
            reason: 'No speaker fee or budget'
          })
          continue
        }

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

        await sql`
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
        `

        created++
        createdInvoices.push({
          projectId: project.id,
          projectName: project.project_name,
          clientName: project.client_name,
          status: project.status,
          totalAmount,
          deposit: depositAmount,
          final: finalAmount
        })
      } catch (err) {
        console.error(`Error creating invoices for project ${project.id} (${project.project_name}):`, err)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created invoice pairs for ${created} of ${projects.length} projects missing them.`,
      summary: { projectsChecked: projects.length, invoicePairsCreated: created, skipped, errors },
      createdInvoices,
      skippedProjects
    })
  } catch (error) {
    console.error('Backfill invoices error:', error)
    return NextResponse.json({
      error: 'Failed to backfill invoices',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET() {
  return POST()
}

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function POST() {
  try {
    // Step 1: Find projects that need invoices
    const projectsWithoutInvoices = await sql`
      SELECT p.id, p.project_name, p.client_name, p.client_email, p.company, p.budget
      FROM projects p
      LEFT JOIN invoices i ON i.project_id = p.id
      WHERE p.status IN (
        'contracts_signed',
        'logistics_planning',
        'pre_event',
        'event_week',
        'follow_up',
        'completed'
      )
      AND i.id IS NULL
      AND p.budget > 0
      AND p.client_name IS NOT NULL
      AND p.client_email IS NOT NULL
      ORDER BY p.created_at ASC
    `

    // Step 2: Get current invoice count for numbering
    const invoiceCountResult = await sql`SELECT COUNT(*) as count FROM invoices`
    let currentCount = Number(invoiceCountResult[0].count)

    // Step 3: Create invoices for each project
    const createdInvoices: { projectId: number; projectName: string; clientName: string; invoiceNumber: string; amount: number }[] = []
    const errors: { projectId: number; projectName: string; error: string }[] = []

    const today = new Date().toISOString().split('T')[0]
    const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    for (const project of projectsWithoutInvoices) {
      try {
        currentCount++
        const invoiceNumber = `INV-${String(Date.now()).slice(-6)}-${String(currentCount).padStart(3, '0')}`

        await sql`
          INSERT INTO invoices (
            project_id,
            invoice_number,
            client_name,
            client_email,
            company,
            amount,
            status,
            issue_date,
            due_date,
            notes
          ) VALUES (
            ${project.id},
            ${invoiceNumber},
            ${project.client_name},
            ${project.client_email},
            ${project.company || null},
            ${project.budget},
            'draft',
            ${today},
            ${dueDate},
            ${'Auto-generated invoice for ' + project.project_name}
          )
        `

        createdInvoices.push({
          projectId: project.id,
          projectName: project.project_name,
          clientName: project.client_name,
          invoiceNumber,
          amount: Number(project.budget)
        })
      } catch (err) {
        errors.push({
          projectId: project.id,
          projectName: project.project_name,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // Step 4: Return results
    return NextResponse.json({
      success: true,
      message: `Created ${createdInvoices.length} invoices for projects missing them.`,
      summary: {
        projectsWithoutInvoices: projectsWithoutInvoices.length,
        invoicesCreated: createdInvoices.length,
        errors: errors.length
      },
      createdInvoices,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Backfill invoices error:', error)
    return NextResponse.json({
      error: 'Backfill failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET for easy browser/testing access
export async function GET() {
  return POST()
}

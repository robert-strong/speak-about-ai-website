import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Get all invoices grouped by project, ordered by project and creation date
    const invoices = await sql`
      SELECT
        i.id,
        i.project_id,
        i.invoice_number,
        i.invoice_type,
        i.amount,
        i.status,
        i.client_name,
        i.client_email,
        i.description,
        i.parent_invoice_id,
        i.created_at,
        i.issue_date,
        i.due_date,
        p.project_name,
        p.status as project_status,
        p.speaker_fee,
        p.budget
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      ORDER BY i.project_id, i.created_at ASC
    `

    // Group by project_id
    const byProject: Record<number, any[]> = {}
    const noProject: any[] = []

    for (const inv of invoices) {
      if (inv.project_id) {
        if (!byProject[inv.project_id]) byProject[inv.project_id] = []
        byProject[inv.project_id].push(inv)
      } else {
        noProject.push(inv)
      }
    }

    // Identify duplicates: projects with more than one deposit or more than one final invoice
    const duplicateProjects: any[] = []
    const cleanProjects: any[] = []

    for (const [projectId, invs] of Object.entries(byProject)) {
      const deposits = invs.filter((i: any) => i.invoice_type === 'deposit')
      const finals = invs.filter((i: any) => i.invoice_type === 'final')
      const others = invs.filter((i: any) => !i.invoice_type || (i.invoice_type !== 'deposit' && i.invoice_type !== 'final'))

      if (deposits.length > 1 || finals.length > 1 || others.length > 0) {
        duplicateProjects.push({
          projectId: Number(projectId),
          projectName: invs[0].project_name,
          projectStatus: invs[0].project_status,
          totalInvoices: invs.length,
          deposits: deposits.map((d: any) => ({ id: d.id, number: d.invoice_number, amount: Number(d.amount), status: d.status, created: d.created_at })),
          finals: finals.map((f: any) => ({ id: f.id, number: f.invoice_number, amount: Number(f.amount), status: f.status, created: f.created_at, parentId: f.parent_invoice_id })),
          others: others.map((o: any) => ({ id: o.id, number: o.invoice_number, amount: Number(o.amount), status: o.status, type: o.invoice_type, created: o.created_at }))
        })
      } else {
        cleanProjects.push({
          projectId: Number(projectId),
          projectName: invs[0].project_name,
          invoiceCount: invs.length
        })
      }
    }

    return NextResponse.json({
      totalInvoices: invoices.length,
      totalProjects: Object.keys(byProject).length,
      projectsWithDuplicates: duplicateProjects.length,
      cleanProjects: cleanProjects.length,
      orphanedInvoices: noProject.length,
      duplicateProjects,
      orphanedInvoices_detail: noProject.map((i: any) => ({ id: i.id, number: i.invoice_number, amount: Number(i.amount), status: i.status, client: i.client_name }))
    })
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

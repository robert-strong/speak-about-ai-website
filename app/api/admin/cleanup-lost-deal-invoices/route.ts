import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Find all invoices linked to projects whose deals are lost
    const invoicesToDelete = await sql`
      SELECT i.id, i.invoice_number, i.amount, i.status as invoice_status, i.invoice_type,
        i.project_id, i.parent_invoice_id,
        p.project_name, p.deal_id, p.status as project_status,
        d.status as deal_status, d.event_title as deal_title
      FROM invoices i
      JOIN projects p ON i.project_id = p.id
      JOIN deals d ON p.deal_id = d.id
      WHERE d.status = 'lost'
      ORDER BY i.project_id, i.created_at
    `

    if (invoicesToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No invoices found for lost deals.',
        deleted: []
      })
    }

    const deleted: any[] = []
    let errors = 0

    // Clear parent references first
    for (const inv of invoicesToDelete) {
      try {
        await sql`UPDATE invoices SET parent_invoice_id = NULL WHERE parent_invoice_id = ${inv.id}`
      } catch (e) { /* ignore */ }
    }

    // Delete all
    for (const inv of invoicesToDelete) {
      try {
        await sql`DELETE FROM invoices WHERE id = ${inv.id}`
        deleted.push({
          id: inv.id,
          number: inv.invoice_number,
          amount: Number(inv.amount),
          type: inv.invoice_type,
          invoiceStatus: inv.invoice_status,
          projectId: inv.project_id,
          projectName: inv.project_name,
          dealStatus: inv.deal_status
        })
      } catch (e) {
        console.error(`Error deleting invoice ${inv.id}:`, e)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Deleted ${deleted.length} invoices from ${new Set(deleted.map(d => d.projectId)).size} projects linked to lost deals.`,
      summary: { invoicesDeleted: deleted.length, errors },
      deleted
    })
  } catch (error) {
    console.error('Cleanup lost deal invoices error:', error)
    return NextResponse.json({ error: 'Failed', details: error instanceof Error ? error.message : 'Unknown' }, { status: 500 })
  }
}

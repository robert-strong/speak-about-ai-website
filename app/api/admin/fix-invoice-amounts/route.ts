import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

/**
 * POST /api/admin/fix-invoice-amounts
 *
 * Updates existing invoice amounts to match their project's Total to Collect
 * (Deal Value + Travel Buyout). Deposit = 50%, Final = 50%.
 *
 * GET defaults to dry_run for browser preview.
 */
export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const url = new URL(request.url)
    const dryRun = url.searchParams.get('dry_run') === 'true'

    // Find all projects that have invoices, along with their financial data
    const projects = await sql`
      SELECT p.id, p.project_name, p.budget, p.travel_buyout,
             d.deal_value
      FROM projects p
      LEFT JOIN deals d ON p.deal_id = d.id
      WHERE EXISTS (SELECT 1 FROM invoices i WHERE i.project_id = p.id)
    `

    let updated = 0
    let skipped = 0
    const details: any[] = []

    for (const project of projects) {
      const dealValue = Number(project.budget) || Number(project.deal_value) || 0
      const travelBuyout = Number(project.travel_buyout) || 0
      const totalToCollect = dealValue + travelBuyout

      if (totalToCollect === 0) {
        skipped++
        details.push({
          action: 'skip', projectId: project.id,
          projectName: project.project_name, reason: 'Total to collect is 0'
        })
        continue
      }

      const depositAmount = totalToCollect * 0.5
      const finalAmount = totalToCollect - depositAmount

      // Get current invoices for this project
      const invoices = await sql`
        SELECT id, invoice_type, amount, invoice_number
        FROM invoices WHERE project_id = ${project.id}
        ORDER BY id ASC
      `

      let projectUpdated = false

      for (const inv of invoices) {
        const currentAmount = Number(inv.amount)
        let targetAmount: number

        if (inv.invoice_type === 'deposit') {
          targetAmount = depositAmount
        } else if (inv.invoice_type === 'final') {
          targetAmount = finalAmount
        } else {
          // Standard invoice — set to full total
          targetAmount = totalToCollect
        }

        if (Math.abs(currentAmount - targetAmount) < 0.01) continue // already correct

        if (!dryRun) {
          await sql`
            UPDATE invoices SET amount = ${targetAmount}, updated_at = NOW()
            WHERE id = ${inv.id}
          `
        }

        projectUpdated = true
        details.push({
          action: 'update_amount',
          projectId: project.id,
          projectName: project.project_name,
          invoiceId: inv.id,
          invoiceNumber: inv.invoice_number,
          invoiceType: inv.invoice_type || 'standard',
          oldAmount: currentAmount,
          newAmount: targetAmount,
          totalToCollect,
          breakdown: `Deal Value: ${dealValue} + Travel Buyout: ${travelBuyout}`
        })
      }

      if (projectUpdated) updated++
      else skipped++
    }

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        projectsChecked: projects.length,
        projectsUpdated: updated,
        skipped,
        invoicesAdjusted: details.filter(d => d.action === 'update_amount').length
      },
      details
    })
  } catch (error) {
    console.error('Fix invoice amounts error:', error)
    return NextResponse.json({
      error: 'Failed to fix invoice amounts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url)
  if (!url.searchParams.has('dry_run')) {
    url.searchParams.set('dry_run', 'true')
  }
  return POST(new NextRequest(url, { method: 'POST' }))
}

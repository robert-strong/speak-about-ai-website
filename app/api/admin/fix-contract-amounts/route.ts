import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

/**
 * POST /api/admin/fix-contract-amounts
 *
 * Updates existing contract fee_amount to match their project's Total to Collect
 * (Deal Value + Travel Buyout).
 *
 * GET defaults to dry_run for browser preview.
 */
export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const url = new URL(request.url)
    const dryRun = url.searchParams.get('dry_run') === 'true'

    // Find all contracts linked to projects
    const contracts = await sql`
      SELECT c.id, c.contract_number, c.fee_amount,
             p.id as project_id, p.project_name, p.budget, p.travel_buyout,
             d.deal_value
      FROM contracts c
      JOIN projects p ON c.project_id = p.id
      LEFT JOIN deals d ON p.deal_id = d.id
    `

    let updated = 0
    let skipped = 0
    const details: any[] = []

    for (const contract of contracts) {
      const dealValue = Number(contract.budget) || Number(contract.deal_value) || 0
      const travelBuyout = Number(contract.travel_buyout) || 0
      const totalToCollect = dealValue + travelBuyout
      const currentAmount = Number(contract.fee_amount) || 0

      if (totalToCollect === 0) {
        skipped++
        details.push({
          action: 'skip', contractId: contract.id,
          contractNumber: contract.contract_number,
          reason: 'Total to collect is 0'
        })
        continue
      }

      if (Math.abs(currentAmount - totalToCollect) < 0.01) {
        skipped++
        continue
      }

      if (!dryRun) {
        await sql`
          UPDATE contracts SET fee_amount = ${totalToCollect}, updated_at = NOW()
          WHERE id = ${contract.id}
        `
      }

      updated++
      details.push({
        action: 'update_amount',
        contractId: contract.id,
        contractNumber: contract.contract_number,
        projectId: contract.project_id,
        projectName: contract.project_name,
        oldAmount: currentAmount,
        newAmount: totalToCollect,
        breakdown: `Deal Value: ${dealValue} + Travel Buyout: ${travelBuyout}`
      })
    }

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        contractsChecked: contracts.length,
        contractsUpdated: updated,
        skipped
      },
      details
    })
  } catch (error) {
    console.error('Fix contract amounts error:', error)
    return NextResponse.json({
      error: 'Failed to fix contract amounts',
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

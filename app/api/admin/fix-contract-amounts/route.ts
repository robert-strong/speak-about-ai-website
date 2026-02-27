import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

/**
 * POST /api/admin/fix-contract-amounts
 *
 * Updates existing contract fee_amount to match their project's Total to Collect
 * (Deal Value + Travel Buyout). Matches contracts to projects via:
 *   1. project_id FK
 *   2. shared deal_id
 *   3. client_name + event_title fuzzy match (fallback)
 *
 * Also sets project_id on the contract when a match is found.
 * GET defaults to dry_run for browser preview.
 */
export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const url = new URL(request.url)
    const dryRun = url.searchParams.get('dry_run') === 'true'

    // Get all contracts
    const contracts = await sql`
      SELECT c.id, c.contract_number, c.fee_amount, c.deal_id, c.project_id,
             c.client_name, c.event_title
      FROM contracts c
      ORDER BY c.id
    `

    // Get all projects with financial data
    const projects = await sql`
      SELECT p.id, p.project_name, p.client_name, p.company, p.event_name,
             p.budget, p.travel_buyout, p.deal_id,
             d.deal_value
      FROM projects p
      LEFT JOIN deals d ON p.deal_id = d.id
    `

    let updated = 0
    let linked = 0
    let skipped = 0
    const details: any[] = []
    const processed = new Set<number>()

    for (const contract of contracts) {
      if (processed.has(contract.id)) continue
      processed.add(contract.id)

      // Find the best matching project
      let matchedProject: any = null

      // Method 1: direct project_id FK
      if (contract.project_id) {
        matchedProject = projects.find((p: any) => p.id === contract.project_id)
      }

      // Method 2: shared deal_id
      if (!matchedProject && contract.deal_id) {
        matchedProject = projects.find((p: any) => p.deal_id === contract.deal_id)
      }

      // Method 3: client_name + event_title match
      if (!matchedProject && contract.client_name && contract.event_title) {
        matchedProject = projects.find((p: any) =>
          p.client_name && p.event_name &&
          p.client_name.toLowerCase() === contract.client_name.toLowerCase() &&
          p.event_name.toLowerCase() === contract.event_title.toLowerCase()
        )
        // Try just client_name if event didn't match
        if (!matchedProject) {
          matchedProject = projects.find((p: any) =>
            p.client_name &&
            p.client_name.toLowerCase() === contract.client_name.toLowerCase() &&
            p.company &&
            contract.event_title.toLowerCase().includes(p.company.toLowerCase())
          )
        }
      }

      if (!matchedProject) {
        skipped++
        details.push({
          action: 'skip', contractId: contract.id,
          contractNumber: contract.contract_number,
          clientName: contract.client_name,
          eventTitle: contract.event_title,
          reason: 'No matching project found'
        })
        continue
      }

      const dealValue = Number(matchedProject.budget) || Number(matchedProject.deal_value) || 0
      const travelBuyout = Number(matchedProject.travel_buyout) || 0
      const totalToCollect = dealValue + travelBuyout
      const currentAmount = Number(contract.fee_amount) || 0

      // Link contract to project if not already linked
      if (!contract.project_id && matchedProject.id) {
        if (!dryRun) {
          await sql`
            UPDATE contracts SET project_id = ${matchedProject.id}, updated_at = NOW()
            WHERE id = ${contract.id}
          `
        }
        linked++
        details.push({
          action: 'link_to_project',
          contractId: contract.id,
          contractNumber: contract.contract_number,
          projectId: matchedProject.id,
          projectName: matchedProject.project_name
        })
      }

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
        projectId: matchedProject.id,
        projectName: matchedProject.project_name,
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
        contractsLinkedToProjects: linked,
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

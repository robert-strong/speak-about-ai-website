import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

/**
 * POST /api/admin/fix-entity-links
 *
 * Finds and fixes incorrectly linked entities:
 * 1. Multiple projects sharing the same deal_id (should be 1:1)
 * 2. Projects linked to deals where company/client don't match
 *
 * For each bad link: sets project.deal_id = NULL to disconnect it,
 * and also NULLs deal_id on any contracts/invoices that were linked
 * through that project.
 *
 * Pass ?dry_run=true to preview without making changes.
 */
export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const url = new URL(request.url)
    const dryRun = url.searchParams.get('dry_run') === 'true'

    const unlinked: any[] = []
    const suspicious: any[] = []

    // ─── Phase 1: Find deals with multiple projects ─────────────────────
    // A deal should map to at most one project. Multiple projects on the
    // same deal means the fuzzy matcher linked unrelated engagements.

    const multiProjectDeals = await sql`
      SELECT p.deal_id, COUNT(*) as project_count
      FROM projects p
      WHERE p.deal_id IS NOT NULL
      GROUP BY p.deal_id
      HAVING COUNT(*) > 1
      ORDER BY COUNT(*) DESC
    `

    for (const row of multiProjectDeals) {
      const dealId = row.deal_id

      // Get the deal info
      const deals = await sql`
        SELECT id, client_name, company, event_title, event_date
        FROM deals WHERE id = ${dealId}
      `
      const deal = deals[0]
      if (!deal) continue

      // Get all projects linked to this deal
      const projects = await sql`
        SELECT id, project_name, client_name, company, event_name, event_date, status
        FROM projects WHERE deal_id = ${dealId}
        ORDER BY created_at ASC
      `

      // Score each project against the deal to find the best match
      const scored = projects.map((p: any) => {
        let score = 0
        if (p.company && deal.company && p.company.toLowerCase() === deal.company.toLowerCase()) score += 3
        if (p.client_name && deal.client_name && p.client_name.toLowerCase() === deal.client_name.toLowerCase()) score += 2
        if (p.event_name && deal.event_title && p.event_name.toLowerCase() === deal.event_title.toLowerCase()) score += 1
        if (p.event_date && deal.event_date && String(p.event_date).split('T')[0] === String(deal.event_date).split('T')[0]) score += 1
        return { ...p, score }
      })

      // Keep the highest-scoring project, unlink the rest
      scored.sort((a: any, b: any) => b.score - a.score)
      const keeper = scored[0]

      for (let i = 1; i < scored.length; i++) {
        const project = scored[i]
        unlinked.push({
          action: 'unlink_project_from_shared_deal',
          projectId: project.id,
          projectName: project.project_name,
          company: project.company,
          eventName: project.event_name,
          dealId,
          dealCompany: deal.company,
          dealEvent: deal.event_title,
          reason: `Deal ${dealId} has ${scored.length} projects — keeping project ${keeper.id} (${keeper.company || keeper.client_name}), unlinking this one`,
          matchScore: project.score,
          keeperScore: keeper.score
        })

        if (!dryRun) {
          // Unlink the project from the deal
          await sql`UPDATE projects SET deal_id = NULL, updated_at = NOW() WHERE id = ${project.id}`
          // Unlink any contracts that were linked through this project's deal
          await sql`UPDATE contracts SET deal_id = NULL, updated_at = NOW() WHERE project_id = ${project.id} AND deal_id = ${dealId}`
          // Unlink any invoices that were linked through this project's deal
          await sql`UPDATE invoices SET deal_id = NULL, updated_at = NOW() WHERE project_id = ${project.id} AND deal_id = ${dealId}`
        }
      }
    }

    // ─── Phase 2: Find single-project deals with mismatched company ─────
    // Even 1:1 links can be wrong if the fuzzy matcher connected the wrong pair.

    const projectDealPairs = await sql`
      SELECT p.id as project_id, p.project_name, p.client_name as p_client,
             p.company as p_company, p.event_name as p_event, p.event_date as p_date,
             d.id as deal_id, d.client_name as d_client,
             d.company as d_company, d.event_title as d_event, d.event_date as d_date
      FROM projects p
      JOIN deals d ON p.deal_id = d.id
    `

    for (const pair of projectDealPairs) {
      // Check if company AND client are both mismatches — strong signal of bad link
      const companyMatch = !pair.p_company || !pair.d_company ||
        pair.p_company.toLowerCase() === pair.d_company.toLowerCase()
      const clientMatch = !pair.p_client || !pair.d_client ||
        pair.p_client.toLowerCase() === pair.d_client.toLowerCase()

      if (!companyMatch && !clientMatch) {
        unlinked.push({
          action: 'unlink_mismatched_project',
          projectId: pair.project_id,
          projectName: pair.project_name,
          projectCompany: pair.p_company,
          projectClient: pair.p_client,
          dealId: pair.deal_id,
          dealCompany: pair.d_company,
          dealClient: pair.d_client,
          reason: `Company AND client mismatch: project="${pair.p_company}/${pair.p_client}" vs deal="${pair.d_company}/${pair.d_client}"`
        })

        if (!dryRun) {
          await sql`UPDATE projects SET deal_id = NULL, updated_at = NOW() WHERE id = ${pair.project_id}`
          await sql`UPDATE contracts SET deal_id = NULL, updated_at = NOW() WHERE project_id = ${pair.project_id} AND deal_id = ${pair.deal_id}`
          await sql`UPDATE invoices SET deal_id = NULL, updated_at = NOW() WHERE project_id = ${pair.project_id} AND deal_id = ${pair.deal_id}`
        }
      } else if (!companyMatch || !clientMatch) {
        // One mismatch — flag as suspicious but don't auto-unlink
        suspicious.push({
          projectId: pair.project_id,
          projectName: pair.project_name,
          projectCompany: pair.p_company,
          projectClient: pair.p_client,
          dealId: pair.deal_id,
          dealCompany: pair.d_company,
          dealClient: pair.d_client,
          note: companyMatch ? 'Client name mismatch' : 'Company name mismatch'
        })
      }
    }

    return NextResponse.json({
      success: true,
      dryRun,
      summary: {
        entitiesUnlinked: unlinked.length,
        suspiciousLinks: suspicious.length
      },
      unlinked,
      suspicious
    })
  } catch (error) {
    console.error('Fix entity links error:', error)
    return NextResponse.json({
      error: 'Failed to fix entity links',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

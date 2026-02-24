import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

/**
 * Migration endpoint to create projects for all qualified/proposal deals that don't have one.
 * This backfills projects for deals that were moved to "qualified" or "proposal" status
 * before the auto-project-creation feature was implemented.
 *
 * - Qualified deals get a project with status 'qualified' and qualified stage_completion substeps.
 * - Proposal deals get a project with status 'proposal' and both qualified (all true) and proposal (all false) stage_completion substeps.
 */
export async function POST() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    const sql = neon(databaseUrl)

    // Step 1: Link existing projects to their deals via notes field (Deal ID: X)
    const linkedResults = await sql`
      UPDATE projects p
      SET deal_id = matched.deal_id
      FROM (
        SELECT p2.id as project_id, d.id as deal_id
        FROM projects p2
        JOIN deals d ON p2.notes LIKE '%Deal ID: ' || d.id || '%'
        WHERE p2.deal_id IS NULL
          AND d.status IN ('qualified', 'proposal')
      ) matched
      WHERE p.id = matched.project_id
      RETURNING p.id, p.deal_id
    `

    // Step 2: Find all qualified deals that don't have a corresponding project
    const qualifiedDealsWithoutProjects = await sql`
      SELECT d.*
      FROM deals d
      WHERE d.status = 'qualified'
        AND NOT EXISTS (
          SELECT 1 FROM projects p
          WHERE p.deal_id = d.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM projects p
          WHERE p.notes LIKE '%Deal ID: ' || d.id || '%'
        )
      ORDER BY d.created_at ASC
    `

    // Step 3: Find all proposal deals that don't have a corresponding project
    const proposalDealsWithoutProjects = await sql`
      SELECT d.*
      FROM deals d
      WHERE d.status = 'proposal'
        AND NOT EXISTS (
          SELECT 1 FROM projects p
          WHERE p.deal_id = d.id
        )
        AND NOT EXISTS (
          SELECT 1 FROM projects p
          WHERE p.notes LIKE '%Deal ID: ' || d.id || '%'
        )
      ORDER BY d.created_at ASC
    `

    const createdProjects = []
    const errors = []

    // Step 4: Create projects for each qualified deal
    for (const deal of qualifiedDealsWithoutProjects) {
      try {
        const eventType = deal.event_type || 'Other'
        const projectType = eventType === 'Workshop' ? 'Workshop' :
                           eventType === 'Keynote' ? 'Speaking' :
                           eventType === 'Consulting' ? 'Consulting' : 'Other'

        const eventClassification =
          (eventType.toLowerCase().includes('virtual') || eventType.toLowerCase().includes('webinar')) ? 'virtual' :
          (deal.event_location?.toLowerCase().includes('remote')) ? 'virtual' : 'local'

        const stageCompletion = JSON.stringify({
          qualified: {
            prioritized_reach_outs: false,
            correspondence_follow_ups: false
          }
        })

        const [project] = await sql`
          INSERT INTO projects (
            project_name,
            client_name,
            client_email,
            client_phone,
            company,
            project_type,
            description,
            status,
            priority,
            start_date,
            deadline,
            budget,
            spent,
            completion_percentage,
            event_name,
            event_date,
            event_location,
            event_type,
            attendee_count,
            requested_speaker_name,
            contact_person,
            notes,
            deal_id,
            event_classification,
            stage_completion
          ) VALUES (
            ${deal.event_title},
            ${deal.client_name},
            ${deal.client_email || null},
            ${deal.client_phone || null},
            ${deal.company || null},
            ${projectType},
            ${'Event: ' + deal.event_title + '\nLocation: ' + (deal.event_location || 'TBD') + '\nAttendees: ' + (deal.attendee_count || 0) + '\n\n' + (deal.notes || '')},
            ${'qualified'},
            ${deal.priority || 'medium'},
            ${deal.created_at ? new Date(deal.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]},
            ${deal.event_date || null},
            ${0},
            ${0},
            ${0},
            ${deal.event_title},
            ${deal.event_date ? new Date(deal.event_date).toISOString().split('T')[0] : null},
            ${deal.event_location || null},
            ${deal.event_type || null},
            ${deal.attendee_count || 0},
            ${deal.speaker_requested || null},
            ${deal.client_name},
            ${'Deal ID: ' + deal.id + '\nSource: ' + (deal.source || 'Unknown') + '\nBudget Range: ' + (deal.budget_range || 'N/A') + '\nOriginal notes: ' + (deal.notes || '') + '\n\n[Auto-created by qualified/proposal sync migration]'},
            ${deal.id},
            ${eventClassification},
            ${stageCompletion}
          )
          RETURNING id, project_name, deal_id, status
        `

        createdProjects.push({
          projectId: project.id,
          projectName: project.project_name,
          dealId: deal.id,
          dealTitle: deal.event_title,
          status: project.status,
          dealStatus: 'qualified'
        })
      } catch (err) {
        errors.push({
          dealId: deal.id,
          dealTitle: deal.event_title,
          dealStatus: 'qualified',
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // Step 5: Create projects for each proposal deal
    for (const deal of proposalDealsWithoutProjects) {
      try {
        const eventType = deal.event_type || 'Other'
        const projectType = eventType === 'Workshop' ? 'Workshop' :
                           eventType === 'Keynote' ? 'Speaking' :
                           eventType === 'Consulting' ? 'Consulting' : 'Other'

        const eventClassification =
          (eventType.toLowerCase().includes('virtual') || eventType.toLowerCase().includes('webinar')) ? 'virtual' :
          (deal.event_location?.toLowerCase().includes('remote')) ? 'virtual' : 'local'

        const stageCompletion = JSON.stringify({
          qualified: {
            prioritized_reach_outs: true,
            correspondence_follow_ups: true
          },
          proposal: {
            proposal_discussed: false,
            proposal_created: false,
            proposal_finished: false,
            proposal_sent: false,
            proposal_agreed: false
          }
        })

        const [project] = await sql`
          INSERT INTO projects (
            project_name,
            client_name,
            client_email,
            client_phone,
            company,
            project_type,
            description,
            status,
            priority,
            start_date,
            deadline,
            budget,
            spent,
            completion_percentage,
            event_name,
            event_date,
            event_location,
            event_type,
            attendee_count,
            requested_speaker_name,
            contact_person,
            notes,
            deal_id,
            event_classification,
            stage_completion
          ) VALUES (
            ${deal.event_title},
            ${deal.client_name},
            ${deal.client_email || null},
            ${deal.client_phone || null},
            ${deal.company || null},
            ${projectType},
            ${'Event: ' + deal.event_title + '\nLocation: ' + (deal.event_location || 'TBD') + '\nAttendees: ' + (deal.attendee_count || 0) + '\n\n' + (deal.notes || '')},
            ${'proposal'},
            ${deal.priority || 'medium'},
            ${deal.created_at ? new Date(deal.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]},
            ${deal.event_date || null},
            ${0},
            ${0},
            ${0},
            ${deal.event_title},
            ${deal.event_date ? new Date(deal.event_date).toISOString().split('T')[0] : null},
            ${deal.event_location || null},
            ${deal.event_type || null},
            ${deal.attendee_count || 0},
            ${deal.speaker_requested || null},
            ${deal.client_name},
            ${'Deal ID: ' + deal.id + '\nSource: ' + (deal.source || 'Unknown') + '\nBudget Range: ' + (deal.budget_range || 'N/A') + '\nOriginal notes: ' + (deal.notes || '') + '\n\n[Auto-created by qualified/proposal sync migration]'},
            ${deal.id},
            ${eventClassification},
            ${stageCompletion}
          )
          RETURNING id, project_name, deal_id, status
        `

        createdProjects.push({
          projectId: project.id,
          projectName: project.project_name,
          dealId: deal.id,
          dealTitle: deal.event_title,
          status: project.status,
          dealStatus: 'proposal'
        })
      } catch (err) {
        errors.push({
          dealId: deal.id,
          dealTitle: deal.event_title,
          dealStatus: 'proposal',
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // Step 6: Get final counts
    const [projectCount] = await sql`SELECT COUNT(*) as count FROM projects WHERE status != 'cancelled'`
    const [qualifiedDealCount] = await sql`SELECT COUNT(*) as count FROM deals WHERE status = 'qualified'`
    const [proposalDealCount] = await sql`SELECT COUNT(*) as count FROM deals WHERE status = 'proposal'`

    const qualifiedCreated = createdProjects.filter(p => p.dealStatus === 'qualified').length
    const proposalCreated = createdProjects.filter(p => p.dealStatus === 'proposal').length

    return NextResponse.json({
      success: true,
      message: `Sync completed. Created ${createdProjects.length} new projects (${qualifiedCreated} qualified, ${proposalCreated} proposal).`,
      summary: {
        qualifiedDeals: Number(qualifiedDealCount.count),
        proposalDeals: Number(proposalDealCount.count),
        totalProjects: Number(projectCount.count),
        existingProjectsLinked: linkedResults.length,
        newProjectsCreated: createdProjects.length,
        qualifiedProjectsCreated: qualifiedCreated,
        proposalProjectsCreated: proposalCreated,
        errors: errors.length
      },
      createdProjects,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Sync qualified/proposal deals to projects error:', error)
    return NextResponse.json({
      error: 'Sync failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET for easy browser/testing access
export async function GET() {
  return POST()
}

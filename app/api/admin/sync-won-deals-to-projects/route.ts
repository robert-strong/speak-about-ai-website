import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

/**
 * Migration endpoint to create projects for all won deals that don't have one.
 * This backfills projects for deals that were marked as "won" before the
 * auto-project-creation feature was implemented.
 *
 * Also links existing projects back to their deals via deal_id.
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
      ) matched
      WHERE p.id = matched.project_id
      RETURNING p.id, p.deal_id
    `

    // Step 2: Find all won deals that don't have a corresponding project
    const wonDealsWithoutProjects = await sql`
      SELECT d.*
      FROM deals d
      WHERE d.status = 'won'
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

    // Step 3: Create projects for each won deal without one
    const createdProjects = []
    const errors = []

    for (const deal of wonDealsWithoutProjects) {
      try {
        const dealValue = Number(deal.deal_value) || 0
        const commissionPercentage = Number(deal.commission_percentage) || 20
        const commissionAmount = Number(deal.commission_amount) || (dealValue * commissionPercentage / 100)
        const speakerFee = dealValue - commissionAmount

        const eventType = deal.event_type || 'Other'
        const projectType = eventType === 'Workshop' ? 'Workshop' :
                           eventType === 'Keynote' ? 'Speaking' :
                           eventType === 'Consulting' ? 'Consulting' : 'Other'

        const eventClassification =
          (eventType.toLowerCase().includes('virtual') || eventType.toLowerCase().includes('webinar')) ? 'virtual' :
          (deal.event_location?.toLowerCase().includes('remote')) ? 'virtual' : 'local'

        // Determine the project status based on the deal's state
        // If the deal has payment info, it's further along
        let status = 'contracts_signed'
        if (deal.payment_status === 'paid') {
          status = 'completed'
        } else if (deal.invoice_number || deal.payment_status === 'partial') {
          status = 'invoicing'
        }

        const stageCompletion = JSON.stringify({
          contracts_signed: {
            prepare_client_contract: false,
            send_contract_to_client: false,
            client_contract_signed: false,
            prepare_speaker_agreement: false,
            obtain_speaker_signature: false,
            file_all_signed_contracts: false
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
            speaker_fee,
            commission_percentage,
            commission_amount,
            notes,
            billing_contact_name,
            billing_contact_email,
            billing_contact_phone,
            requested_speaker_name,
            deal_id,
            payment_status,
            payment_date,
            invoice_number,
            event_classification,
            contact_person,
            stage_completion
          ) VALUES (
            ${deal.event_title},
            ${deal.client_name},
            ${deal.client_email || null},
            ${deal.client_phone || null},
            ${deal.company || null},
            ${projectType},
            ${'Event: ' + deal.event_title + '\nLocation: ' + (deal.event_location || 'TBD') + '\nAttendees: ' + (deal.attendee_count || 0) + '\n\n' + (deal.notes || '')},
            ${status},
            ${deal.priority || 'medium'},
            ${deal.won_date ? new Date(deal.won_date).toISOString().split('T')[0] : deal.created_at ? new Date(deal.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]},
            ${deal.event_date || null},
            ${dealValue},
            ${0},
            ${0},
            ${deal.event_title},
            ${deal.event_date ? new Date(deal.event_date).toISOString().split('T')[0] : null},
            ${deal.event_location || null},
            ${deal.event_type || null},
            ${deal.attendee_count || 0},
            ${speakerFee},
            ${commissionPercentage},
            ${commissionAmount},
            ${'Deal ID: ' + deal.id + '\nSource: ' + (deal.source || 'Unknown') + '\nBudget Range: ' + (deal.budget_range || 'N/A') + '\nOriginal notes: ' + (deal.notes || '') + '\n\n[Auto-created by sync migration]'},
            ${deal.client_name},
            ${deal.client_email || null},
            ${deal.client_phone || null},
            ${deal.speaker_requested || null},
            ${deal.id},
            ${deal.payment_status || 'pending'},
            ${deal.payment_date || null},
            ${deal.invoice_number || null},
            ${eventClassification},
            ${deal.client_name},
            ${stageCompletion}
          )
          RETURNING id, project_name, deal_id, status
        `

        createdProjects.push({
          projectId: project.id,
          projectName: project.project_name,
          dealId: deal.id,
          dealTitle: deal.event_title,
          status: project.status
        })
      } catch (err) {
        errors.push({
          dealId: deal.id,
          dealTitle: deal.event_title,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // Step 4: Get final counts
    const [projectCount] = await sql`SELECT COUNT(*) as count FROM projects WHERE status != 'cancelled'`
    const [wonDealCount] = await sql`SELECT COUNT(*) as count FROM deals WHERE status = 'won'`

    return NextResponse.json({
      success: true,
      message: `Sync completed. Created ${createdProjects.length} new projects from won deals.`,
      summary: {
        wonDeals: Number(wonDealCount.count),
        totalProjects: Number(projectCount.count),
        existingProjectsLinked: linkedResults.length,
        newProjectsCreated: createdProjects.length,
        errors: errors.length
      },
      createdProjects,
      errors: errors.length > 0 ? errors : undefined
    })
  } catch (error) {
    console.error('Sync won deals to projects error:', error)
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

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

/**
 * Sync missing data between deals and their linked projects.
 *
 * Step 1: Match speaker names to speaker IDs
 * Step 2: Sync speaker_requested from deals to projects
 * Step 3: Sync travel data from deals to projects
 * Step 4: Sync deal_value to project budget where missing
 * Step 5: Sync speaker_fee/commission where missing
 */
export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // -------------------------------------------------------
    // Step 1: Match speaker names to speaker IDs
    // -------------------------------------------------------
    // Find projects where speaker_id is NULL but requested_speaker_name exists,
    // then try to match against the speakers table by name (case-insensitive).
    const projectsNeedingSpeakerId = await sql`
      SELECT p.id, p.requested_speaker_name
      FROM projects p
      WHERE p.speaker_id IS NULL
        AND p.requested_speaker_name IS NOT NULL
        AND p.requested_speaker_name != ''
    `

    let speakerIdsMatched = 0
    const speakerMatchErrors: { projectId: number; name: string; error: string }[] = []

    for (const project of projectsNeedingSpeakerId) {
      try {
        const matchingSpeakers = await sql`
          SELECT id, name
          FROM speakers
          WHERE name ILIKE ${project.requested_speaker_name}
          LIMIT 1
        `

        if (matchingSpeakers.length > 0) {
          await sql`
            UPDATE projects
            SET speaker_id = ${matchingSpeakers[0].id},
                updated_at = NOW()
            WHERE id = ${project.id}
          `
          speakerIdsMatched++
        }
      } catch (err) {
        speakerMatchErrors.push({
          projectId: project.id,
          name: project.requested_speaker_name,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // -------------------------------------------------------
    // Step 2: Sync speaker_requested from deals to projects
    // -------------------------------------------------------
    // Find projects linked to deals where the project has no requested_speaker_name
    // but the deal has speaker_requested.
    const speakerNameSyncResult = await sql`
      UPDATE projects p
      SET requested_speaker_name = d.speaker_requested,
          updated_at = NOW()
      FROM deals d
      WHERE p.deal_id = d.id
        AND p.deal_id IS NOT NULL
        AND (p.requested_speaker_name IS NULL OR p.requested_speaker_name = '')
        AND d.speaker_requested IS NOT NULL
        AND d.speaker_requested != ''
      RETURNING p.id
    `
    const speakerNamesSynced = speakerNameSyncResult.length

    // -------------------------------------------------------
    // Step 3: Sync travel data from deals to projects
    // -------------------------------------------------------
    // Find projects linked to deals where the deal has travel data but the project
    // does not. Sync travel_required, travel_stipend -> travel_buyout, and
    // travel_notes -> append to project notes.

    const projectsNeedingTravel = await sql`
      SELECT
        p.id as project_id,
        p.travel_required as project_travel_required,
        p.travel_buyout as project_travel_buyout,
        p.notes as project_notes,
        d.travel_required as deal_travel_required,
        d.travel_stipend as deal_travel_stipend,
        d.travel_notes as deal_travel_notes
      FROM projects p
      JOIN deals d ON p.deal_id = d.id
      WHERE p.deal_id IS NOT NULL
        AND (
          (d.travel_required = true AND (p.travel_required IS NULL OR p.travel_required = false))
          OR (d.travel_stipend IS NOT NULL AND d.travel_stipend > 0 AND (p.travel_buyout IS NULL OR p.travel_buyout = 0))
          OR (d.travel_notes IS NOT NULL AND d.travel_notes != '' AND (p.notes IS NULL OR p.notes NOT LIKE '%' || d.travel_notes || '%'))
        )
    `

    let travelDataSynced = 0
    const travelSyncErrors: { projectId: number; error: string }[] = []

    for (const row of projectsNeedingTravel) {
      try {
        const travelRequired = row.deal_travel_required === true
        const dealStipend = Number(row.deal_travel_stipend) || 0
        const dealTravelNotes = row.deal_travel_notes || ''
        const projectNotes = row.project_notes || ''

        // Build updated notes if deal has travel notes not already in project
        let newNotes = projectNotes
        if (dealTravelNotes && !projectNotes.includes(dealTravelNotes)) {
          newNotes = projectNotes
            ? projectNotes + '\n\n[Travel Notes from Deal]: ' + dealTravelNotes
            : '[Travel Notes from Deal]: ' + dealTravelNotes
        }

        await sql`
          UPDATE projects
          SET travel_required = CASE
                WHEN ${travelRequired} = true THEN true
                ELSE travel_required
              END,
              travel_buyout = CASE
                WHEN (travel_buyout IS NULL OR travel_buyout = 0) AND ${dealStipend} > 0
                THEN ${dealStipend}
                ELSE travel_buyout
              END,
              notes = ${newNotes},
              updated_at = NOW()
          WHERE id = ${row.project_id}
        `
        travelDataSynced++
      } catch (err) {
        travelSyncErrors.push({
          projectId: row.project_id,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // -------------------------------------------------------
    // Step 4: Sync deal_value to project budget where missing
    // -------------------------------------------------------
    const budgetSyncResult = await sql`
      UPDATE projects p
      SET budget = d.deal_value,
          updated_at = NOW()
      FROM deals d
      WHERE p.deal_id = d.id
        AND p.deal_id IS NOT NULL
        AND (p.budget IS NULL OR p.budget = 0)
        AND d.deal_value IS NOT NULL
        AND d.deal_value > 0
      RETURNING p.id
    `
    const budgetsSynced = budgetSyncResult.length

    // -------------------------------------------------------
    // Step 5: Sync speaker_fee/commission where missing
    // -------------------------------------------------------
    // Find projects with deal_id where speaker_fee is missing but budget > 0.
    // Use deal commission data if available, otherwise default to 20%.
    const projectsNeedingFees = await sql`
      SELECT
        p.id as project_id,
        p.budget as project_budget,
        d.commission_percentage as deal_commission_percentage,
        d.commission_amount as deal_commission_amount
      FROM projects p
      JOIN deals d ON p.deal_id = d.id
      WHERE p.deal_id IS NOT NULL
        AND (p.speaker_fee IS NULL OR p.speaker_fee = 0)
        AND p.budget IS NOT NULL
        AND p.budget > 0
    `

    let feesSynced = 0
    const feeSyncErrors: { projectId: number; error: string }[] = []

    for (const row of projectsNeedingFees) {
      try {
        const budget = Number(row.project_budget)
        const dealCommissionPct = row.deal_commission_percentage != null
          ? Number(row.deal_commission_percentage)
          : null
        const dealCommissionAmt = row.deal_commission_amount != null
          ? Number(row.deal_commission_amount)
          : null

        let commissionPercentage: number
        let commissionAmount: number
        let speakerFee: number

        if (dealCommissionPct != null && dealCommissionPct > 0) {
          // Use deal's commission data
          commissionPercentage = dealCommissionPct
          commissionAmount = dealCommissionAmt != null && dealCommissionAmt > 0
            ? dealCommissionAmt
            : budget * (commissionPercentage / 100)
          speakerFee = budget - commissionAmount
        } else {
          // Default to 20%
          commissionPercentage = 20
          commissionAmount = budget * 0.20
          speakerFee = budget - commissionAmount
        }

        await sql`
          UPDATE projects
          SET speaker_fee = ${speakerFee},
              commission_percentage = ${commissionPercentage},
              commission_amount = ${commissionAmount},
              updated_at = NOW()
          WHERE id = ${row.project_id}
        `
        feesSynced++
      } catch (err) {
        feeSyncErrors.push({
          projectId: row.project_id,
          error: err instanceof Error ? err.message : 'Unknown error'
        })
      }
    }

    // -------------------------------------------------------
    // Build response
    // -------------------------------------------------------
    const allErrors = [
      ...speakerMatchErrors.map(e => ({ step: 'speaker_id_match', ...e })),
      ...travelSyncErrors.map(e => ({ step: 'travel_sync', ...e })),
      ...feeSyncErrors.map(e => ({ step: 'fee_sync', ...e }))
    ]

    return NextResponse.json({
      success: true,
      message: `Sync completed. Matched ${speakerIdsMatched} speaker IDs, synced ${speakerNamesSynced} speaker names, ${travelDataSynced} travel records, ${budgetsSynced} budgets, and ${feesSynced} speaker fees.`,
      counts: {
        step1_speaker_ids_matched: speakerIdsMatched,
        step1_projects_checked: projectsNeedingSpeakerId.length,
        step2_speaker_names_synced: speakerNamesSynced,
        step3_travel_data_synced: travelDataSynced,
        step3_travel_projects_checked: projectsNeedingTravel.length,
        step4_budgets_synced: budgetsSynced,
        step5_fees_synced: feesSynced,
        step5_projects_checked: projectsNeedingFees.length,
        total_errors: allErrors.length
      },
      errors: allErrors.length > 0 ? allErrors : undefined
    })
  } catch (error) {
    console.error('Sync deal data to projects error:', error)
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

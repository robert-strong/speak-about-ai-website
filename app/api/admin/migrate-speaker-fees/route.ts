import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// GET: Preview what would be updated
// POST: Actually perform the update
export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Get all projects with their commission rate
    // Priority: project's own commission_percentage > linked deal's > default 20%
    // commission_percentage is what we (the bureau) keep
    // So speaker_fee = budget * (1 - commission_percentage/100)
    const projects = await sql`
      SELECT
        p.id,
        p.project_name,
        p.budget,
        p.speaker_fee as current_speaker_fee,
        p.speaker_id,
        p.deal_id,
        p.commission_percentage as project_commission,
        d.commission_percentage as deal_commission,
        s.name as speaker_name,
        COALESCE(p.commission_percentage, d.commission_percentage, 20) as effective_commission,
        p.budget * (1 - COALESCE(p.commission_percentage, d.commission_percentage, 20) / 100.0) as calculated_speaker_fee,
        p.budget * COALESCE(p.commission_percentage, d.commission_percentage, 20) / 100.0 as calculated_commission
      FROM projects p
      LEFT JOIN speakers s ON s.id = p.speaker_id
      LEFT JOIN deals d ON d.id = p.deal_id
      WHERE p.status != 'cancelled'
        AND p.budget > 0
      ORDER BY p.id DESC
    `

    const summary = {
      total_projects: projects.length,
      projects_with_deal: projects.filter(p => p.deal_id).length,
      projects_with_project_commission: projects.filter(p => p.project_commission).length,
      projects_with_deal_commission: projects.filter(p => !p.project_commission && p.deal_commission).length,
      projects_using_default: projects.filter(p => !p.project_commission && !p.deal_commission).length,
      projects_needing_update: projects.filter(p =>
        Math.abs((p.current_speaker_fee || 0) - p.calculated_speaker_fee) > 0.01
      ).length,
      total_current_speaker_fees: projects.reduce((sum, p) => sum + (Number(p.current_speaker_fee) || 0), 0),
      total_calculated_speaker_fees: projects.reduce((sum, p) => sum + Number(p.calculated_speaker_fee), 0),
      total_commission: projects.reduce((sum, p) => sum + Number(p.calculated_commission), 0)
    }

    return NextResponse.json({
      preview: true,
      projects: projects.map(p => ({
        id: p.id,
        project_name: p.project_name,
        speaker_name: p.speaker_name || 'No speaker assigned',
        budget: Number(p.budget),
        current_speaker_fee: Number(p.current_speaker_fee) || 0,
        project_commission: p.project_commission ? Number(p.project_commission) : null,
        deal_commission: p.deal_commission ? Number(p.deal_commission) : null,
        effective_commission: Number(p.effective_commission),
        calculated_speaker_fee: Math.round(Number(p.calculated_speaker_fee) * 100) / 100,
        calculated_commission: Math.round(Number(p.calculated_commission) * 100) / 100,
        needs_update: Math.abs((Number(p.current_speaker_fee) || 0) - Number(p.calculated_speaker_fee)) > 0.01
      })),
      summary
    })

  } catch (error) {
    console.error('Error previewing migration:', error)
    return NextResponse.json({
      error: 'Failed to preview migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()

    // Optional: only update specific project IDs
    const projectIds = body.projectIds as number[] | undefined

    // Default commission rate if no commission data exists
    const defaultCommissionRate = body.defaultCommissionRate || 20

    // Update all projects with calculated speaker fees
    // Priority: project's commission_percentage > deal's commission_percentage > default
    let result
    if (projectIds && projectIds.length > 0) {
      // Update specific projects
      result = await sql`
        UPDATE projects p
        SET speaker_fee = p.budget * (1 - COALESCE(
          p.commission_percentage,
          (SELECT d.commission_percentage FROM deals d WHERE d.id = p.deal_id),
          ${defaultCommissionRate}
        ) / 100.0),
        updated_at = CURRENT_TIMESTAMP
        WHERE p.id = ANY(${projectIds})
          AND p.status != 'cancelled'
          AND p.budget > 0
        RETURNING p.id, p.project_name, p.budget, p.speaker_fee
      `
    } else {
      // Update all projects
      result = await sql`
        UPDATE projects p
        SET speaker_fee = p.budget * (1 - COALESCE(
          p.commission_percentage,
          (SELECT d.commission_percentage FROM deals d WHERE d.id = p.deal_id),
          ${defaultCommissionRate}
        ) / 100.0),
        updated_at = CURRENT_TIMESTAMP
        WHERE p.status != 'cancelled'
          AND p.budget > 0
        RETURNING p.id, p.project_name, p.budget, p.speaker_fee
      `
    }

    return NextResponse.json({
      success: true,
      updated_count: result.length,
      projects: result.map(p => ({
        id: p.id,
        project_name: p.project_name,
        budget: Number(p.budget),
        new_speaker_fee: Number(p.speaker_fee),
        new_commission: Number(p.budget) - Number(p.speaker_fee)
      }))
    })

  } catch (error) {
    console.error('Error running migration:', error)
    return NextResponse.json({
      error: 'Failed to run migration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

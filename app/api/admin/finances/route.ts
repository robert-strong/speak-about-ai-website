import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Get all projects with financial data (excluding cancelled)
    // Projects are now the single source of truth for payment tracking
    const projects = await sql`
      SELECT
        p.id,
        p.project_name,
        p.client_name,
        p.client_email,
        p.company,
        p.event_name,
        p.event_date,
        p.status,
        p.budget,
        p.speaker_fee,
        p.commission_percentage,
        p.commission_amount,
        p.travel_buyout,
        p.payment_status,
        p.payment_date,
        p.speaker_payment_status,
        p.speaker_payment_date,
        p.invoice_number,
        p.purchase_order_number,
        p.payment_terms,
        p.notes,
        p.deal_id,
        p.created_at,
        s.name as speaker_name
      FROM projects p
      LEFT JOIN speakers s ON s.id = p.speaker_id
      WHERE p.status != 'cancelled'
      ORDER BY p.event_date DESC NULLS LAST
    `

    // Transform and calculate financial metrics for each project
    const transformedProjects = projects.map(project => {
      const budget = Number(project.budget) || 0
      const speakerFee = Number(project.speaker_fee) || 0
      const travelBuyout = Number(project.travel_buyout) || 0
      const commissionPercentage = Number(project.commission_percentage) || 20
      const storedCommission = Number(project.commission_amount) || 0

      // Travel buyout is paid by client ON TOP of the deal value, then passed through to speaker
      // Total to collect from client = deal value + travel buyout
      const totalToCollect = budget + travelBuyout

      // Speaker gets their fee + travel buyout
      const speakerPayout = speakerFee + travelBuyout

      // Net commission: prefer stored value, fallback to calculation (budget - speaker_fee)
      // This ensures existing projects without stored commission still work correctly
      const netCommission = storedCommission > 0 ? storedCommission : (budget - speakerFee)

      return {
        id: Number(project.id),
        project_name: project.project_name,
        client_name: project.client_name,
        client_email: project.client_email,
        company: project.company,
        event_name: project.event_name || project.project_name,
        event_date: project.event_date,
        status: project.status,
        speaker_name: project.speaker_name,

        // Financial data
        budget: budget,
        speaker_fee: speakerFee,
        commission_percentage: commissionPercentage,
        commission_amount: netCommission,
        travel_buyout: travelBuyout,
        total_to_collect: totalToCollect,
        speaker_payout: speakerPayout,
        net_commission: netCommission,

        // Client payment tracking
        payment_status: project.payment_status || 'pending',
        payment_date: project.payment_date,
        invoice_number: project.invoice_number,
        purchase_order_number: project.purchase_order_number,
        payment_terms: project.payment_terms,

        // Speaker payment tracking
        speaker_payment_status: project.speaker_payment_status || 'pending',
        speaker_payment_date: project.speaker_payment_date,

        notes: project.notes,
        deal_id: project.deal_id,
        created_at: project.created_at
      }
    })

    // Calculate aggregate summaries
    const summary = {
      // Total to collect from clients (deal values + travel buyouts)
      total_to_collect: transformedProjects.reduce((sum, p) => sum + p.total_to_collect, 0),

      // Amount collected (where client has paid)
      amount_collected: transformedProjects
        .filter(p => p.payment_status === 'paid')
        .reduce((sum, p) => sum + p.total_to_collect, 0),

      // Amount pending collection
      amount_pending: transformedProjects
        .filter(p => p.payment_status !== 'paid')
        .reduce((sum, p) => sum + p.total_to_collect, 0),

      // Total speaker payouts (speaker fees + travel buyouts)
      total_speaker_payouts: transformedProjects.reduce((sum, p) => sum + p.speaker_payout, 0),

      // Speaker payouts completed
      speaker_payouts_paid: transformedProjects
        .filter(p => p.speaker_payment_status === 'paid')
        .reduce((sum, p) => sum + p.speaker_payout, 0),

      // Speaker payouts pending
      speaker_payouts_pending: transformedProjects
        .filter(p => p.speaker_payment_status !== 'paid')
        .reduce((sum, p) => sum + p.speaker_payout, 0),

      // Total travel buyouts (for reference)
      total_travel_buyouts: transformedProjects.reduce((sum, p) => sum + p.travel_buyout, 0),

      // Net commission (realized - where client paid)
      net_commission_realized: transformedProjects
        .filter(p => p.payment_status === 'paid')
        .reduce((sum, p) => sum + p.net_commission, 0),

      // Net commission (projected - all projects)
      net_commission_projected: transformedProjects.reduce((sum, p) => sum + p.net_commission, 0),

      // Project counts
      total_projects: transformedProjects.length,
      projects_paid: transformedProjects.filter(p => p.payment_status === 'paid').length,
      projects_pending: transformedProjects.filter(p => p.payment_status !== 'paid').length,
      speakers_paid: transformedProjects.filter(p => p.speaker_payment_status === 'paid').length,
      speakers_pending: transformedProjects.filter(p => p.speaker_payment_status !== 'paid' && p.speaker_payout > 0).length
    }

    console.log(`Finances API: Returning ${transformedProjects.length} projects, total to collect: $${summary.total_to_collect}`)

    return NextResponse.json({
      projects: transformedProjects,
      summary,
      success: true
    })

  } catch (error) {
    console.error('Error fetching financial data:', error)
    return NextResponse.json({
      error: 'Failed to fetch financial data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PATCH to update project payment info
export async function PATCH(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()

    const {
      projectId,
      payment_status,
      payment_date,
      speaker_payment_status,
      speaker_payment_date,
      travel_buyout,
      invoice_number,
      purchase_order_number
    } = body

    if (!projectId) {
      return NextResponse.json({ error: 'Project ID required' }, { status: 400 })
    }

    // Log the travel_buyout value for debugging
    console.log('PATCH finances - travel_buyout:', {
      received: travel_buyout,
      type: typeof travel_buyout,
      isNull: travel_buyout === null,
      isUndefined: travel_buyout === undefined
    })

    // Use tagged template literal for the update with all fields
    const result = await sql`
      UPDATE projects
      SET
        payment_status = COALESCE(${payment_status ?? null}, payment_status),
        payment_date = COALESCE(${payment_date ?? null}, payment_date),
        speaker_payment_status = COALESCE(${speaker_payment_status ?? null}, speaker_payment_status),
        speaker_payment_date = COALESCE(${speaker_payment_date ?? null}, speaker_payment_date),
        travel_buyout = COALESCE(${travel_buyout ?? null}, travel_buyout),
        invoice_number = COALESCE(${invoice_number ?? null}, invoice_number),
        purchase_order_number = COALESCE(${purchase_order_number ?? null}, purchase_order_number),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${projectId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({
      project: result[0],
      success: true
    })

  } catch (error) {
    console.error('Error updating project payment:', error)
    return NextResponse.json({
      error: 'Failed to update payment data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

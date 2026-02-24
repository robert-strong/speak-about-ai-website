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
        p.client_payment_method,
        p.speaker_payment_method,
        p.notes,
        p.deal_id,
        p.created_at,
        s.name as speaker_name,
        (SELECT string_agg(i.invoice_number, ', ' ORDER BY i.created_at)
         FROM invoices i WHERE i.project_id = p.id) as linked_invoice_numbers
      FROM projects p
      LEFT JOIN speakers s ON s.id = p.speaker_id
      WHERE p.status NOT IN ('cancelled', 'qualified', 'proposal')
      ORDER BY p.event_date DESC NULLS LAST
    `

    // Fetch all project payments in one query
    let allPayments: any[] = []
    try {
      allPayments = await sql`
        SELECT * FROM project_payments ORDER BY project_id, payment_type, created_at
      `
    } catch {
      // Table may not exist yet - that's fine
      console.log('project_payments table not available yet')
    }

    // Build a map of payments by project ID
    const paymentsByProject: Record<number, any[]> = {}
    for (const payment of allPayments) {
      const pid = Number(payment.project_id)
      if (!paymentsByProject[pid]) paymentsByProject[pid] = []
      paymentsByProject[pid].push({
        id: Number(payment.id),
        payment_type: payment.payment_type,
        amount: Number(payment.amount) || 0,
        payment_date: payment.payment_date,
        payment_method: payment.payment_method,
        label: payment.label,
        notes: payment.notes,
        created_at: payment.created_at
      })
    }

    // Transform and calculate financial metrics for each project
    const transformedProjects = projects.map(project => {
      const budget = Number(project.budget) || 0
      const speakerFee = Number(project.speaker_fee) || 0
      const travelBuyout = Number(project.travel_buyout) || 0
      const commissionPercentage = Number(project.commission_percentage) || 20
      const storedCommission = Number(project.commission_amount) || 0
      const projectId = Number(project.id)

      // Travel buyout is paid by client ON TOP of the deal value, then passed through to speaker
      // Total to collect from client = deal value + travel buyout
      const totalToCollect = budget + travelBuyout

      // Speaker gets their fee + travel buyout
      const speakerPayout = speakerFee + travelBuyout

      // Net commission: prefer stored value, fallback to calculation (budget - speaker_fee)
      // This ensures existing projects without stored commission still work correctly
      const netCommission = storedCommission > 0 ? storedCommission : (budget - speakerFee)

      // Use linked invoice numbers from invoices table, fallback to project's own invoice_number field
      const invoiceNumber = project.linked_invoice_numbers || project.invoice_number || null

      // Get individual payments for this project
      const projectPayments = paymentsByProject[projectId] || []
      const clientPayments = projectPayments.filter(p => p.payment_type === 'client')
      const speakerPayments = projectPayments.filter(p => p.payment_type === 'speaker')
      const clientPaidTotal = clientPayments.reduce((sum: number, p: any) => sum + p.amount, 0)
      const speakerPaidTotal = speakerPayments.reduce((sum: number, p: any) => sum + p.amount, 0)

      return {
        id: projectId,
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
        invoice_number: invoiceNumber,
        purchase_order_number: project.purchase_order_number,
        payment_terms: project.payment_terms,

        // Speaker payment tracking
        speaker_payment_status: project.speaker_payment_status || 'pending',
        speaker_payment_date: project.speaker_payment_date,

        // Payment methods
        client_payment_method: project.client_payment_method || null,
        speaker_payment_method: project.speaker_payment_method || null,

        // Individual payments
        payments: projectPayments,
        client_paid_total: clientPaidTotal,
        speaker_paid_total: speakerPaidTotal,

        notes: project.notes,
        deal_id: project.deal_id,
        created_at: project.created_at
      }
    })

    // Calculate aggregate summaries
    // Use actual payment totals when available, fall back to status-based for backwards compat
    const totalClientPaid = transformedProjects.reduce((sum, p) => sum + p.client_paid_total, 0)
    const totalSpeakerPaid = transformedProjects.reduce((sum, p) => sum + p.speaker_paid_total, 0)
    const hasPaymentRecords = allPayments.length > 0

    const summary = {
      // Total to collect from clients (deal values + travel buyouts)
      total_to_collect: transformedProjects.reduce((sum, p) => sum + p.total_to_collect, 0),

      // Amount collected - use actual payment records if available
      amount_collected: hasPaymentRecords
        ? totalClientPaid
        : transformedProjects
            .filter(p => p.payment_status === 'paid')
            .reduce((sum, p) => sum + p.total_to_collect, 0),

      // Amount pending collection
      amount_pending: hasPaymentRecords
        ? transformedProjects.reduce((sum, p) => sum + p.total_to_collect, 0) - totalClientPaid
        : transformedProjects
            .filter(p => p.payment_status !== 'paid')
            .reduce((sum, p) => sum + p.total_to_collect, 0),

      // Total speaker payouts (speaker fees + travel buyouts)
      total_speaker_payouts: transformedProjects.reduce((sum, p) => sum + p.speaker_payout, 0),

      // Speaker payouts completed
      speaker_payouts_paid: hasPaymentRecords
        ? totalSpeakerPaid
        : transformedProjects
            .filter(p => p.speaker_payment_status === 'paid')
            .reduce((sum, p) => sum + p.speaker_payout, 0),

      // Speaker payouts pending
      speaker_payouts_pending: hasPaymentRecords
        ? transformedProjects.reduce((sum, p) => sum + p.speaker_payout, 0) - totalSpeakerPaid
        : transformedProjects
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
      purchase_order_number,
      client_payment_method,
      speaker_payment_method
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
        client_payment_method = ${client_payment_method ?? null},
        speaker_payment_method = ${speaker_payment_method ?? null},
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

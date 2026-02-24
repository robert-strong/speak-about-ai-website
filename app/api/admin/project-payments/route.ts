import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// GET - fetch payments for a project
export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      // Return all payments grouped by project
      const payments = await sql`
        SELECT * FROM project_payments ORDER BY project_id, payment_type, created_at
      `
      return NextResponse.json({ payments, success: true })
    }

    const payments = await sql`
      SELECT * FROM project_payments 
      WHERE project_id = ${projectId}
      ORDER BY payment_type, created_at
    `

    return NextResponse.json({ payments, success: true })
  } catch (error) {
    console.error('Error fetching payments:', error)
    return NextResponse.json({
      error: 'Failed to fetch payments',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// POST - add a new payment
export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()

    const { project_id, payment_type, amount, payment_date, payment_method, label, notes } = body

    if (!project_id || !payment_type) {
      return NextResponse.json({ error: 'project_id and payment_type are required' }, { status: 400 })
    }

    if (!['client', 'speaker'].includes(payment_type)) {
      return NextResponse.json({ error: 'payment_type must be "client" or "speaker"' }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO project_payments (project_id, payment_type, amount, payment_date, payment_method, label, notes)
      VALUES (${project_id}, ${payment_type}, ${amount || 0}, ${payment_date || null}, ${payment_method || null}, ${label || null}, ${notes || null})
      RETURNING *
    `

    // Auto-update the project's payment status based on total payments
    await updateProjectPaymentStatus(sql, project_id, payment_type)

    return NextResponse.json({ payment: result[0], success: true })
  } catch (error) {
    console.error('Error creating payment:', error)
    return NextResponse.json({
      error: 'Failed to create payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// PATCH - update an existing payment
export async function PATCH(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()

    const { id, amount, payment_date, payment_method, label, notes } = body

    if (!id) {
      return NextResponse.json({ error: 'Payment id is required' }, { status: 400 })
    }

    const result = await sql`
      UPDATE project_payments
      SET
        amount = COALESCE(${amount ?? null}, amount),
        payment_date = COALESCE(${payment_date ?? null}, payment_date),
        payment_method = COALESCE(${payment_method ?? null}, payment_method),
        label = COALESCE(${label ?? null}, label),
        notes = COALESCE(${notes ?? null}, notes),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    // Auto-update the project's payment status
    await updateProjectPaymentStatus(sql, result[0].project_id, result[0].payment_type)

    return NextResponse.json({ payment: result[0], success: true })
  } catch (error) {
    console.error('Error updating payment:', error)
    return NextResponse.json({
      error: 'Failed to update payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// DELETE - remove a payment
export async function DELETE(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()

    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Payment id is required' }, { status: 400 })
    }

    // Get payment info before deleting (for status update)
    const payment = await sql`SELECT project_id, payment_type FROM project_payments WHERE id = ${id}`
    
    if (payment.length === 0) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    await sql`DELETE FROM project_payments WHERE id = ${id}`

    // Auto-update the project's payment status
    await updateProjectPaymentStatus(sql, payment[0].project_id, payment[0].payment_type)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment:', error)
    return NextResponse.json({
      error: 'Failed to delete payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper: auto-update project payment_status / speaker_payment_status based on payment totals
async function updateProjectPaymentStatus(sql: any, projectId: number | string, paymentType: string) {
  try {
    // Get project financials
    const project = await sql`
      SELECT budget, speaker_fee, travel_buyout FROM projects WHERE id = ${projectId}
    `
    if (project.length === 0) return

    const budget = Number(project[0].budget) || 0
    const speakerFee = Number(project[0].speaker_fee) || 0
    const travelBuyout = Number(project[0].travel_buyout) || 0

    // Sum all payments of this type for this project
    const totals = await sql`
      SELECT COALESCE(SUM(amount), 0) as total_paid
      FROM project_payments
      WHERE project_id = ${projectId} AND payment_type = ${paymentType}
    `
    const totalPaid = Number(totals[0].total_paid) || 0

    if (paymentType === 'client') {
      const totalOwed = budget + travelBuyout
      let status = 'pending'
      if (totalPaid >= totalOwed && totalOwed > 0) status = 'paid'
      else if (totalPaid > 0) status = 'partial'

      await sql`
        UPDATE projects SET payment_status = ${status}, updated_at = CURRENT_TIMESTAMP WHERE id = ${projectId}
      `
    } else {
      const totalOwed = speakerFee + travelBuyout
      let status = 'pending'
      if (totalPaid >= totalOwed && totalOwed > 0) status = 'paid'
      else if (totalPaid > 0) status = 'partial'

      await sql`
        UPDATE projects SET speaker_payment_status = ${status}, updated_at = CURRENT_TIMESTAMP WHERE id = ${projectId}
      `
    }
  } catch (error) {
    console.error('Error updating project payment status:', error)
  }
}

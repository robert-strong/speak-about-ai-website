import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

// GET - List all payments for a project with totals
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const { id } = await params
  const projectId = parseInt(id)
  if (isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
  }

  try {
    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS project_payments (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('client_payment', 'speaker_payout')),
        amount DECIMAL(12,2) NOT NULL,
        payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    const payments = await sql`
      SELECT * FROM project_payments
      WHERE project_id = ${projectId}
      ORDER BY payment_date ASC, created_at ASC
    `

    const clientPayments = payments.filter((p: any) => p.payment_type === 'client_payment')
    const speakerPayouts = payments.filter((p: any) => p.payment_type === 'speaker_payout')

    const clientTotal = clientPayments.reduce((sum: number, p: any) => sum + Number(p.amount), 0)
    const speakerTotal = speakerPayouts.reduce((sum: number, p: any) => sum + Number(p.amount), 0)

    return NextResponse.json({
      payments,
      client_payments: clientPayments,
      speaker_payouts: speakerPayouts,
      client_total: clientTotal,
      speaker_total: speakerTotal,
    })
  } catch (error) {
    console.error("Error fetching project payments:", error)
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 })
  }
}

// POST - Add a new payment line item
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const { id } = await params
  const projectId = parseInt(id)
  if (isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
  }

  try {
    const { payment_type, amount, payment_date, description } = await request.json()

    if (!payment_type || !['client_payment', 'speaker_payout'].includes(payment_type)) {
      return NextResponse.json({ error: "Invalid payment_type" }, { status: 400 })
    }
    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Amount must be greater than 0" }, { status: 400 })
    }

    // Ensure table exists
    await sql`
      CREATE TABLE IF NOT EXISTS project_payments (
        id SERIAL PRIMARY KEY,
        project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('client_payment', 'speaker_payout')),
        amount DECIMAL(12,2) NOT NULL,
        payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `

    const [payment] = await sql`
      INSERT INTO project_payments (project_id, payment_type, amount, payment_date, description)
      VALUES (${projectId}, ${payment_type}, ${Number(amount)}, ${payment_date || new Date().toISOString().split('T')[0]}, ${description || null})
      RETURNING *
    `

    // Auto-update project payment status based on totals
    await updateProjectPaymentStatus(projectId)

    return NextResponse.json({ payment })
  } catch (error) {
    console.error("Error adding payment:", error)
    return NextResponse.json({ error: "Failed to add payment" }, { status: 500 })
  }
}

// DELETE - Remove a payment line item
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const { id } = await params
  const projectId = parseInt(id)
  if (isNaN(projectId)) {
    return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')

    if (!paymentId) {
      return NextResponse.json({ error: "paymentId is required" }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM project_payments
      WHERE id = ${parseInt(paymentId)} AND project_id = ${projectId}
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    // Auto-update project payment status based on totals
    await updateProjectPaymentStatus(projectId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting payment:", error)
    return NextResponse.json({ error: "Failed to delete payment" }, { status: 500 })
  }
}

// Helper: auto-update project payment_status and speaker_payment_status based on line item totals
async function updateProjectPaymentStatus(projectId: number) {
  try {
    const project = await sql`SELECT budget, travel_buyout, speaker_fee, travel_expenses_amount FROM projects WHERE id = ${projectId}`
    if (project.length === 0) return

    const p = project[0]
    const totalToCollect = Number(p.budget || 0) + Number(p.travel_buyout || 0)
    const totalSpeakerOwed = Number(p.speaker_fee || 0) + Number(p.travel_expenses_amount || 0)

    const payments = await sql`SELECT payment_type, amount FROM project_payments WHERE project_id = ${projectId}`

    const clientPaid = payments
      .filter((pay: any) => pay.payment_type === 'client_payment')
      .reduce((sum: number, pay: any) => sum + Number(pay.amount), 0)

    const speakerPaid = payments
      .filter((pay: any) => pay.payment_type === 'speaker_payout')
      .reduce((sum: number, pay: any) => sum + Number(pay.amount), 0)

    // Determine client payment status
    let clientStatus = 'pending'
    if (clientPaid > 0 && clientPaid < totalToCollect) clientStatus = 'partial'
    if (clientPaid >= totalToCollect && totalToCollect > 0) clientStatus = 'paid'

    // Determine speaker payment status
    let speakerStatus = 'pending'
    if (speakerPaid >= totalSpeakerOwed && totalSpeakerOwed > 0) speakerStatus = 'paid'
    else if (speakerPaid > 0) speakerStatus = 'partial'

    await sql`
      UPDATE projects SET
        payment_status = ${clientStatus},
        speaker_payment_status = ${speakerStatus === 'partial' ? 'pending' : speakerStatus},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${projectId}
    `
  } catch (error) {
    console.error("Error updating payment status:", error)
  }
}

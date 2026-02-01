import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import jwt from 'jsonwebtoken'

const sql = neon(process.env.DATABASE_URL!)

// Helper to verify client token
function verifyClientToken(request: NextRequest): { clientId: number; email: string } | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
    if (decoded.type !== 'client' || !decoded.clientId) {
      return null
    }
    return { clientId: decoded.clientId, email: decoded.email }
  } catch (error) {
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = verifyClientToken(request)
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get client info
    const clientInfo = await sql`
      SELECT id, email FROM clients WHERE id = ${auth.clientId}
    `

    if (clientInfo.length === 0) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 })
    }

    const clientEmail = clientInfo[0].email

    // Fetch invoices linked to this client (through projects or directly)
    const invoices = await sql`
      SELECT
        i.id,
        i.invoice_number,
        i.amount,
        i.status,
        i.issue_date,
        i.due_date,
        i.payment_date,
        i.notes,
        i.created_at,
        p.project_name,
        p.event_name,
        p.event_date
      FROM invoices i
      LEFT JOIN projects p ON i.project_id = p.id
      WHERE i.client_id = ${auth.clientId}
         OR (p.client_id = ${auth.clientId})
         OR (LOWER(p.client_email) = ${clientEmail.toLowerCase()})
      ORDER BY i.issue_date DESC
    `

    // Summary stats
    const stats = {
      total: invoices.length,
      paid: invoices.filter((i: any) => i.status === 'paid').length,
      pending: invoices.filter((i: any) => i.status === 'sent').length,
      overdue: invoices.filter((i: any) => i.status === 'overdue').length,
      total_amount: invoices.reduce((sum: number, i: any) => sum + (parseFloat(i.amount) || 0), 0),
      total_paid: invoices
        .filter((i: any) => i.status === 'paid')
        .reduce((sum: number, i: any) => sum + (parseFloat(i.amount) || 0), 0),
      total_outstanding: invoices
        .filter((i: any) => ['sent', 'overdue'].includes(i.status))
        .reduce((sum: number, i: any) => sum + (parseFloat(i.amount) || 0), 0)
    }

    return NextResponse.json({
      success: true,
      invoices,
      stats
    })

  } catch (error) {
    console.error('Error fetching client invoices:', error)
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    )
  }
}

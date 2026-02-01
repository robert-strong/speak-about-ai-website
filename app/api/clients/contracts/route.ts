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

    // Fetch contracts linked to this client
    const contracts = await sql`
      SELECT
        c.id,
        c.contract_number,
        c.title,
        c.type,
        c.status,
        c.event_title,
        c.event_date,
        c.event_location,
        c.event_type,
        c.fee_amount,
        c.payment_terms,
        c.speaker_name,
        c.created_at,
        c.sent_at,
        c.signed_at
      FROM contracts c
      WHERE c.client_id = ${auth.clientId}
         OR LOWER(c.client_email) = ${clientEmail.toLowerCase()}
      ORDER BY c.created_at DESC
    `

    // Get signature status for each contract
    const contractsWithSignatures = await Promise.all(
      contracts.map(async (contract: any) => {
        const signatures = await sql`
          SELECT signer_type, signed_at
          FROM contract_signatures
          WHERE contract_id = ${contract.id}
        `
        return {
          ...contract,
          signatures: signatures.reduce((acc: any, sig: any) => {
            acc[sig.signer_type] = { signed: true, signed_at: sig.signed_at }
            return acc
          }, {})
        }
      })
    )

    // Summary stats
    const stats = {
      total: contracts.length,
      draft: contracts.filter((c: any) => c.status === 'draft').length,
      sent: contracts.filter((c: any) => c.status === 'sent').length,
      signed: contracts.filter((c: any) => c.status === 'fully_executed').length,
      total_value: contracts.reduce((sum: number, c: any) => sum + (parseFloat(c.fee_amount) || 0), 0)
    }

    return NextResponse.json({
      success: true,
      contracts: contractsWithSignatures,
      stats
    })

  } catch (error) {
    console.error('Error fetching client contracts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch contracts' },
      { status: 500 }
    )
  }
}

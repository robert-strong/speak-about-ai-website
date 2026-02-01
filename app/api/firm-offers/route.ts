import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// Generate secure token
function generateSecureToken(length: number = 40): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// GET: List firm offers or get by proposal_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const proposalId = searchParams.get('proposal_id')

    if (proposalId) {
      const offers = await sql`
        SELECT fo.*, p.title as proposal_title, p.client_name, p.client_email
        FROM firm_offers fo
        LEFT JOIN proposals p ON p.id = fo.proposal_id
        WHERE fo.proposal_id = ${proposalId}
        ORDER BY fo.created_at DESC
      `
      return NextResponse.json(offers)
    }

    const offers = await sql`
      SELECT fo.*, p.title as proposal_title, p.client_name as proposal_client_name, p.client_email as proposal_client_email
      FROM firm_offers fo
      LEFT JOIN proposals p ON p.id = fo.proposal_id
      ORDER BY fo.created_at DESC
    `
    return NextResponse.json(offers)
  } catch (error) {
    console.error('Error fetching firm offers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch firm offers' },
      { status: 500 }
    )
  }
}

// POST: Create new firm offer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { proposal_id, hold_expires_at, ...data } = body

    // Generate speaker access token
    const speaker_access_token = generateSecureToken(40)

    // Default hold expiration to 2 weeks from now if not provided
    const holdExpiration = hold_expires_at || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()

    const [offer] = await sql`
      INSERT INTO firm_offers (
        proposal_id,
        status,
        event_overview,
        speaker_program,
        event_schedule,
        technical_requirements,
        travel_accommodation,
        additional_info,
        financial_details,
        confirmation,
        speaker_access_token,
        hold_expires_at
      ) VALUES (
        ${proposal_id || null},
        ${data.status || 'draft'},
        ${JSON.stringify(data.event_overview || {})},
        ${JSON.stringify(data.speaker_program || {})},
        ${JSON.stringify(data.event_schedule || {})},
        ${JSON.stringify(data.technical_requirements || {})},
        ${JSON.stringify(data.travel_accommodation || {})},
        ${JSON.stringify(data.additional_info || {})},
        ${JSON.stringify(data.financial_details || {})},
        ${JSON.stringify(data.confirmation || {})},
        ${speaker_access_token},
        ${holdExpiration}
      )
      RETURNING *
    `

    return NextResponse.json(offer, { status: 201 })
  } catch (error) {
    console.error('Error creating firm offer:', error)
    return NextResponse.json(
      { error: 'Failed to create firm offer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

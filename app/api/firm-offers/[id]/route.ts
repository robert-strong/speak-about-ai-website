import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// GET: Get single firm offer
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Try to get firm offer - works with or without proposal
    const [offer] = await sql`
      SELECT fo.*,
             p.title as proposal_title,
             p.client_name as proposal_client_name,
             p.client_email as proposal_client_email,
             p.speakers as proposal_speakers,
             p.event_title as proposal_event_title,
             p.event_date as proposal_event_date,
             p.total_investment as proposal_total_investment,
             d.event_title as deal_event_title,
             d.company as deal_company,
             d.client_name as deal_client_name,
             d.client_email as deal_client_email,
             d.event_date as deal_event_date,
             d.event_location as deal_event_location,
             d.speaker_requested as deal_speaker_name
      FROM firm_offers fo
      LEFT JOIN proposals p ON p.id = fo.proposal_id
      LEFT JOIN deals d ON d.firm_offer_id = fo.id
      WHERE fo.id = ${id}
    `

    if (!offer) {
      return NextResponse.json(
        { error: 'Firm offer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(offer)
  } catch (error) {
    console.error('Error fetching firm offer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch firm offer' },
      { status: 500 }
    )
  }
}

// PATCH: Update firm offer
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const numericId = parseInt(id, 10)

    if (isNaN(numericId)) {
      return NextResponse.json(
        { error: 'Invalid firm offer ID' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Build SET clauses dynamically based on what's provided
    const setClauses: string[] = ['updated_at = CURRENT_TIMESTAMP']
    const values: any[] = []
    let paramIndex = 1

    if (body.status !== undefined) {
      setClauses.push(`status = $${paramIndex}`)
      values.push(body.status)
      paramIndex++

      if (body.status === 'submitted') {
        setClauses.push('submitted_at = CURRENT_TIMESTAMP')
      } else if (body.status === 'sent_to_speaker') {
        setClauses.push('sent_to_speaker_at = CURRENT_TIMESTAMP')
      }
    }

    if (body.event_overview !== undefined) {
      setClauses.push(`event_overview = $${paramIndex}::jsonb`)
      values.push(JSON.stringify(body.event_overview))
      paramIndex++
    }

    if (body.speaker_program !== undefined) {
      setClauses.push(`speaker_program = $${paramIndex}::jsonb`)
      values.push(JSON.stringify(body.speaker_program))
      paramIndex++
    }

    if (body.event_schedule !== undefined) {
      setClauses.push(`event_schedule = $${paramIndex}::jsonb`)
      values.push(JSON.stringify(body.event_schedule))
      paramIndex++
    }

    if (body.technical_requirements !== undefined) {
      setClauses.push(`technical_requirements = $${paramIndex}::jsonb`)
      values.push(JSON.stringify(body.technical_requirements))
      paramIndex++
    }

    if (body.travel_accommodation !== undefined) {
      setClauses.push(`travel_accommodation = $${paramIndex}::jsonb`)
      values.push(JSON.stringify(body.travel_accommodation))
      paramIndex++
    }

    if (body.additional_info !== undefined) {
      setClauses.push(`additional_info = $${paramIndex}::jsonb`)
      values.push(JSON.stringify(body.additional_info))
      paramIndex++
    }

    if (body.financial_details !== undefined) {
      setClauses.push(`financial_details = $${paramIndex}::jsonb`)
      values.push(JSON.stringify(body.financial_details))
      paramIndex++
    }

    if (body.confirmation !== undefined) {
      setClauses.push(`confirmation = $${paramIndex}::jsonb`)
      values.push(JSON.stringify(body.confirmation))
      paramIndex++
    }

    if (body.speaker_notes !== undefined) {
      setClauses.push(`speaker_notes = $${paramIndex}`)
      values.push(body.speaker_notes)
      paramIndex++
    }

    if (body.speaker_confirmed !== undefined) {
      setClauses.push(`speaker_confirmed = $${paramIndex}`)
      values.push(body.speaker_confirmed)
      paramIndex++
      setClauses.push('speaker_response_at = CURRENT_TIMESTAMP')
    }

    // Add the ID as the last parameter
    values.push(numericId)

    const query = `
      UPDATE firm_offers
      SET ${setClauses.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await sql.query(query, values)
    const updated = result[0]

    if (!updated) {
      return NextResponse.json(
        { error: 'Firm offer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating firm offer:', error)
    return NextResponse.json(
      { error: 'Failed to update firm offer', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE: Delete firm offer
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [deleted] = await sql`
      DELETE FROM firm_offers
      WHERE id = ${id}
      RETURNING id
    `

    if (!deleted) {
      return NextResponse.json(
        { error: 'Firm offer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, id: deleted.id })
  } catch (error) {
    console.error('Error deleting firm offer:', error)
    return NextResponse.json(
      { error: 'Failed to delete firm offer' },
      { status: 500 }
    )
  }
}

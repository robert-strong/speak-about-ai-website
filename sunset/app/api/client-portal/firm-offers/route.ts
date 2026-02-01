import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

// GET: Fetch firm offers for a client by their email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientEmail = searchParams.get('email')

    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Client email is required' },
        { status: 400 }
      )
    }

    // Fetch firm offers where the billing contact email matches
    // or the proposal's client email matches
    const firmOffers = await sql`
      SELECT
        fo.id,
        fo.status,
        fo.event_overview,
        fo.speaker_program,
        fo.financial_details,
        fo.speaker_access_token,
        fo.created_at,
        fo.hold_expires_at,
        fo.submitted_at,
        p.title as proposal_title,
        p.client_name as proposal_client_name,
        p.client_email as proposal_client_email,
        p.event_title,
        p.event_date as proposal_event_date
      FROM firm_offers fo
      LEFT JOIN proposals p ON p.id = fo.proposal_id
      WHERE
        fo.status IN ('out_for_delivery', 'draft')
        AND (
          fo.event_overview->'billing_contact'->>'email' = ${clientEmail}
          OR p.client_email = ${clientEmail}
        )
      ORDER BY fo.created_at DESC
    `

    // Transform the data for the client portal
    const transformedOffers = firmOffers.map(offer => {
      const eventOverview = offer.event_overview || {}
      const speakerProgram = offer.speaker_program || {}
      const financialDetails = offer.financial_details || {}

      // Calculate hold expiration
      const createdAt = new Date(offer.created_at)
      const holdExpires = offer.hold_expires_at
        ? new Date(offer.hold_expires_at)
        : new Date(createdAt.getTime() + 14 * 24 * 60 * 60 * 1000)
      const now = new Date()
      const daysRemaining = Math.ceil((holdExpires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      return {
        id: offer.id,
        status: offer.status,
        eventName: eventOverview.event_name || offer.event_title || offer.proposal_title || 'Untitled Event',
        eventDate: eventOverview.event_date || offer.proposal_event_date,
        speakerName: speakerProgram.requested_speaker_name || 'TBD',
        speakerFee: financialDetails.speaker_fee || 0,
        clientName: eventOverview.end_client_name || offer.proposal_client_name,
        accessToken: offer.speaker_access_token,
        createdAt: offer.created_at,
        submittedAt: offer.submitted_at,
        holdExpiration: {
          expiresAt: holdExpires.toISOString(),
          daysRemaining: Math.max(0, daysRemaining),
          expired: daysRemaining < 0
        }
      }
    })

    return NextResponse.json({
      success: true,
      firmOffers: transformedOffers
    })
  } catch (error) {
    console.error('Error fetching client firm offers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch firm offers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

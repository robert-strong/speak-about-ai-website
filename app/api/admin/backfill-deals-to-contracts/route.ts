import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Find all won deals that don't have a linked contract yet
    const deals = await sql`
      SELECT d.*
      FROM deals d
      WHERE d.status = 'won'
      AND NOT EXISTS (
        SELECT 1 FROM contracts c WHERE c.deal_id = d.id
      )
      AND d.client_name IS NOT NULL
      AND d.client_email IS NOT NULL
      ORDER BY d.created_at DESC
    `

    let created = 0
    let errors = 0
    const createdContracts: any[] = []

    for (const deal of deals) {
      try {
        const contractDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const contractRandom = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
        const contractNumber = `CTR-${contractDate}-${contractRandom}`
        const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
        const dealValue = Number(deal.deal_value) || 0
        const speakerName = deal.speaker_requested || null
        const speakerFee = dealValue

        await sql`
          INSERT INTO contracts (
            deal_id, contract_number, title, type, status,
            fee_amount, payment_terms,
            event_title, event_date, event_location, event_type,
            client_name, client_email, client_company,
            speaker_name, speaker_fee,
            expires_at, created_by
          ) VALUES (
            ${deal.id},
            ${contractNumber},
            ${`Speaker Engagement Agreement - ${deal.event_title}`},
            'client_speaker',
            'draft',
            ${dealValue},
            ${'Payment due within 30 days of event completion'},
            ${deal.event_title},
            ${deal.event_date || null},
            ${deal.event_location || null},
            ${deal.event_type || null},
            ${deal.client_name},
            ${deal.client_email},
            ${deal.company || null},
            ${speakerName},
            ${speakerFee},
            ${expiresAt},
            ${'system-backfill'}
          )
        `

        created++
        createdContracts.push({
          dealId: deal.id,
          eventTitle: deal.event_title,
          contractNumber,
          clientName: deal.client_name,
          amount: dealValue
        })
      } catch (err) {
        console.error(`Error creating contract for deal ${deal.id}:`, err)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} contracts from ${deals.length} won deals missing them.`,
      summary: { wonDealsChecked: deals.length, contractsCreated: created, errors },
      createdContracts
    })
  } catch (error) {
    console.error('Backfill deals to contracts error:', error)
    return NextResponse.json({
      error: 'Failed to backfill contracts from won deals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

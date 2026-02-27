import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()
    const { deal_id } = body

    if (!deal_id) {
      return NextResponse.json({ error: 'deal_id is required' }, { status: 400 })
    }

    // Check if a proposal already exists for this deal
    const existing = await sql`SELECT id FROM proposals WHERE deal_id = ${deal_id}`
    if (existing.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'Proposal already exists for this deal',
        proposalId: existing[0].id,
        alreadyExisted: true
      })
    }

    // Get deal data
    const deals = await sql`SELECT * FROM deals WHERE id = ${deal_id}`
    if (deals.length === 0) {
      return NextResponse.json({ error: 'Deal not found' }, { status: 404 })
    }
    const deal = deals[0]

    // Generate unique proposal number
    const countResult = await sql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM proposals`
    const count = Number(countResult[0].next_id)
    const year = new Date().getFullYear()
    const proposalNumber = `PROP-${year}-${String(count).padStart(4, '0')}`

    // Generate access token
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let accessToken = ''
    for (let i = 0; i < 40; i++) {
      accessToken += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const dealValue = Number(deal.deal_value) || 0
    const speakerName = deal.speaker_requested || null
    const speakers = speakerName ? JSON.stringify([{
      name: speakerName,
      bio: '',
      topics: [],
      fee: dealValue,
      fee_status: 'estimated'
    }]) : '[]'

    const services = JSON.stringify([{
      name: 'Keynote Presentation',
      description: '60-minute keynote address',
      price: dealValue,
      included: true
    }])

    const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

    const result = await sql`
      INSERT INTO proposals (
        deal_id, proposal_number, title, status, version,
        client_name, client_email, client_company,
        executive_summary, speakers,
        event_title, event_date, event_location, event_type,
        attendee_count,
        services, deliverables, total_investment,
        payment_terms, payment_schedule,
        testimonials, case_studies,
        valid_until, access_token
      ) VALUES (
        ${deal_id},
        ${proposalNumber},
        ${`Speaking Engagement Proposal for ${deal.company || deal.client_name}`},
        'draft',
        1,
        ${deal.client_name},
        ${deal.client_email},
        ${deal.company || null},
        ${`We are pleased to present this proposal for ${deal.event_title}. Our speaker will deliver an engaging and impactful presentation tailored to your audience.`},
        ${speakers}::jsonb,
        ${deal.event_title},
        ${deal.event_date || null},
        ${deal.event_location || null},
        ${deal.event_type || null},
        ${deal.attendee_count || null},
        ${services}::jsonb,
        '[]'::jsonb,
        ${dealValue},
        ${'50% due upon contract signing, 50% due before event date'},
        '[]'::jsonb,
        '[]'::jsonb,
        '[]'::jsonb,
        ${validUntil},
        ${accessToken}
      )
      RETURNING id, proposal_number
    `

    return NextResponse.json({
      success: true,
      proposalId: result[0].id,
      proposalNumber: result[0].proposal_number,
      message: `Draft proposal ${result[0].proposal_number} created for deal #${deal_id}`
    })
  } catch (error) {
    console.error('Auto-create proposal error:', error)
    return NextResponse.json({
      error: 'Failed to create proposal',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

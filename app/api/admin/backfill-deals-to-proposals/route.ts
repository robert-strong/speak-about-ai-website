import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Find ALL deals that don't have a linked proposal yet
    const deals = await sql`
      SELECT d.*
      FROM deals d
      WHERE NOT EXISTS (
        SELECT 1 FROM proposals p WHERE p.deal_id = d.id
      )
      AND d.client_name IS NOT NULL
      AND d.client_email IS NOT NULL
      ORDER BY d.created_at DESC
    `

    let created = 0
    let errors = 0
    const createdProposals: any[] = []

    // Get the max proposal number to avoid duplicate key collisions
    const maxResult = await sql`SELECT MAX(CAST(SPLIT_PART(proposal_number, '-', 3) AS INTEGER)) as max_num FROM proposals WHERE proposal_number LIKE 'PROP-%'`
    let runningCount = Number(maxResult[0].max_num) || 0

    for (const deal of deals) {
      try {
        runningCount++
        const year = new Date().getFullYear()
        const proposalNumber = `PROP-${year}-${String(runningCount).padStart(4, '0')}`

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

        const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        // Determine proposal status based on deal status
        let proposalStatus = 'draft'
        if (deal.status === 'won') proposalStatus = 'accepted'
        else if (deal.status === 'lost') proposalStatus = 'rejected'
        else if (['proposal', 'negotiation'].includes(deal.status)) proposalStatus = 'sent'

        await sql`
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
            ${deal.id},
            ${proposalNumber},
            ${`Speaking Engagement Proposal for ${deal.company || deal.client_name}`},
            ${proposalStatus},
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
            '[]'::jsonb,
            '[]'::jsonb,
            ${dealValue},
            ${'50% due upon contract signing, 50% due before event date'},
            '[]'::jsonb,
            '[]'::jsonb,
            '[]'::jsonb,
            ${validUntil},
            ${accessToken}
          )
        `

        created++
        createdProposals.push({
          dealId: deal.id,
          dealStatus: deal.status,
          eventTitle: deal.event_title,
          proposalNumber,
          proposalStatus,
          amount: dealValue
        })
      } catch (err) {
        console.error(`Error creating proposal for deal ${deal.id}:`, err)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} proposals from ${deals.length} deals missing them.`,
      summary: { dealsChecked: deals.length, proposalsCreated: created, errors },
      createdProposals
    })
  } catch (error) {
    console.error('Backfill deals to proposals error:', error)
    return NextResponse.json({
      error: 'Failed to backfill proposals from deals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

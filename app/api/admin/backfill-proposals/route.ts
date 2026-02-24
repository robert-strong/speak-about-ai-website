import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Find projects at proposal stage or beyond that don't have a linked proposal
    const projects = await sql`
      SELECT p.id, p.project_name, p.client_name, p.client_email, p.company,
             p.event_name, p.event_date, p.event_location, p.event_type,
             p.budget, p.speaker_fee, p.status, p.deal_id, p.attendee_count,
             p.requested_speaker_name, p.description, p.notes,
             d.deal_value, d.budget_range, d.speaker_requested, d.event_title as deal_event_title
      FROM projects p
      LEFT JOIN deals d ON p.deal_id = d.id
      WHERE p.status NOT IN ('cancelled', 'qualified')
      AND NOT EXISTS (
        SELECT 1 FROM proposals prop WHERE prop.deal_id = p.deal_id AND p.deal_id IS NOT NULL
      )
      AND p.client_name IS NOT NULL
      AND p.client_email IS NOT NULL
    `

    let created = 0
    let errors = 0
    const createdProposals: any[] = []

    for (const project of projects) {
      try {
        // Generate unique proposal number
        const countResult = await sql`SELECT COUNT(*) as count FROM proposals`
        const count = Number(countResult[0].count) + created + 1
        const year = new Date().getFullYear()
        const proposalNumber = `PROP-${year}-${String(count).padStart(4, '0')}`

        // Generate access token
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
        let accessToken = ''
        for (let i = 0; i < 40; i++) {
          accessToken += chars.charAt(Math.floor(Math.random() * chars.length))
        }

        const totalInvestment = Number(project.budget) || Number(project.deal_value) || 0
        const speakerFee = Number(project.speaker_fee) || 0
        const eventTitle = project.event_name || project.deal_event_title || project.project_name
        const speakerName = project.requested_speaker_name || project.speaker_requested || null

        // Build speakers array
        const speakers = speakerName ? JSON.stringify([{
          name: speakerName,
          bio: '',
          topics: [],
          fee: speakerFee,
          fee_status: 'estimated'
        }]) : '[]'

        // Set valid_until to 30 days from now
        const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

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
            ${project.deal_id || null},
            ${proposalNumber},
            ${`Speaking Engagement Proposal for ${project.company || project.client_name}`},
            'draft',
            1,
            ${project.client_name},
            ${project.client_email},
            ${project.company || null},
            ${`We are pleased to present this proposal for ${eventTitle}. Our speaker will deliver an engaging and impactful presentation tailored to your audience.`},
            ${speakers}::jsonb,
            ${eventTitle},
            ${project.event_date || null},
            ${project.event_location || null},
            ${project.event_type || null},
            ${project.attendee_count || null},
            '[]'::jsonb,
            '[]'::jsonb,
            ${totalInvestment},
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
          projectId: project.id,
          projectName: project.project_name,
          proposalNumber,
          amount: totalInvestment
        })
      } catch (err) {
        console.error(`Error creating proposal for project ${project.id}:`, err)
        errors++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${created} proposals for projects missing them.`,
      summary: { projectsChecked: projects.length, proposalsCreated: created, errors },
      createdProposals
    })
  } catch (error) {
    console.error('Backfill proposals error:', error)
    return NextResponse.json({
      error: 'Failed to backfill proposals',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

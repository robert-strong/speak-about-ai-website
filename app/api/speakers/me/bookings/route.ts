import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { authenticateSpeaker } from '@/lib/speaker-auth'

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Authenticate speaker and get speaker ID
    const authResult = authenticateSpeaker(request)
    if (!('speakerId' in authResult)) {
      return authResult // Return the error response
    }
    
    const { speakerId } = authResult

    // Get speaker info first
    const speakers = await sql`
      SELECT id, email, name FROM speakers
      WHERE id = ${speakerId} AND active = true
      LIMIT 1
    `

    if (speakers.length === 0) {
      return NextResponse.json(
        { error: 'Speaker not found' },
        { status: 404 }
      )
    }

    const speaker = speakers[0]

    // Fetch projects where speaker is assigned (by ID or name match)
    const projects = await sql`
      SELECT 
        id, project_name, client_name, company, event_date, event_location,
        status, priority, deadline, speaker_fee, event_classification,
        event_type, attendee_count, program_topic, program_type,
        venue_name, venue_address, event_start_time, event_end_time,
        speaker_arrival_time, program_start_time, program_length,
        travel_required, accommodation_required, requested_speaker_name,
        created_at, updated_at
      FROM projects 
      WHERE (
        speaker_id = ${speakerId} 
        OR LOWER(requested_speaker_name) = LOWER(${speaker.name})
        OR LOWER(requested_speaker_name) LIKE LOWER(${'%' + speaker.name + '%'})
      )
      AND status NOT IN ('cancelled')
      ORDER BY event_date ASC, created_at DESC
    `

    // Fetch deals where speaker is requested (by ID or name match)
    const deals = await sql`
      SELECT 
        id, client_name, company, event_title, event_date, event_location,
        event_type, status, priority, deal_value, attendee_count,
        speaker_requested, budget_range, source, notes,
        created_at, updated_at
      FROM deals 
      WHERE (
        speaker_id = ${speakerId}
        OR LOWER(speaker_requested) = LOWER(${speaker.name})
        OR LOWER(speaker_requested) LIKE LOWER(${'%' + speaker.name + '%'})
      )
      AND status NOT IN ('lost')
        ORDER BY event_date ASC, created_at DESC
      `

      // Combine and format the results
      const confirmedEvents = projects.map(project => ({
        id: project.id,
        type: 'project',
        title: project.project_name,
        client: project.client_name,
        company: project.company,
        eventDate: project.event_date,
        location: project.event_location || project.venue_name,
        status: project.status,
        priority: project.priority,
        fee: project.speaker_fee,
        classification: project.event_classification,
        eventType: project.event_type,
        attendeeCount: project.attendee_count,
        topic: project.program_topic,
        programType: project.program_type,
        venue: {
          name: project.venue_name,
          address: project.venue_address
        },
        schedule: {
          eventStart: project.event_start_time,
          eventEnd: project.event_end_time,
          arrivalTime: project.speaker_arrival_time,
          programStart: project.program_start_time,
          programLength: project.program_length
        },
        logistics: {
          travelRequired: project.travel_required,
          accommodationRequired: project.accommodation_required
        },
        createdAt: project.created_at,
        updatedAt: project.updated_at
      }))

      const potentialOpportunities = deals.map(deal => ({
        id: deal.id,
        type: 'deal',
        title: deal.event_title,
        client: deal.client_name,
        company: deal.company,
        eventDate: deal.event_date,
        location: deal.event_location,
        status: deal.status,
        priority: deal.priority,
        estimatedFee: deal.deal_value,
        eventType: deal.event_type,
        attendeeCount: deal.attendee_count,
        budgetRange: deal.budget_range,
        source: deal.source,
        notes: deal.notes,
        createdAt: deal.created_at,
        updatedAt: deal.updated_at
      }))

      // Separate upcoming and past events
      const now = new Date()
      const upcomingEvents = confirmedEvents.filter(event => 
        event.eventDate && new Date(event.eventDate) >= now
      )
      const pastEvents = confirmedEvents.filter(event => 
        event.eventDate && new Date(event.eventDate) < now
      )

      return NextResponse.json({
        success: true,
        data: {
          speaker: {
            id: speaker.id,
            name: speaker.name,
            email: speaker.email
          },
          bookings: {
            upcoming: upcomingEvents,
            past: pastEvents,
            opportunities: potentialOpportunities
          },
          summary: {
            totalUpcoming: upcomingEvents.length,
            totalPast: pastEvents.length,
            totalOpportunities: potentialOpportunities.length
          }
        }
      })

  } catch (error) {
    console.error('Get speaker bookings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch speaker bookings' },
      { status: 500 }
    )
  }
}
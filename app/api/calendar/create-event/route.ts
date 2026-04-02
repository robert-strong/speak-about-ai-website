import { NextRequest, NextResponse } from 'next/server'
import { createGoogleCalendarClient, createEventFromProject, CalendarEvent } from '@/lib/google-calendar-client'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { projectId, dealId, customEvent, userEmail } = body

    // Load calendar sync config
    let calendarConfig: any = null
    try {
      const configResult = await sql`SELECT * FROM google_calendar_config LIMIT 1`
      calendarConfig = configResult[0] || null
    } catch {
      // Table may not exist yet — use defaults
    }

    // Check if sync is enabled (if config exists)
    if (calendarConfig && !calendarConfig.enabled) {
      return NextResponse.json(
        {
          error: 'Google Calendar sync is disabled',
          message: 'Enable calendar sync in System > Google Calendar settings',
        },
        { status: 400 }
      )
    }

    // Initialize calendar client
    const calendarClient = createGoogleCalendarClient()

    // Load tokens for the user — prefer config email, then param, then env
    const email = calendarConfig?.user_email || userEmail || process.env.ADMIN_EMAIL || 'noah@speakabout.ai'
    const tokens = await calendarClient.loadTokens(email)

    if (!tokens) {
      return NextResponse.json(
        {
          error: 'Not authenticated with Google Calendar',
          message: 'Please connect your Google account in System > Google Calendar settings',
        },
        { status: 401 }
      )
    }

    await calendarClient.setCredentials(tokens.access_token, tokens.refresh_token)

    // Determine target calendar from config
    const targetCalendarId = calendarConfig?.calendar_id || 'primary'

    let event

    if (customEvent) {
      // Apply config defaults to custom event
      const enrichedEvent = applyConfigDefaults(customEvent, calendarConfig)
      event = await calendarClient.createEvent(enrichedEvent, targetCalendarId)
    } else if (projectId || dealId) {
      let project
      if (projectId) {
        const result = await sql`
          SELECT * FROM projects WHERE id = ${projectId}
        `
        project = result[0]
      } else if (dealId) {
        const result = await sql`
          SELECT
            event_title as project_name,
            event_date,
            event_location,
            client_name,
            client_email,
            notes,
            event_type
          FROM deals WHERE id = ${dealId}
        `
        project = result[0]
      }

      if (!project) {
        return NextResponse.json({ error: 'Project or deal not found' }, { status: 404 })
      }

      const calendarEvent = createEventFromProject(project)
      const enrichedEvent = applyConfigDefaults(calendarEvent, calendarConfig)
      event = await calendarClient.createEvent(enrichedEvent, targetCalendarId)
    } else {
      return NextResponse.json(
        { error: 'Must provide projectId, dealId, or customEvent' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      event,
      message: 'Calendar event created successfully',
    })
  } catch (error) {
    console.error('Error creating calendar event:', error)
    return NextResponse.json(
      {
        error: 'Failed to create calendar event',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Apply saved config defaults (meet link, reminder) to a calendar event
 */
function applyConfigDefaults(event: CalendarEvent, config: any): CalendarEvent {
  if (!config) return event

  const enriched = { ...event }

  // Add Google Meet link if configured
  if (config.include_meet_link && !enriched.conferenceData) {
    enriched.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }

  // Apply default reminder if configured
  if (config.default_reminder_minutes) {
    enriched.reminders = {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: config.default_reminder_minutes },
        { method: 'email', minutes: 24 * 60 }, // always keep 1 day email reminder
      ],
    }
  }

  return enriched
}

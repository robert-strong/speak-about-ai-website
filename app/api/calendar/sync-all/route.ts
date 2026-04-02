import { NextRequest, NextResponse } from 'next/server'
import { createGoogleCalendarClient, createEventFromProject, CalendarEvent } from '@/lib/google-calendar-client'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    // Load calendar sync config
    let calendarConfig: any = null
    try {
      const configResult = await sql`SELECT * FROM google_calendar_config LIMIT 1`
      calendarConfig = configResult[0] || null
    } catch {
      // Table may not exist yet
    }

    if (calendarConfig && !calendarConfig.enabled) {
      return NextResponse.json(
        { error: 'Google Calendar sync is disabled. Enable it in System > Google Calendar settings.' },
        { status: 400 }
      )
    }

    // Initialize calendar client
    const calendarClient = createGoogleCalendarClient()
    const email = calendarConfig?.user_email || process.env.ADMIN_EMAIL || 'noah@speakabout.ai'
    const tokens = await calendarClient.loadTokens(email)

    if (!tokens) {
      return NextResponse.json(
        { error: 'Not authenticated with Google Calendar. Connect your account in System > Google Calendar settings.' },
        { status: 401 }
      )
    }

    await calendarClient.setCredentials(tokens.access_token, tokens.refresh_token)

    const targetCalendarId = calendarConfig?.calendar_id || 'primary'

    // Ensure the tracking column exists
    await sql`
      ALTER TABLE projects ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(500)
    `

    // Get all projects with event dates
    const projects = await sql`
      SELECT id, project_name, event_date, event_location, client_name,
             client_email, notes, event_type, google_calendar_event_id
      FROM projects
      WHERE event_date IS NOT NULL
      ORDER BY event_date ASC
    `

    let created = 0
    let skipped = 0
    let failed = 0
    const errors: string[] = []

    for (const project of projects) {
      // Skip if already synced
      if (project.google_calendar_event_id) {
        skipped++
        continue
      }

      try {
        const calendarEvent = createEventFromProject(project)
        const enrichedEvent = applyConfigDefaults(calendarEvent, calendarConfig)
        const event = await calendarClient.createEvent(enrichedEvent, targetCalendarId)

        // Save the Google Calendar event ID back to the project
        if (event.id) {
          await sql`
            UPDATE projects SET google_calendar_event_id = ${event.id} WHERE id = ${project.id}
          `
        }

        created++
      } catch (err: any) {
        failed++
        errors.push(`${project.project_name}: ${err.message || 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${created} event${created !== 1 ? 's' : ''} to Google Calendar${skipped > 0 ? `, ${skipped} already synced` : ''}${failed > 0 ? `, ${failed} failed` : ''}`,
      created,
      skipped,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error syncing all to calendar:', error)
    return NextResponse.json(
      { error: 'Failed to sync events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove all synced events from Google Calendar
export async function DELETE(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const calendarClient = createGoogleCalendarClient()

    let calendarConfig: any = null
    try {
      const configResult = await sql`SELECT * FROM google_calendar_config LIMIT 1`
      calendarConfig = configResult[0] || null
    } catch {}

    const email = calendarConfig?.user_email || process.env.ADMIN_EMAIL || 'noah@speakabout.ai'
    const tokens = await calendarClient.loadTokens(email)

    if (!tokens) {
      return NextResponse.json(
        { error: 'Not authenticated with Google Calendar.' },
        { status: 401 }
      )
    }

    await calendarClient.setCredentials(tokens.access_token, tokens.refresh_token)

    const targetCalendarId = calendarConfig?.calendar_id || 'primary'

    // Get all projects that have been synced
    const projects = await sql`
      SELECT id, project_name, google_calendar_event_id
      FROM projects
      WHERE google_calendar_event_id IS NOT NULL
    `

    let deleted = 0
    let failed = 0
    const errors: string[] = []

    for (const project of projects) {
      try {
        await calendarClient.deleteEvent(project.google_calendar_event_id, targetCalendarId)
        deleted++
      } catch (err: any) {
        // If event already deleted on Google's side, still clear our reference
        if (err.code === 410 || err.code === 404) {
          deleted++
        } else {
          failed++
          errors.push(`${project.project_name}: ${err.message || 'Unknown error'}`)
        }
      }

      // Clear the event ID from our database regardless
      await sql`
        UPDATE projects SET google_calendar_event_id = NULL WHERE id = ${project.id}
      `
    }

    return NextResponse.json({
      success: true,
      message: `Removed ${deleted} event${deleted !== 1 ? 's' : ''} from Google Calendar${failed > 0 ? `, ${failed} failed` : ''}`,
      deleted,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error removing synced events:', error)
    return NextResponse.json(
      { error: 'Failed to remove events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function applyConfigDefaults(event: CalendarEvent, config: any): CalendarEvent {
  if (!config) return event

  const enriched = { ...event }

  if (config.include_meet_link && !enriched.conferenceData) {
    enriched.conferenceData = {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    }
  }

  if (config.default_reminder_minutes) {
    enriched.reminders = {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: config.default_reminder_minutes },
        { method: 'email', minutes: 24 * 60 },
      ],
    }
  }

  return enriched
}

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
    let updated = 0
    let failed = 0
    const errors: string[] = []
    let processed = 0

    for (const project of projects) {
      // Throttle to avoid Google API rate limits
      if (processed > 0) {
        await new Promise(resolve => setTimeout(resolve, 350))
      }
      processed++

      const alreadySynced = !!project.google_calendar_event_id

      let success = false
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const calendarEvent = createEventFromProject(project)
          const enrichedEvent = applyConfigDefaults(calendarEvent, calendarConfig)

          if (alreadySynced) {
            // Update existing event
            await calendarClient.updateEvent(
              project.google_calendar_event_id,
              enrichedEvent,
              targetCalendarId
            )
            updated++
          } else {
            // Create new event
            const event = await calendarClient.createEvent(enrichedEvent, targetCalendarId)
            if (event.id) {
              await sql`
                UPDATE projects SET google_calendar_event_id = ${event.id} WHERE id = ${project.id}
              `
            }
            created++
          }

          success = true
          break
        } catch (err: any) {
          // If update fails because event was deleted on Google's side, create a new one
          if (alreadySynced && attempt === 0 && (err.code === 404 || err.code === 410)) {
            // Clear stale ID and retry as a create
            await sql`UPDATE projects SET google_calendar_event_id = NULL WHERE id = ${project.id}`
            project.google_calendar_event_id = null
            await new Promise(resolve => setTimeout(resolve, 500))
            continue
          }

          // On first attempt failure, wait longer and retry
          if (attempt === 0) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          } else {
            failed++
            const errMsg = err?.response?.data?.error?.message || err?.errors?.[0]?.message || err?.message || JSON.stringify(err)
            console.error(`Calendar sync failed for "${project.project_name}":`, errMsg)
            errors.push(`${project.project_name}: ${errMsg}`)
          }
        }
      }
    }

    const parts = []
    if (created > 0) parts.push(`${created} created`)
    if (updated > 0) parts.push(`${updated} updated`)
    if (failed > 0) parts.push(`${failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Google Calendar sync: ${parts.join(', ') || 'no changes'}`,
      created,
      updated,
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

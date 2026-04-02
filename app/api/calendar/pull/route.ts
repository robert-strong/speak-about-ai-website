import { NextRequest, NextResponse } from 'next/server'
import { createGoogleCalendarClient } from '@/lib/google-calendar-client'
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
    } catch {}

    if (calendarConfig && !calendarConfig.enabled) {
      return NextResponse.json(
        { error: 'Google Calendar sync is disabled. Enable it in System > Google Calendar settings.' },
        { status: 400 }
      )
    }

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

    // Ensure tracking columns exist
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(500)`
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS sync_source VARCHAR(20) DEFAULT 'app'`
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS google_calendar_event_updated TEXT`

    // Fetch Google Calendar events: 6 months back, 18 months forward
    const now = new Date()
    const timeMin = new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString()
    const timeMax = new Date(now.getFullYear(), now.getMonth() + 18, 1).toISOString()

    const googleEvents = await calendarClient.getEvents(targetCalendarId, timeMin, timeMax)

    // Load all existing projects with a google_calendar_event_id for fast lookup
    const existingProjects = await sql`
      SELECT id, google_calendar_event_id, sync_source, google_calendar_event_updated
      FROM projects
      WHERE google_calendar_event_id IS NOT NULL
    `
    const projectsByEventId = new Map(
      existingProjects.map((p: any) => [p.google_calendar_event_id, p])
    )

    let created = 0
    let updated = 0
    let skipped = 0
    let failed = 0
    const errors: string[] = []

    for (const gEvent of googleEvents) {
      if (!gEvent.id) continue

      // Skip cancelled events
      if (gEvent.status === 'cancelled') continue

      const existing = projectsByEventId.get(gEvent.id)

      if (existing) {
        // Event already linked to a project
        if (existing.sync_source === 'app') {
          // Pushed from our app — don't overwrite
          skipped++
          continue
        }

        // Previously pulled — check if Google event was updated
        if (existing.google_calendar_event_updated === gEvent.updated) {
          skipped++
          continue
        }

        // Update the pulled project with latest Google data
        try {
          const { eventDate, projectName, location, notes } = parseGoogleEvent(gEvent)

          await sql`
            UPDATE projects SET
              project_name = ${projectName},
              event_date = ${eventDate},
              event_location = ${location},
              notes = ${notes},
              google_calendar_event_updated = ${gEvent.updated || null},
              updated_at = NOW()
            WHERE id = ${existing.id}
          `
          updated++
        } catch (err: any) {
          failed++
          errors.push(`Update ${gEvent.summary || 'Untitled'}: ${err.message}`)
        }
      } else {
        // New event from Google — create a project
        try {
          const { eventDate, projectName, location, notes } = parseGoogleEvent(gEvent)

          await sql`
            INSERT INTO projects (
              project_name, client_name, client_email, project_type,
              start_date, event_date, event_location, event_type, status, priority,
              budget, notes, google_calendar_event_id, sync_source,
              google_calendar_event_updated, created_at, updated_at
            ) VALUES (
              ${projectName},
              '(Google Calendar)',
              '',
              'external',
              ${eventDate},
              ${eventDate},
              ${location},
              'external',
              'qualified',
              'medium',
              '0',
              ${notes},
              ${gEvent.id},
              'google',
              ${gEvent.updated || null},
              NOW(),
              NOW()
            )
          `
          created++
        } catch (err: any) {
          failed++
          errors.push(`Create ${gEvent.summary || 'Untitled'}: ${err.message}`)
        }
      }
    }

    const parts = []
    if (created > 0) parts.push(`${created} new`)
    if (updated > 0) parts.push(`${updated} updated`)
    if (skipped > 0) parts.push(`${skipped} unchanged`)
    if (failed > 0) parts.push(`${failed} failed`)

    return NextResponse.json({
      success: true,
      message: `Pull from Google Calendar: ${parts.join(', ') || 'no events found'}`,
      created,
      updated,
      skipped,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Error pulling from Google Calendar:', error)
    return NextResponse.json(
      { error: 'Failed to pull events', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * Parse a Google Calendar event into project-compatible fields
 */
function parseGoogleEvent(gEvent: any) {
  const summary = gEvent.summary || 'Untitled Event'

  // Extract date — handle both dateTime and all-day (date) events
  let eventDate: string | null = null
  if (gEvent.start?.dateTime) {
    eventDate = gEvent.start.dateTime
  } else if (gEvent.start?.date) {
    // All-day event — store as date with time set to midnight Pacific
    eventDate = `${gEvent.start.date}T09:00:00`
  }

  return {
    projectName: summary,
    eventDate,
    location: gEvent.location || null,
    notes: gEvent.description || null,
  }
}

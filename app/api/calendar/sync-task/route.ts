import { NextRequest, NextResponse } from 'next/server'
import { createGoogleCalendarClient, createEventFromTask, CalendarEvent } from '@/lib/google-calendar-client'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

/**
 * Ensure the tracking columns exist (idempotent — mirrors migration 024).
 */
async function ensureColumns() {
  await sql`ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(500)`
  await sql`ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS google_calendar_synced_at TIMESTAMP WITH TIME ZONE`
}

async function loadConfigAndClient() {
  let calendarConfig: any = null
  try {
    const configResult = await sql`SELECT * FROM google_calendar_config LIMIT 1`
    calendarConfig = configResult[0] || null
  } catch {
    // Table may not exist yet — use defaults
  }

  if (calendarConfig && !calendarConfig.enabled) {
    return { disabled: true as const, calendarConfig }
  }

  const calendarClient = createGoogleCalendarClient()
  const email = calendarConfig?.user_email || process.env.ADMIN_EMAIL || 'noah@speakabout.ai'
  const tokens = await calendarClient.loadTokens(email)

  if (!tokens) {
    return { unauthenticated: true as const, calendarConfig }
  }

  await calendarClient.setCredentials(tokens.access_token, tokens.refresh_token)
  return { calendarClient, calendarConfig }
}

function applyConfigDefaults(event: CalendarEvent, config: any): CalendarEvent {
  if (!config) return event
  const enriched = { ...event }
  if (config.default_reminder_minutes && enriched.reminders) {
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

// POST — create or update the Google Calendar event for a single task
export async function POST(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { taskId } = await request.json()
    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
    }

    await ensureColumns()

    // Load the task joined with its project
    const rows = await sql`
      SELECT t.*, p.project_name, p.event_date, p.event_location, p.client_name,
             p.client_email, p.notes, p.event_type, p.requested_speaker_name,
             p.project_details, p.status AS project_status
      FROM project_tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.id = ${taskId}
    `
    const task = rows[0]
    if (!task) {
      return NextResponse.json({ error: 'Task not found' }, { status: 404 })
    }

    const ctx = await loadConfigAndClient()
    if ('disabled' in ctx) {
      return NextResponse.json(
        { error: 'Google Calendar sync is disabled', message: 'Enable calendar sync in System > Google Calendar settings' },
        { status: 400 }
      )
    }
    if ('unauthenticated' in ctx) {
      return NextResponse.json(
        { error: 'Not authenticated with Google Calendar', message: 'Connect your Google account in System > Google Calendar settings' },
        { status: 401 }
      )
    }
    const { calendarClient, calendarConfig } = ctx
    const targetCalendarId = calendarConfig?.calendar_id || 'primary'

    // No due date, or project is dead → remove any existing event instead
    const shouldRemove =
      !task.due_date ||
      ['lost', 'cancelled'].includes(task.project_status)

    if (shouldRemove) {
      if (task.google_calendar_event_id) {
        try {
          await calendarClient.deleteEvent(task.google_calendar_event_id, targetCalendarId)
        } catch (err: any) {
          if (err.code !== 404 && err.code !== 410) throw err
        }
        await sql`
          UPDATE project_tasks
          SET google_calendar_event_id = NULL, google_calendar_synced_at = NULL
          WHERE id = ${taskId}
        `
      }
      return NextResponse.json({ success: true, removed: true })
    }

    const calendarEvent = applyConfigDefaults(createEventFromTask(task, task), calendarConfig)

    let event
    if (task.google_calendar_event_id) {
      try {
        event = await calendarClient.updateEvent(task.google_calendar_event_id, calendarEvent, targetCalendarId)
      } catch (err: any) {
        // Event deleted on Google's side — create a fresh one
        if (err.code === 404 || err.code === 410) {
          event = await calendarClient.createEvent(calendarEvent, targetCalendarId)
        } else {
          throw err
        }
      }
    } else {
      event = await calendarClient.createEvent(calendarEvent, targetCalendarId)
    }

    if (event?.id) {
      await sql`
        UPDATE project_tasks
        SET google_calendar_event_id = ${event.id}, google_calendar_synced_at = NOW()
        WHERE id = ${taskId}
      `
    }

    return NextResponse.json({ success: true, event, message: 'Task synced to Google Calendar' })
  } catch (error) {
    console.error('Error syncing task to calendar:', error)
    return NextResponse.json(
      { error: 'Failed to sync task', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// DELETE — remove the Google Calendar event for a task (body: { taskId })
export async function DELETE(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { taskId } = await request.json()
    if (!taskId) {
      return NextResponse.json({ error: 'taskId is required' }, { status: 400 })
    }

    await ensureColumns()

    const rows = await sql`SELECT * FROM project_tasks WHERE id = ${taskId}`
    const task = rows[0]
    if (!task || !task.google_calendar_event_id) {
      return NextResponse.json({ success: true, removed: false })
    }

    const ctx = await loadConfigAndClient()
    if ('disabled' in ctx || 'unauthenticated' in ctx) {
      // Can't reach Google, but clear our reference so we don't keep a stale id
      await sql`UPDATE project_tasks SET google_calendar_event_id = NULL, google_calendar_synced_at = NULL WHERE id = ${taskId}`
      return NextResponse.json({ success: true, removed: false })
    }
    const { calendarClient, calendarConfig } = ctx
    const targetCalendarId = calendarConfig?.calendar_id || 'primary'

    try {
      await calendarClient.deleteEvent(task.google_calendar_event_id, targetCalendarId)
    } catch (err: any) {
      if (err.code !== 404 && err.code !== 410) throw err
    }

    await sql`UPDATE project_tasks SET google_calendar_event_id = NULL, google_calendar_synced_at = NULL WHERE id = ${taskId}`
    return NextResponse.json({ success: true, removed: true })
  } catch (error) {
    console.error('Error removing task calendar event:', error)
    return NextResponse.json(
      { error: 'Failed to remove task event', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

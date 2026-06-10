import { NextRequest, NextResponse } from 'next/server'
import { createGoogleCalendarClient, createEventFromProject, createEventFromTask, CalendarEvent } from '@/lib/google-calendar-client'
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

    // Ensure tracking columns exist
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(500)`
    await sql`ALTER TABLE projects ADD COLUMN IF NOT EXISTS google_calendar_synced_at TIMESTAMP WITH TIME ZONE`

    // STEP 1: Delete Google Calendar events for projects that should no longer have them
    // - Status is 'lost' or 'cancelled'
    // - event_date is NULL but google_calendar_event_id exists
    const projectsToRemove = await sql`
      SELECT id, project_name, google_calendar_event_id
      FROM projects
      WHERE google_calendar_event_id IS NOT NULL
        AND (
          status IN ('lost', 'cancelled')
          OR event_date IS NULL
        )
    `

    let removed = 0
    let removeFailed = 0
    const removeErrors: string[] = []

    for (const project of projectsToRemove) {
      try {
        await calendarClient.deleteEvent(project.google_calendar_event_id, targetCalendarId)
        removed++
      } catch (err: any) {
        // If event already deleted on Google's side, still clear our reference
        if (err.code === 410 || err.code === 404) {
          removed++
        } else {
          removeFailed++
          removeErrors.push(`Remove ${project.project_name}: ${err.message || 'Unknown error'}`)
        }
      }

      // Clear the event ID from our database regardless
      await sql`
        UPDATE projects
        SET google_calendar_event_id = NULL, google_calendar_synced_at = NULL
        WHERE id = ${project.id}
      `

      // Throttle
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // STEP 2: Get projects that need syncing (create or update)
    // - Has event_date and status is NOT lost/cancelled
    // - Either new (no google_calendar_event_id) or changed (updated_at > synced_at)
    const projects = await sql`
      SELECT id, project_name, event_date, event_location, client_name,
             client_email, notes, event_type, google_calendar_event_id,
             updated_at, google_calendar_synced_at, project_details
      FROM projects
      WHERE event_date IS NOT NULL
        AND status NOT IN ('lost', 'cancelled')
        AND (
          google_calendar_event_id IS NULL
          OR google_calendar_synced_at IS NULL
          OR updated_at > google_calendar_synced_at
        )
      ORDER BY event_date ASC
    `

    // Also count how many are already up to date
    const upToDateResult = await sql`
      SELECT COUNT(*) as count FROM projects
      WHERE event_date IS NOT NULL
        AND status NOT IN ('lost', 'cancelled')
        AND google_calendar_event_id IS NOT NULL
        AND google_calendar_synced_at IS NOT NULL
        AND updated_at <= google_calendar_synced_at
    `
    const skipped = parseInt(upToDateResult[0]?.count || '0')

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
            await sql`
              UPDATE projects SET google_calendar_synced_at = NOW() WHERE id = ${project.id}
            `
            updated++
          } else {
            // Create new event
            const event = await calendarClient.createEvent(enrichedEvent, targetCalendarId)
            if (event.id) {
              await sql`
                UPDATE projects
                SET google_calendar_event_id = ${event.id},
                    google_calendar_synced_at = NOW()
                WHERE id = ${project.id}
              `
            }
            created++
          }

          break
        } catch (err: any) {
          // If update fails because event was deleted on Google's side, create a new one
          if (alreadySynced && attempt === 0 && (err.code === 404 || err.code === 410)) {
            await sql`UPDATE projects SET google_calendar_event_id = NULL WHERE id = ${project.id}`
            project.google_calendar_event_id = null
            await new Promise(resolve => setTimeout(resolve, 500))
            continue
          }

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

    // STEP 3: Sync project TASKS that have a due date (all-day reminder events)
    await sql`ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(500)`
    await sql`ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS google_calendar_synced_at TIMESTAMP WITH TIME ZONE`

    // 3a: Remove task events that should no longer exist
    // (due_date cleared, task completed, or parent project lost/cancelled)
    const taskEventsToRemove = await sql`
      SELECT t.id, t.google_calendar_event_id
      FROM project_tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.google_calendar_event_id IS NOT NULL
        AND (
          t.due_date IS NULL
          OR t.completed = true
          OR p.status IN ('lost', 'cancelled')
        )
    `
    for (const task of taskEventsToRemove) {
      try {
        await calendarClient.deleteEvent(task.google_calendar_event_id, targetCalendarId)
        removed++
      } catch (err: any) {
        if (err.code === 410 || err.code === 404) {
          removed++
        } else {
          removeFailed++
          removeErrors.push(`Remove task event: ${err.message || 'Unknown error'}`)
        }
      }
      await sql`
        UPDATE project_tasks
        SET google_calendar_event_id = NULL, google_calendar_synced_at = NULL
        WHERE id = ${task.id}
      `
      await new Promise(resolve => setTimeout(resolve, 200))
    }

    // 3b: Create/update task events that need syncing
    const tasks = await sql`
      SELECT t.*, p.project_name, p.event_date, p.event_location, p.client_name,
             p.client_email, p.notes, p.event_type, p.requested_speaker_name,
             p.project_details
      FROM project_tasks t
      JOIN projects p ON p.id = t.project_id
      WHERE t.due_date IS NOT NULL
        AND t.completed = false
        AND p.status NOT IN ('lost', 'cancelled')
        AND (
          t.google_calendar_event_id IS NULL
          OR t.google_calendar_synced_at IS NULL
          OR t.updated_at > t.google_calendar_synced_at
        )
      ORDER BY t.due_date ASC
    `

    for (const task of tasks) {
      await new Promise(resolve => setTimeout(resolve, 350))
      const alreadySynced = !!task.google_calendar_event_id
      try {
        const taskEvent = applyConfigDefaults(createEventFromTask(task, task), calendarConfig)
        if (alreadySynced) {
          try {
            await calendarClient.updateEvent(task.google_calendar_event_id, taskEvent, targetCalendarId)
            await sql`UPDATE project_tasks SET google_calendar_synced_at = NOW() WHERE id = ${task.id}`
            updated++
          } catch (err: any) {
            if (err.code === 404 || err.code === 410) {
              const event = await calendarClient.createEvent(taskEvent, targetCalendarId)
              await sql`UPDATE project_tasks SET google_calendar_event_id = ${event.id}, google_calendar_synced_at = NOW() WHERE id = ${task.id}`
              created++
            } else {
              throw err
            }
          }
        } else {
          const event = await calendarClient.createEvent(taskEvent, targetCalendarId)
          if (event.id) {
            await sql`UPDATE project_tasks SET google_calendar_event_id = ${event.id}, google_calendar_synced_at = NOW() WHERE id = ${task.id}`
          }
          created++
        }
      } catch (err: any) {
        failed++
        const errMsg = err?.response?.data?.error?.message || err?.errors?.[0]?.message || err?.message || JSON.stringify(err)
        errors.push(`Task "${task.task_name}": ${errMsg}`)
      }
    }

    const parts = []
    if (created > 0) parts.push(`${created} created`)
    if (updated > 0) parts.push(`${updated} updated`)
    if (removed > 0) parts.push(`${removed} removed`)
    if (skipped > 0) parts.push(`${skipped} unchanged`)
    if (failed > 0 || removeFailed > 0) parts.push(`${failed + removeFailed} failed`)

    const allErrors = [...removeErrors, ...errors]

    return NextResponse.json({
      success: true,
      message: `Google Calendar sync: ${parts.join(', ') || 'everything up to date'}`,
      created,
      updated,
      removed,
      skipped,
      failed: failed + removeFailed,
      errors: allErrors.length > 0 ? allErrors : undefined,
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

      // Clear the event ID and sync timestamp from our database regardless
      await sql`
        UPDATE projects SET google_calendar_event_id = NULL, google_calendar_synced_at = NULL WHERE id = ${project.id}
      `
    }

    // Also remove any synced task events
    try {
      await sql`ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS google_calendar_event_id VARCHAR(500)`
      await sql`ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS google_calendar_synced_at TIMESTAMP WITH TIME ZONE`
      const syncedTasks = await sql`
        SELECT id, task_name, google_calendar_event_id
        FROM project_tasks
        WHERE google_calendar_event_id IS NOT NULL
      `
      for (const task of syncedTasks) {
        try {
          await calendarClient.deleteEvent(task.google_calendar_event_id, targetCalendarId)
          deleted++
        } catch (err: any) {
          if (err.code === 410 || err.code === 404) {
            deleted++
          } else {
            failed++
            errors.push(`Task "${task.task_name}": ${err.message || 'Unknown error'}`)
          }
        }
        await sql`UPDATE project_tasks SET google_calendar_event_id = NULL, google_calendar_synced_at = NULL WHERE id = ${task.id}`
      }
    } catch (err) {
      // project_tasks table may not exist — ignore
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

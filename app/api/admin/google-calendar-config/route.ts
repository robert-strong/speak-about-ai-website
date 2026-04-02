import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { createGoogleCalendarClient } from '@/lib/google-calendar-client'

const sql = neon(process.env.DATABASE_URL!)

// Ensure config table exists
async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS google_calendar_config (
      id SERIAL PRIMARY KEY,
      enabled BOOLEAN DEFAULT FALSE,
      calendar_id VARCHAR(500) DEFAULT 'primary',
      calendar_name VARCHAR(255) DEFAULT 'Primary',
      user_email VARCHAR(255),
      auto_sync BOOLEAN DEFAULT FALSE,
      include_meet_link BOOLEAN DEFAULT FALSE,
      default_reminder_minutes INTEGER DEFAULT 60,
      connected BOOLEAN DEFAULT FALSE,
      connected_at TIMESTAMP WITH TIME ZONE,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `
}

// GET - Load calendar sync config + connection status
export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    await ensureTable()

    const result = await sql`SELECT * FROM google_calendar_config ORDER BY id LIMIT 1`

    // Check if OAuth tokens exist
    const tokens = await sql`SELECT user_email, updated_at FROM gmail_auth_tokens LIMIT 1`
    const hasOAuthConnection = tokens.length > 0
    const connectedEmail = hasOAuthConnection ? tokens[0].user_email : null

    // If we have a connection, try to list calendars
    let calendars: Array<{ id: string; summary: string; primary: boolean }> = []
    if (hasOAuthConnection) {
      try {
        const calendarClient = createGoogleCalendarClient()
        const tokenData = await calendarClient.loadTokens(connectedEmail!)
        if (tokenData) {
          await calendarClient.setCredentials(tokenData.access_token, tokenData.refresh_token)
          const calendarList = await calendarClient.listCalendars()
          calendars = (calendarList as any[]).map((c: any) => ({
            id: c.id,
            summary: c.summary || c.id,
            primary: c.primary || false,
          }))
        }
      } catch (err) {
        console.error('Error fetching calendars:', err)
      }
    }

    return NextResponse.json({
      config: result[0] || null,
      connected: hasOAuthConnection,
      connectedEmail,
      calendars,
    })
  } catch (error) {
    console.error('Error loading Google Calendar config:', error)
    return NextResponse.json({ error: 'Failed to load configuration' }, { status: 500 })
  }
}

// PUT - Save calendar sync config
export async function PUT(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    await ensureTable()

    const { config } = await request.json()

    const existing = await sql`SELECT id FROM google_calendar_config LIMIT 1`

    if (existing.length > 0) {
      await sql`
        UPDATE google_calendar_config SET
          enabled = ${config.enabled ?? false},
          calendar_id = ${config.calendar_id || 'primary'},
          calendar_name = ${config.calendar_name || 'Primary'},
          user_email = ${config.user_email || null},
          auto_sync = ${config.auto_sync ?? false},
          include_meet_link = ${config.include_meet_link ?? false},
          default_reminder_minutes = ${config.default_reminder_minutes ?? 60},
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `
    } else {
      await sql`
        INSERT INTO google_calendar_config (
          enabled, calendar_id, calendar_name, user_email, auto_sync,
          include_meet_link, default_reminder_minutes
        ) VALUES (
          ${config.enabled ?? false},
          ${config.calendar_id || 'primary'},
          ${config.calendar_name || 'Primary'},
          ${config.user_email || null},
          ${config.auto_sync ?? false},
          ${config.include_meet_link ?? false},
          ${config.default_reminder_minutes ?? 60}
        )
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving Google Calendar config:', error)
    return NextResponse.json({ error: 'Failed to save configuration' }, { status: 500 })
  }
}

// POST - Test connection / sync a test event
export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const { action } = await request.json()

    if (action === 'test') {
      // Test the calendar connection by listing upcoming events
      const tokens = await sql`SELECT user_email FROM gmail_auth_tokens LIMIT 1`
      if (tokens.length === 0) {
        return NextResponse.json({ error: 'No Google account connected. Please connect via Email/SMTP settings first.' }, { status: 400 })
      }

      const calendarClient = createGoogleCalendarClient()
      const tokenData = await calendarClient.loadTokens(tokens[0].user_email)
      if (!tokenData) {
        return NextResponse.json({ error: 'OAuth tokens expired. Please reconnect your Google account.' }, { status: 400 })
      }

      await calendarClient.setCredentials(tokenData.access_token, tokenData.refresh_token)

      // Get config to use the selected calendar
      const configResult = await sql`SELECT calendar_id FROM google_calendar_config LIMIT 1`
      const calendarId = configResult[0]?.calendar_id || 'primary'

      const events = await calendarClient.getUpcomingEvents(5, calendarId)

      return NextResponse.json({
        success: true,
        message: `Connection successful! Found ${events.length} upcoming event${events.length !== 1 ? 's' : ''} on this calendar.`,
        eventCount: events.length,
      })
    }

    if (action === 'disconnect') {
      await ensureTable()
      await sql`UPDATE google_calendar_config SET enabled = false, updated_at = NOW()`
      return NextResponse.json({ success: true, message: 'Calendar sync disabled' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    console.error('Error in calendar config action:', error)
    return NextResponse.json({
      error: error.message || 'Failed to perform action',
    }, { status: 500 })
  }
}

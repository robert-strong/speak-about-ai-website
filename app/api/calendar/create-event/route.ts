import { NextRequest, NextResponse } from 'next/server'
import { createGoogleCalendarClient, createEventFromProject } from '@/lib/google-calendar-client'
import { requireAdminAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { projectId, dealId, customEvent, userEmail } = body

    // Initialize calendar client
    const calendarClient = createGoogleCalendarClient()

    // Load tokens for the user
    const email = userEmail || process.env.ADMIN_EMAIL || 'noah@speakabout.ai'
    const tokens = await calendarClient.loadTokens(email)

    if (!tokens) {
      return NextResponse.json(
        {
          error: 'Not authenticated with Google Calendar',
          message: 'Please authenticate first by visiting /api/auth/gmail',
        },
        { status: 401 }
      )
    }

    await calendarClient.setCredentials(tokens.access_token, tokens.refresh_token)

    let event

    if (customEvent) {
      // Create custom event
      event = await calendarClient.createEvent(customEvent)
    } else if (projectId || dealId) {
      // Create event from project/deal
      const { neon } = await import('@neondatabase/serverless')
      const sql = neon(process.env.DATABASE_URL!)

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
      event = await calendarClient.createEvent(calendarEvent)
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

import { google } from 'googleapis'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export interface CalendarEvent {
  summary: string // Event title
  description?: string
  location?: string
  start: {
    dateTime: string // ISO 8601 format: '2024-10-21T10:00:00-07:00'
    timeZone?: string // e.g., 'America/Los_Angeles'
  }
  end: {
    dateTime: string
    timeZone?: string
  }
  attendees?: Array<{
    email: string
    displayName?: string
    responseStatus?: 'needsAction' | 'declined' | 'tentative' | 'accepted'
  }>
  reminders?: {
    useDefault: boolean
    overrides?: Array<{
      method: 'email' | 'popup'
      minutes: number // e.g., 30 for 30 minutes before
    }>
  }
  conferenceData?: {
    createRequest?: {
      requestId: string
      conferenceSolutionKey: {
        type: 'hangoutsMeet' // Google Meet
      }
    }
  }
}

export class GoogleCalendarClient {
  private oauth2Client: any

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/gmail/callback`
    )
  }

  getAuthUrl(state?: string) {
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/calendar', // Add calendar access
      'https://www.googleapis.com/auth/calendar.events', // Create/edit events
    ]

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state || '',
      prompt: 'consent',
    })
  }

  async setCredentials(accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
  }

  async loadTokens(userEmail: string) {
    const result = await sql`
      SELECT * FROM gmail_auth_tokens
      WHERE user_email = ${userEmail}
      LIMIT 1
    `

    if (result.length === 0) {
      return null
    }

    const tokens = result[0]

    // Check if token is expired
    if (new Date(tokens.token_expiry) < new Date()) {
      this.oauth2Client.setCredentials({
        refresh_token: tokens.refresh_token,
      })

      const { credentials } = await this.oauth2Client.refreshAccessToken()
      await this.saveTokens(userEmail, credentials)

      return credentials
    }

    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    }
  }

  async saveTokens(userEmail: string, tokens: any) {
    const expiryDate = tokens.expiry_date
      ? new Date(tokens.expiry_date)
      : new Date(Date.now() + 3600 * 1000)

    await sql`
      INSERT INTO gmail_auth_tokens (
        user_email,
        access_token,
        refresh_token,
        token_expiry,
        updated_at
      ) VALUES (
        ${userEmail},
        ${tokens.access_token},
        ${tokens.refresh_token},
        ${expiryDate},
        NOW()
      )
      ON CONFLICT (user_email) DO UPDATE SET
        access_token = EXCLUDED.access_token,
        refresh_token = COALESCE(EXCLUDED.refresh_token, gmail_auth_tokens.refresh_token),
        token_expiry = EXCLUDED.token_expiry,
        updated_at = NOW()
    `
  }

  /**
   * Create a calendar event
   */
  async createEvent(event: CalendarEvent, calendarId: string = 'primary') {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

    // Always add human@speakabout.ai to attendees
    const attendees = event.attendees || []
    const adminEmail = 'human@speakabout.ai'

    // Check if admin email is already in the list
    const hasAdmin = attendees.some(a => a.email === adminEmail)
    if (!hasAdmin) {
      attendees.push({
        email: adminEmail,
        displayName: 'Speak About AI Admin'
      })
    }

    const eventWithAdmin = {
      ...event,
      attendees
    }

    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventWithAdmin,
      sendUpdates: 'all', // Send email invitations to all attendees
      conferenceDataVersion: event.conferenceData ? 1 : 0, // Required for Google Meet
    })

    return response.data
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(
    eventId: string,
    event: Partial<CalendarEvent>,
    calendarId: string = 'primary'
  ) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

    // If attendees are being updated, ensure admin is included
    let eventUpdate = event
    if (event.attendees) {
      const attendees = event.attendees
      const adminEmail = 'human@speakabout.ai'
      const hasAdmin = attendees.some(a => a.email === adminEmail)

      if (!hasAdmin) {
        attendees.push({
          email: adminEmail,
          displayName: 'Speak About AI Admin'
        })
      }

      eventUpdate = {
        ...event,
        attendees
      }
    }

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: eventUpdate,
      sendUpdates: 'all',
    })

    return response.data
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string, calendarId: string = 'primary') {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

    await calendar.events.delete({
      calendarId,
      eventId,
      sendUpdates: 'all', // Notify attendees
    })
  }

  /**
   * Get upcoming events
   */
  async getUpcomingEvents(maxResults: number = 10, calendarId: string = 'primary') {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

    const response = await calendar.events.list({
      calendarId,
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    })

    return response.data.items || []
  }

  /**
   * Get event by ID
   */
  async getEvent(eventId: string, calendarId: string = 'primary') {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

    const response = await calendar.events.get({
      calendarId,
      eventId,
    })

    return response.data
  }

  /**
   * List all calendars
   */
  async listCalendars() {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

    const response = await calendar.calendarList.list()

    return response.data.items || []
  }
}

export const createGoogleCalendarClient = () => new GoogleCalendarClient()

/**
 * Helper function to create a calendar event from project/deal data
 */
export function createEventFromProject(project: {
  project_name: string
  event_date: string
  event_location?: string
  client_name: string
  client_email?: string
  notes?: string
  event_type?: string
}): CalendarEvent {
  const eventDate = new Date(project.event_date)
  const eventEnd = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000) // 2 hours

  return {
    summary: project.project_name,
    description: `Event Type: ${project.event_type || 'N/A'}\nClient: ${project.client_name}\n\n${project.notes || ''}`,
    location: project.event_location,
    start: {
      dateTime: eventDate.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: eventEnd.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    attendees: project.client_email
      ? [
          {
            email: project.client_email,
            displayName: project.client_name,
          },
        ]
      : undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 }, // 1 hour before
      ],
    },
  }
}

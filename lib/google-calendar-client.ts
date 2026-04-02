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

    // Strip attendees — no guests added to calendar events
    const { attendees, ...eventWithoutAttendees } = event

    const response = await calendar.events.insert({
      calendarId,
      requestBody: eventWithoutAttendees,
      sendUpdates: 'none',
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

    // Strip attendees — no guests added to calendar events
    const { attendees, ...eventWithoutAttendees } = event

    const response = await calendar.events.patch({
      calendarId,
      eventId,
      requestBody: eventWithoutAttendees,
      sendUpdates: 'none',
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
      sendUpdates: 'none',
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
   * Get all events in a date range (for pull sync)
   */
  async getEvents(calendarId: string = 'primary', timeMin?: string, timeMax?: string) {
    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client })

    const params: any = {
      calendarId,
      singleEvents: true,
      orderBy: 'startTime',
      maxResults: 2500,
    }
    if (timeMin) params.timeMin = timeMin
    if (timeMax) params.timeMax = timeMax

    const response = await calendar.events.list(params)
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
  project_details?: any
}): CalendarEvent {
  // Convert to string if Date object, then extract YYYY-MM-DD to avoid UTC shift
  const rawDate = project.event_date instanceof Date
    ? project.event_date.toISOString()
    : String(project.event_date)
  const dateStr = rawDate.split('T')[0] // e.g. "2024-10-21"
  const startDateTime = `${dateStr}T09:00:00` // 9 AM Pacific
  const endDateTime = `${dateStr}T11:00:00`   // 11 AM Pacific (2 hours)

  // Build rich description from project details
  const description = buildEventDescription(project)

  return {
    summary: project.project_name,
    description,
    location: project.event_location,
    start: {
      dateTime: startDateTime,
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: endDateTime,
      timeZone: 'America/Los_Angeles',
    },
    attendees: undefined,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 }, // 1 hour before
      ],
    },
  }
}

/**
 * Build a rich event description from project data and project_details JSONB
 */
function buildEventDescription(project: {
  project_name: string
  client_name: string
  event_type?: string
  notes?: string
  project_details?: any
}): string {
  const details = project.project_details || {}
  const sections: string[] = []

  // -- EVENT DETAILS --
  const eventLines: string[] = []
  eventLines.push(`Client: ${project.client_name}`)
  if (project.event_type) eventLines.push(`Event Type: ${project.event_type}`)

  const ed = details.event_details
  if (ed) {
    if (ed.event_title) eventLines.push(`Event Title: ${ed.event_title}`)
    if (ed.event_theme) eventLines.push(`Theme: ${ed.event_theme}`)
    if (ed.event_purpose) eventLines.push(`Purpose: ${ed.event_purpose}`)
    if (ed.organization_description) eventLines.push(`Organization: ${ed.organization_description}`)
    if (ed.key_message_goals) eventLines.push(`Key Message Goals: ${ed.key_message_goals}`)
    if (ed.speaker_selection_reason) eventLines.push(`Why This Speaker: ${ed.speaker_selection_reason}`)
  }

  const overview = details.overview
  if (overview) {
    if (overview.speaker_name) eventLines.push(`Speaker: ${overview.speaker_name}${overview.speaker_title ? ` (${overview.speaker_title})` : ''}`)
    if (overview.event_name) eventLines.push(`Event Name: ${overview.event_name}`)
    if (overview.event_website) eventLines.push(`Website: ${overview.event_website}`)
  }

  if (eventLines.length > 0) {
    sections.push(`── EVENT DETAILS ──\n${eventLines.join('\n')}`)
  }

  // -- SPEAKER PROGRAM --
  const prog = details.program_details
  if (prog) {
    const progLines: string[] = []
    if (prog.requested_speaker_name) progLines.push(`Speaker: ${prog.requested_speaker_name}`)
    if (prog.program_topic) progLines.push(`Topic: ${prog.program_topic}`)
    if (prog.program_type) {
      const typeLabel = prog.program_type === 'other' ? (prog.program_type_other || 'Other') : prog.program_type.replace(/_/g, ' ')
      progLines.push(`Format: ${typeLabel}`)
    }
    if (prog.audience_size) progLines.push(`Audience Size: ${prog.audience_size}`)
    if (prog.audience_demographics) progLines.push(`Audience: ${prog.audience_demographics}`)
    if (prog.speaker_attire) progLines.push(`Attire: ${prog.speaker_attire.replace(/_/g, ' ')}`)

    if (progLines.length > 0) {
      sections.push(`── SPEAKER PROGRAM ──\n${progLines.join('\n')}`)
    }
  }

  // -- SCHEDULE --
  const sched = details.event_schedule
  if (sched) {
    const schedLines: string[] = []
    if (sched.event_start_time) schedLines.push(`Event Start: ${sched.event_start_time}`)
    if (sched.event_end_time) schedLines.push(`Event End: ${sched.event_end_time}`)
    if (sched.speaker_arrival_time) schedLines.push(`Speaker Arrival: ${sched.speaker_arrival_time}`)
    if (sched.program_start_time) schedLines.push(`Program Start: ${sched.program_start_time}`)
    if (sched.program_length_minutes) schedLines.push(`Program Length: ${sched.program_length_minutes} min`)
    if (sched.qa_length_minutes) schedLines.push(`Q&A: ${sched.qa_length_minutes} min`)
    if (sched.speaker_departure_time) schedLines.push(`Speaker Departure: ${sched.speaker_departure_time}`)
    if (sched.detailed_timeline) schedLines.push(`\nTimeline:\n${sched.detailed_timeline}`)
    if (sched.timezone) schedLines.push(`Timezone: ${sched.timezone}`)

    if (schedLines.length > 0) {
      sections.push(`── SCHEDULE ──\n${schedLines.join('\n')}`)
    }
  }

  // -- ITINERARY (day-of schedule items) --
  const itin = details.itinerary
  if (itin?.schedule && itin.schedule.length > 0) {
    const itinLines = itin.schedule.map((item: any) => {
      const time = [item.start_time, item.end_time].filter(Boolean).join(' - ')
      return `${time ? time + ': ' : ''}${item.activity || ''}${item.location ? ` (${item.location})` : ''}${item.notes ? ` — ${item.notes}` : ''}`
    })
    sections.push(`── DAY-OF ITINERARY ──\n${itinLines.join('\n')}`)
  }

  // -- NOTES --
  if (project.notes) {
    sections.push(`── NOTES ──\n${project.notes}`)
  }

  return sections.join('\n\n')
}

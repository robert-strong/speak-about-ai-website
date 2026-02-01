import { google } from 'googleapis'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export interface GmailMessage {
  id: string
  threadId: string
  labelIds: string[]
  snippet: string
  internalDate: string
  payload: {
    headers: Array<{ name: string; value: string }>
    mimeType: string
    body?: { data?: string }
    parts?: Array<{
      mimeType: string
      body?: { data?: string }
    }>
  }
}

export class GmailClient {
  private oauth2Client: any

  constructor() {
    // Use localhost for development, production URL otherwise
    const baseUrl = process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : (process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000')

    this.oauth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      `${baseUrl}/api/auth/gmail/callback`
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
      prompt: 'consent', // Force consent screen to get refresh token
    })
  }

  async getTokensFromCode(code: string) {
    const { tokens } = await this.oauth2Client.getToken(code)
    return tokens
  }

  async setCredentials(accessToken: string, refreshToken?: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    })
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
      // Refresh the token
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

  async getUserEmail() {
    const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client })
    const { data } = await oauth2.userinfo.get()
    return data.email
  }

  async listMessages(query?: string, maxResults: number = 50): Promise<GmailMessage[]> {
    const gmail = google.gmail({ version: 'v1', auth: this.oauth2Client })

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    })

    const messages = response.data.messages || []
    const fullMessages: GmailMessage[] = []

    for (const message of messages) {
      const fullMessage = await gmail.users.messages.get({
        userId: 'me',
        id: message.id!,
        format: 'full',
      })
      fullMessages.push(fullMessage.data as GmailMessage)
    }

    return fullMessages
  }

  extractHeader(message: GmailMessage, headerName: string): string | undefined {
    const header = message.payload.headers.find(
      (h) => h.name.toLowerCase() === headerName.toLowerCase()
    )
    return header?.value
  }

  extractBody(message: GmailMessage): string {
    const getBodyData = (part: any): string | null => {
      if (part.body?.data) {
        return Buffer.from(part.body.data, 'base64').toString('utf-8')
      }
      if (part.parts) {
        for (const subPart of part.parts) {
          const data = getBodyData(subPart)
          if (data) return data
        }
      }
      return null
    }

    const body = getBodyData(message.payload)
    return body || message.snippet || ''
  }

  parseEmailList(emailString: string): string[] {
    if (!emailString) return []
    const emailRegex = /[\w.-]+@[\w.-]+\.\w+/g
    return emailString.match(emailRegex) || []
  }
}

export const createGmailClient = () => new GmailClient()

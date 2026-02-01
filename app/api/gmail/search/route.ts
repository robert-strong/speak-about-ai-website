import { NextRequest, NextResponse } from 'next/server'
import { createGmailClient } from '@/lib/gmail-client'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const clientEmail = searchParams.get('email')
    const maxResults = parseInt(searchParams.get('max') || '20')

    if (!clientEmail) {
      return NextResponse.json({ error: 'email parameter is required' }, { status: 400 })
    }

    // Get any connected Gmail account (for admin searches)
    // In production, you'd want to verify the admin user, but for now we just check if any Gmail is connected
    const connectedAccounts = await sql`
      SELECT user_email FROM gmail_auth_tokens
      ORDER BY updated_at DESC
      LIMIT 1
    `

    if (connectedAccounts.length === 0) {
      return NextResponse.json({
        error: 'Gmail not connected',
        needsAuth: true,
        message: 'Please connect your Gmail account first'
      }, { status: 401 })
    }

    const userEmail = connectedAccounts[0].user_email
    console.log('Gmail search: Using connected account:', userEmail)

    const gmailClient = createGmailClient()

    // Load tokens for the connected Gmail account
    const tokens = await gmailClient.loadTokens(userEmail)
    if (!tokens) {
      return NextResponse.json({
        error: 'Gmail tokens expired',
        needsAuth: true,
        message: 'Please reconnect your Gmail account'
      }, { status: 401 })
    }

    await gmailClient.setCredentials(tokens.access_token, tokens.refresh_token)

    // Search Gmail for emails from/to this client
    const query = `from:${clientEmail} OR to:${clientEmail}`
    const messages = await gmailClient.listMessages(query, maxResults)

    // Format messages for response
    const formattedMessages = messages.map(message => {
      const from = gmailClient.extractHeader(message, 'From') || ''
      const to = gmailClient.extractHeader(message, 'To') || ''
      const subject = gmailClient.extractHeader(message, 'Subject') || '(no subject)'
      const date = gmailClient.extractHeader(message, 'Date') || ''
      const bodyFull = gmailClient.extractBody(message)
      const receivedAt = new Date(parseInt(message.internalDate))

      return {
        id: message.id,
        threadId: message.threadId,
        subject,
        from,
        to,
        date,
        body_snippet: message.snippet,
        body_full: bodyFull,
        received_at: receivedAt.toISOString(),
        labels: message.labelIds
      }
    })

    return NextResponse.json({
      success: true,
      emails: formattedMessages,
      count: formattedMessages.length,
      searchedFor: clientEmail
    })
  } catch (error) {
    console.error('Error searching Gmail:', error)
    return NextResponse.json(
      {
        error: 'Failed to search Gmail',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

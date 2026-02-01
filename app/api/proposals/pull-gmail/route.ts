import { NextResponse } from "next/server"
import { createGmailClient } from "@/lib/gmail-client"
import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

export async function POST(request: Request) {
  try {
    const { client_email, client_name, client_company, event_title } = await request.json()

    if (!client_email) {
      return NextResponse.json(
        { error: "Client email is required" },
        { status: 400 }
      )
    }

    const gmailClient = createGmailClient()

    // Try to load tokens for the admin email
    const adminEmail = process.env.GMAIL_ADMIN_EMAIL || "hello@speakabout.ai"
    const tokens = await gmailClient.loadTokens(adminEmail)

    if (!tokens) {
      return NextResponse.json(
        {
          error: "Gmail not connected",
          needsAuth: true,
          authUrl: gmailClient.getAuthUrl(`proposals_gmail_${client_email}`)
        },
        { status: 401 }
      )
    }

    await gmailClient.setCredentials(tokens.access_token, tokens.refresh_token)

    // Search for emails from/to the client
    const query = `from:${client_email} OR to:${client_email}`
    const messages = await gmailClient.listMessages(query, 20)

    if (messages.length === 0) {
      return NextResponse.json({
        emails: [],
        extracted: null,
        message: "No emails found for this client"
      })
    }

    // Extract email content
    const emailData = messages.map(msg => {
      const from = gmailClient.extractHeader(msg, 'From') || ''
      const to = gmailClient.extractHeader(msg, 'To') || ''
      const subject = gmailClient.extractHeader(msg, 'Subject') || ''
      const date = gmailClient.extractHeader(msg, 'Date') || ''
      const body = gmailClient.extractBody(msg)

      // Clean up HTML from body
      const cleanBody = body
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 2000) // Limit body length

      return {
        from,
        to,
        subject,
        date,
        body: cleanBody,
        snippet: msg.snippet
      }
    })

    // Sort by date (most recent first)
    emailData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Use Claude to extract relevant information
    const emailContext = emailData.slice(0, 10).map((e, i) =>
      `--- Email ${i + 1} ---
From: ${e.from}
To: ${e.to}
Subject: ${e.subject}
Date: ${e.date}
Body: ${e.body}
`
    ).join('\n\n')

    const prompt = `You are a speaker bureau assistant analyzing email correspondence with a potential client.

CLIENT INFO:
- Email: ${client_email}
- Name: ${client_name || 'Not provided'}
- Company: ${client_company || 'Not provided'}
- Event: ${event_title || 'Not provided'}

EMAIL CORRESPONDENCE:
${emailContext}

Please extract any relevant information for a speaking engagement proposal. Look for:
1. Event details (name, date, location, format, audience size)
2. Budget or fee discussions
3. Topic preferences or speaker requests
4. Specific requirements or constraints
5. Timeline or urgency
6. Any questions they've asked that need answers

Return as JSON:
{
  "event_title": "extracted event name or null",
  "event_date": "extracted date or null",
  "event_location": "extracted location or null",
  "event_format": "in-person, virtual, or hybrid - or null",
  "attendee_count": "extracted number or null",
  "event_description": "brief description based on emails or null",
  "budget_mentioned": "any budget/fee discussion or null",
  "speaker_preferences": "any speaker names or types mentioned or null",
  "key_requirements": ["list of specific requirements mentioned"],
  "questions_to_address": ["questions from client that need answers"],
  "conversation_summary": "2-3 sentence summary of the conversation so far",
  "next_steps": "suggested next action based on conversation"
}

Only return the JSON object, no other text. Use null for fields where no information was found.`

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    })

    const content = response.content[0]
    if (content.type !== "text") {
      throw new Error("Unexpected response type")
    }

    // Parse the JSON response
    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    let extracted = null
    if (jsonMatch) {
      try {
        extracted = JSON.parse(jsonMatch[0])
      } catch (e) {
        console.error("Failed to parse extracted data:", e)
      }
    }

    return NextResponse.json({
      emails: emailData.slice(0, 10), // Return top 10 emails
      extracted,
      emailCount: messages.length
    })
  } catch (error: any) {
    console.error("Error pulling Gmail:", error)

    // Check if it's an auth error
    if (error.code === 401 || error.message?.includes('invalid_grant')) {
      const gmailClient = createGmailClient()
      return NextResponse.json(
        {
          error: "Gmail authorization expired",
          needsAuth: true,
          authUrl: gmailClient.getAuthUrl()
        },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: "Failed to pull emails from Gmail" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { createGmailClient } from '@/lib/gmail-client'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { userEmail } = await request.json()

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })
    }

    const gmailClient = createGmailClient()

    // Load tokens
    const tokens = await gmailClient.loadTokens(userEmail)
    if (!tokens) {
      return NextResponse.json({ error: 'Gmail not connected for this user' }, { status: 401 })
    }

    await gmailClient.setCredentials(tokens.access_token, tokens.refresh_token)

    // Get last sync time
    const lastSync = await sql`
      SELECT MAX(received_at) as last_sync FROM email_threads
    `
    const lastSyncDate = lastSync[0]?.last_sync
      ? new Date(lastSync[0].last_sync)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days

    // Build query for emails after last sync
    const afterTimestamp = Math.floor(lastSyncDate.getTime() / 1000)
    const query = `after:${afterTimestamp}`

    // Fetch messages
    const messages = await gmailClient.listMessages(query, 100)

    const results = {
      totalMessages: messages.length,
      matched: { leads: 0, deals: 0 },
      unmatched: 0,
      errors: [] as string[]
    }

    for (const message of messages) {
      try {
        // Extract email details
        const from = gmailClient.extractHeader(message, 'From') || ''
        const to = gmailClient.extractHeader(message, 'To') || ''
        const cc = gmailClient.extractHeader(message, 'Cc') || ''
        const subject = gmailClient.extractHeader(message, 'Subject') || '(no subject)'
        const bodySnippet = message.snippet
        const bodyFull = gmailClient.extractBody(message)
        const receivedAt = new Date(parseInt(message.internalDate))

        // Parse email addresses
        const fromEmails = gmailClient.parseEmailList(from)
        const toEmails = gmailClient.parseEmailList(to)
        const ccEmails = gmailClient.parseEmailList(cc)
        const allEmails = [...fromEmails, ...toEmails, ...ccEmails]

        // Determine direction (inbound vs outbound)
        const isOutbound = fromEmails.includes(userEmail)
        const direction = isOutbound ? 'outbound' : 'inbound'

        // Find matching lead or deal
        let leadId = null
        let dealId = null

        // Check for matching lead
        const leadMatches = await sql`
          SELECT id FROM leads
          WHERE email = ANY(${allEmails})
          LIMIT 1
        `
        if (leadMatches.length > 0) {
          leadId = leadMatches[0].id
          results.matched.leads++

          // Update last_contact_date on lead
          await sql`
            UPDATE leads
            SET last_contact_date = ${receivedAt},
                updated_at = NOW()
            WHERE id = ${leadId}
          `
        } else {
          // Check for matching deal
          const dealMatches = await sql`
            SELECT id FROM deals
            WHERE client_email = ANY(${allEmails})
            LIMIT 1
          `
          if (dealMatches.length > 0) {
            dealId = dealMatches[0].id
            results.matched.deals++

            // Update last_contact on deal
            await sql`
              UPDATE deals
              SET last_contact = ${receivedAt},
                  updated_at = NOW()
              WHERE id = ${dealId}
            `
          } else {
            results.unmatched++
          }
        }

        // Store email thread (only if matched to lead or deal)
        if (leadId || dealId) {
          await sql`
            INSERT INTO email_threads (
              gmail_message_id,
              gmail_thread_id,
              lead_id,
              deal_id,
              subject,
              from_email,
              to_email,
              cc_emails,
              body_snippet,
              body_full,
              direction,
              is_read,
              received_at,
              labels,
              created_at,
              updated_at
            ) VALUES (
              ${message.id},
              ${message.threadId},
              ${leadId},
              ${dealId},
              ${subject},
              ${fromEmails[0] || ''},
              ${toEmails[0] || ''},
              ${ccEmails},
              ${bodySnippet},
              ${bodyFull},
              ${direction},
              ${!message.labelIds.includes('UNREAD')},
              ${receivedAt},
              ${message.labelIds},
              NOW(),
              NOW()
            )
            ON CONFLICT (gmail_message_id) DO UPDATE SET
              is_read = EXCLUDED.is_read,
              labels = EXCLUDED.labels,
              updated_at = NOW()
          `
        }
      } catch (error) {
        console.error('Error processing message:', error)
        results.errors.push(message.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${results.totalMessages} emails`,
      results
    })
  } catch (error) {
    console.error('Error syncing Gmail:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync Gmail',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

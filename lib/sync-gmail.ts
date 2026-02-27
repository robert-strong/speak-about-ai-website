import { neon } from '@neondatabase/serverless'
import { createGmailClient } from '@/lib/gmail-client'

const sql = neon(process.env.DATABASE_URL!)

export interface SyncResults {
  totalMessages: number
  stored: number
  matched: { leads: number; deals: number }
  unmatched: number
  errors: string[]
}

export async function syncGmailForUser(userEmail: string, fullSync = false): Promise<SyncResults> {
  const gmailClient = createGmailClient()

  // Load tokens
  const tokens = await gmailClient.loadTokens(userEmail)
  if (!tokens) {
    throw new Error('Gmail not connected for this user')
  }

  await gmailClient.setCredentials(tokens.access_token, tokens.refresh_token)

  // Get last sync time (skip if fullSync requested)
  let lastSyncDate: Date
  if (fullSync) {
    lastSyncDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) // Last 90 days
  } else {
    const lastSync = await sql`
      SELECT MAX(received_at) as last_sync FROM email_threads
    `
    lastSyncDate = lastSync[0]?.last_sync
      ? new Date(lastSync[0].last_sync)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Default: last 30 days
  }

  // Build query for emails after last sync
  const afterTimestamp = Math.floor(lastSyncDate.getTime() / 1000)
  const query = `after:${afterTimestamp}`

  // Fetch messages
  const messages = await gmailClient.listMessages(query, 100)

  const results: SyncResults = {
    totalMessages: messages.length,
    stored: 0,
    matched: { leads: 0, deals: 0 },
    unmatched: 0,
    errors: []
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

      // Store all email threads (matched and unmatched)
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
          lead_id = COALESCE(EXCLUDED.lead_id, email_threads.lead_id),
          deal_id = COALESCE(EXCLUDED.deal_id, email_threads.deal_id),
          is_read = EXCLUDED.is_read,
          labels = EXCLUDED.labels,
          updated_at = NOW()
      `
      results.stored++
    } catch (error) {
      console.error('Error processing message:', error)
      results.errors.push(message.id)
    }
  }

  return results
}

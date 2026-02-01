import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')
    const dealId = searchParams.get('deal_id')

    if (!leadId && !dealId) {
      return NextResponse.json(
        { error: 'lead_id or deal_id is required' },
        { status: 400 }
      )
    }

    let threads
    if (leadId) {
      threads = await sql`
        SELECT
          id,
          gmail_message_id,
          gmail_thread_id,
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
          created_at
        FROM email_threads
        WHERE lead_id = ${leadId}
        ORDER BY received_at DESC
        LIMIT 50
      `
    } else {
      threads = await sql`
        SELECT
          id,
          gmail_message_id,
          gmail_thread_id,
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
          created_at
        FROM email_threads
        WHERE deal_id = ${dealId}
        ORDER BY received_at DESC
        LIMIT 50
      `
    }

    return NextResponse.json({
      success: true,
      threads,
      count: threads.length
    })
  } catch (error) {
    console.error('Error fetching email threads:', error)
    return NextResponse.json(
      {
        error: 'Failed to fetch email threads',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

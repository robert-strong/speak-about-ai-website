import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "7")
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Get email notifications with deal information
    const [emails, stats] = await Promise.all([
      // Get all email notifications with deal details
      sql`
        SELECT 
          e.id,
          e.deal_id,
          e.recipient_email,
          e.email_type,
          e.subject,
          e.sent_at,
          e.status,
          e.error_message,
          d.client_name as deal_client_name,
          d.event_title as deal_event_title
        FROM email_notifications e
        LEFT JOIN deals d ON e.deal_id = d.id
        WHERE e.sent_at >= ${startDate.toISOString()}
        AND e.sent_at <= ${endDate.toISOString()}
        ORDER BY e.sent_at DESC
      `,
      
      // Get statistics
      sql`
        SELECT 
          COUNT(*) as total_emails,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_emails,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_emails,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_emails
        FROM email_notifications
        WHERE sent_at >= ${startDate.toISOString()}
        AND sent_at <= ${endDate.toISOString()}
      `
    ])

    const totalEmails = parseInt(stats[0]?.total_emails || "0")
    const sentEmails = parseInt(stats[0]?.sent_emails || "0")
    const failedEmails = parseInt(stats[0]?.failed_emails || "0")
    const pendingEmails = parseInt(stats[0]?.pending_emails || "0")
    const successRate = totalEmails > 0 ? (sentEmails / totalEmails) * 100 : 0

    const response = {
      emails: emails.map(e => ({
        id: e.id,
        deal_id: e.deal_id,
        recipient_email: e.recipient_email,
        email_type: e.email_type,
        subject: e.subject,
        sent_at: e.sent_at,
        status: e.status,
        error_message: e.error_message,
        deal_client_name: e.deal_client_name,
        deal_event_title: e.deal_event_title
      })),
      stats: {
        totalEmails,
        sentEmails,
        failedEmails,
        pendingEmails,
        successRate
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Emails API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch email notifications",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
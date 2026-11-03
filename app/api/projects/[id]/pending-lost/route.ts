import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"
import { flagProjectPendingLost, resolvePendingLost } from "@/lib/pending-lost"

/**
 * POST /api/projects/[id]/pending-lost
 * Body: { decision: "flag" | "confirm" | "cancel", reason?: string }
 *   flag    -> move the project into pending_lost (remembers current stage)
 *   confirm -> pending_lost -> lost
 *   cancel  -> pending_lost -> previous stage
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const { id: idString } = await params
  const id = parseInt(idString, 10)
  if (isNaN(id)) return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })

  try {
    const body = await request.json().catch(() => ({}))
    const decision = body.decision as "flag" | "confirm" | "cancel"

    if (decision === "flag") {
      const project = await flagProjectPendingLost(id, typeof body.reason === "string" ? body.reason : null)
      return NextResponse.json({ success: true, project, message: `"${project.project_name}" flagged as pending lost` })
    }

    if (decision === "confirm" || decision === "cancel") {
      const project = await resolvePendingLost(id, decision)

      if (decision === "confirm") {
        await removeCalendarEvent(id)
      }

      return NextResponse.json({
        success: true,
        project,
        message:
          decision === "confirm"
            ? `"${project.project_name}" marked as lost`
            : `"${project.project_name}" restored to ${project.status}`,
      })
    }

    return NextResponse.json({ error: "decision must be flag, confirm, or cancel" }, { status: 400 })
  } catch (error) {
    console.error("pending-lost error:", error)
    return NextResponse.json(
      { error: "Failed to update project", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

/** Same cleanup the PUT /api/projects/[id] route performs when a project is lost. */
async function removeCalendarEvent(projectId: number) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const rows = await sql`SELECT google_calendar_event_id FROM projects WHERE id = ${projectId}`
    const eventId = rows[0]?.google_calendar_event_id
    if (!eventId) return

    const { createGoogleCalendarClient } = await import("@/lib/google-calendar-client")
    const calendarClient = createGoogleCalendarClient()

    let calendarConfig: any = null
    try {
      const configResult = await sql`SELECT * FROM google_calendar_config LIMIT 1`
      calendarConfig = configResult[0] || null
    } catch {}

    const email = calendarConfig?.user_email || process.env.ADMIN_EMAIL || "noah@speakabout.ai"
    const tokens = await calendarClient.loadTokens(email)
    if (!tokens) return

    await calendarClient.setCredentials(tokens.access_token, tokens.refresh_token)
    await calendarClient.deleteEvent(eventId, calendarConfig?.calendar_id || "primary")
    await sql`UPDATE projects SET google_calendar_event_id = NULL, google_calendar_synced_at = NULL WHERE id = ${projectId}`
  } catch (err: any) {
    if (err?.code !== 404 && err?.code !== 410) {
      console.error(`Failed to delete calendar event for project #${projectId}:`, err?.message || err)
    }
  }
}

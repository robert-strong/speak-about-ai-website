import { NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/auth-middleware"
import {
  loadDigestCandidates,
  analyzeEmail,
  getProjectSnapshot,
  getDealSnapshot,
  PROJECT_FIELDS,
  DEAL_FIELDS,
  PROJECT_STATUS_ORDER,
  PROJECT_STATUS_LABELS,
  DEAL_STATUS_ORDER,
} from "@/lib/email-digest"

export const maxDuration = 120

/**
 * POST /api/admin/email-digest
 * Body: { emailText: string }
 * Analyzes one pasted email and returns a proposal. Writes nothing.
 */
export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const body = await request.json().catch(() => ({}))
    const emailText = typeof body.emailText === "string" ? body.emailText.trim() : ""
    if (emailText.length < 20) {
      return NextResponse.json({ error: "Paste the full email text first" }, { status: 400 })
    }
    if (emailText.length > 60000) {
      return NextResponse.json({ error: "Email is too long (max 60,000 characters)" }, { status: 400 })
    }

    const candidates = await loadDigestCandidates(emailText)
    const analysis = await analyzeEmail(emailText, candidates)

    let snapshot = null
    if (analysis.match.entity_type === "project" && analysis.match.entity_id) {
      snapshot = await getProjectSnapshot(analysis.match.entity_id)
    } else if (analysis.match.entity_type === "deal" && analysis.match.entity_id) {
      snapshot = await getDealSnapshot(analysis.match.entity_id)
    }

    return NextResponse.json({
      success: true,
      analysis,
      snapshot,
      candidates: {
        projects: candidates.projects.map((p) => ({
          id: p.id,
          label: `${p.project_name}${p.company ? ` (${p.company})` : ""}${p.event_date ? ` – ${p.event_date}` : ""}`,
          status: p.status,
          prematch: p.prematch,
        })),
        deals: candidates.deals.map((d) => ({
          id: d.id,
          label: `${d.event_title || "Untitled"}${d.company ? ` (${d.company})` : ""}${d.event_date ? ` – ${d.event_date}` : ""}`,
          status: d.status,
          prematch: d.prematch,
        })),
      },
      meta: {
        projectFields: PROJECT_FIELDS,
        dealFields: DEAL_FIELDS,
        projectStatuses: [...PROJECT_STATUS_ORDER, "cancelled", "lost"].map((s) => ({ value: s, label: PROJECT_STATUS_LABELS[s as keyof typeof PROJECT_STATUS_LABELS] || s })),
        dealStatuses: [...DEAL_STATUS_ORDER, "lost"],
      },
    })
  } catch (error) {
    console.error("email-digest analyze error:", error)
    return NextResponse.json(
      { error: "Failed to analyze email", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

/**
 * GET /api/admin/email-digest?type=project|deal&id=123
 * Returns the current values for a record so the dialog can show current vs proposed.
 */
export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const type = searchParams.get("type")
  const id = parseInt(searchParams.get("id") || "", 10)
  if (!["project", "deal"].includes(type || "") || isNaN(id)) {
    return NextResponse.json({ error: "type and id are required" }, { status: 400 })
  }

  try {
    const snapshot = type === "project" ? await getProjectSnapshot(id) : await getDealSnapshot(id)
    if (!snapshot) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ success: true, snapshot })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to load record", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    )
  }
}

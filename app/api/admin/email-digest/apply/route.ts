import { NextRequest, NextResponse } from "next/server"
import { requireAdminAuth, getDemoFlag } from "@/lib/auth-middleware"
import { applyDigest, type ApplyDigestInput } from "@/lib/email-digest"

const ACTIONS = new Set(["update_project", "update_deal", "create_project", "create_deal", "no_action"])

/**
 * POST /api/admin/email-digest/apply
 * Body: ApplyDigestInput (the admin-reviewed subset of the proposal)
 */
export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const body = (await request.json().catch(() => ({}))) as Partial<ApplyDigestInput>
    if (!body.action || !ACTIONS.has(body.action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 })
    }

    const result = await applyDigest({
      action: body.action,
      target_id: body.target_id ?? null,
      fields: body.fields && typeof body.fields === "object" ? body.fields : {},
      status: body.status ?? null,
      status_reasoning: body.status_reasoning ?? null,
      note: body.note ?? null,
      email_summary: body.email_summary ?? null,
      is_demo: getDemoFlag(request),
    })

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error("email-digest apply error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to apply changes" },
      { status: 400 },
    )
  }
}

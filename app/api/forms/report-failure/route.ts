import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIdentifier } from '@/lib/rate-limiter'
import {
  recordVisitorFailureReport,
  REPORTABLE_FORM_IDS,
  REPORTABLE_KINDS,
  type ReportableFormId,
  type ReportableKind
} from '@/lib/form-health'

/**
 * Browser-side failure reports.
 *
 * The public forms call this (fire-and-forget) when a real visitor's submission
 * fails in a way that indicates the site is broken: the request never reached
 * the server, the server answered 5xx/404, or the CAPTCHA widget errored.
 * Validation errors (4xx) are the visitor's problem and are not reported.
 *
 * Reports are stored and the team is emailed at most once per form per hour.
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  // Never let this endpoint become a way to spam the team: 5 reports / minute / IP
  const identifier = getClientIdentifier(request)
  const limit = checkRateLimit(request, `form-failure:${identifier}`, 5, 60_000)
  if (!limit.success) {
    return NextResponse.json({ success: false, error: 'Too many reports' }, { status: 429 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const formId = String(body?.formId || '') as ReportableFormId
  const kind = String(body?.kind || '') as ReportableKind
  if (!REPORTABLE_FORM_IDS.includes(formId) || !REPORTABLE_KINDS.includes(kind)) {
    return NextResponse.json({ success: false, error: 'Unknown form or failure kind' }, { status: 400 })
  }

  const statusCode = Number.isInteger(body?.statusCode) ? Number(body.statusCode) : null
  // Only report things that mean the site is broken, not the visitor's input
  if (kind === 'server_error' && statusCode !== null && statusCode < 500 && statusCode !== 404) {
    return NextResponse.json({ success: true, ignored: true })
  }

  try {
    const result = await recordVisitorFailureReport({
      formId,
      kind,
      statusCode,
      message: typeof body?.message === 'string' ? body.message : null,
      pageUrl: typeof body?.pageUrl === 'string' ? body.pageUrl : request.headers.get('referer'),
      userAgent: request.headers.get('user-agent'),
      ip: identifier
    })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    // The reporter must never surface an error to the visitor; log and move on
    console.error('[form-health] failed to record visitor failure report:', error)
    return NextResponse.json({ success: false }, { status: 200 })
  }
}

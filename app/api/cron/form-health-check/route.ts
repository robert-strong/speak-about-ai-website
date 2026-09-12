import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { runFormHealthCheck } from '@/lib/form-health'

/**
 * Scheduled form health check.
 *
 * Triggered by Vercel Cron (see vercel.json) every 15 minutes with
 * `Authorization: Bearer $CRON_SECRET`, or manually by a logged-in admin from
 * the /admin/form-health page ("Run checks now").
 *
 * Query params:
 *   ?quiet=1   run the checks and record results but never send an alert email
 */

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120

function isCronRequest(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  return !!process.env.CRON_SECRET && authHeader === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(request: NextRequest) {
  let triggeredBy = 'cron'

  if (!isCronRequest(request)) {
    const authError = requireAdminAuth(request)
    if (authError) return authError
    triggeredBy = 'manual'
  }

  const quiet = request.nextUrl.searchParams.get('quiet') === '1'

  try {
    const summary = await runFormHealthCheck({ triggeredBy, sendAlerts: !quiet })
    return NextResponse.json(
      { success: true, ...summary },
      { status: summary.overallOk ? 200 : 503 }
    )
  } catch (error) {
    console.error('[form-health] run failed:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Form health check could not run',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

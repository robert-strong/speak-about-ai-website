import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-middleware'
import {
  ensureFormHealthTables,
  getFormHealthStatuses,
  getRecentRuns,
  getRecentFailureReports,
  getFormHealthAlertRecipients,
  getFormHealthBaseUrl,
  REMINDER_INTERVAL_HOURS
} from '@/lib/form-health'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** Status data for the /admin/form-health dashboard */
export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    await ensureFormHealthTables()
    const [statuses, runs, reports] = await Promise.all([
      getFormHealthStatuses(),
      getRecentRuns(30),
      getRecentFailureReports(50)
    ])

    return NextResponse.json({
      statuses,
      runs,
      reports,
      config: {
        alertRecipients: getFormHealthAlertRecipients(),
        baseUrl: getFormHealthBaseUrl(),
        reminderIntervalHours: REMINDER_INTERVAL_HOURS,
        schedule: 'Every 15 minutes (Vercel Cron)',
        cronConfigured: !!process.env.CRON_SECRET,
        slackFallbackConfigured: !!process.env.SLACK_WEBHOOK_URL
      }
    })
  } catch (error) {
    console.error('[form-health] admin status error:', error)
    return NextResponse.json(
      { error: 'Failed to load form health status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

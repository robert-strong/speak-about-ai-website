import { NextRequest, NextResponse } from 'next/server'
import { extractAnalyticsFromRequest, extractUTMParams } from '@/lib/analytics-utils'
import { recordPageView, updateSession } from '@/lib/analytics-db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pageTitle, screenResolution, viewportSize, referrer } = body

    // Skip tracking for admin users
    const isAdmin = request.cookies.get('adminLoggedIn')?.value === 'true'
    if (isAdmin) {
      return NextResponse.json({ success: true, skipped: 'admin' })
    }

    // Get visitor and session IDs from cookies
    const visitorId = request.cookies.get('visitor_id')?.value
    const sessionId = request.cookies.get('session_id')?.value

    // If no cookies, silently succeed to avoid breaking the site
    if (!visitorId || !sessionId) {
      return NextResponse.json({ success: true })
    }

    // Extract analytics data from the request
    const analyticsData = extractAnalyticsFromRequest(request)
    
    // Extract UTM parameters from referrer if available
    const utmParams = referrer ? extractUTMParams(referrer) : extractUTMParams(request.url)

    // Get current page path from referer header
    const refererUrl = request.headers.get('referer')
    const pagePath = refererUrl ? new URL(refererUrl).pathname : '/'

    // Record the enhanced page view
    await recordPageView({
      sessionId,
      visitorId,
      pagePath,
      pageTitle,
      screenResolution,
      viewportSize,
      referrer: referrer || analyticsData.referrer,
      ...analyticsData,
      ...utmParams
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Page view tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to record page view' },
      { status: 500 }
    )
  }
}
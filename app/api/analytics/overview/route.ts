import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { getAnalyticsOverview } from '@/lib/analytics-db'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication (Bearer header or adminSessionToken cookie)
    const authError = requireAdminAuth(request)
    if (authError) return authError

    // Get days parameter from query string
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')

    // Validate days parameter
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      )
    }

    // Get analytics overview
    const data = await getAnalyticsOverview(days)

    return NextResponse.json({
      success: true,
      data,
      period: `${days} days`
    })

  } catch (error) {
    console.error('Analytics overview error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics overview' },
      { status: 500 }
    )
  }
}
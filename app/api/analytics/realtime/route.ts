import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { getRealTimeStats } from '@/lib/analytics-db'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication (Bearer header or adminSessionToken cookie)
    const authError = requireAdminAuth(request)
    if (authError) return authError

    // Get real-time analytics data
    const data = await getRealTimeStats()

    return NextResponse.json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Real-time analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch real-time analytics' },
      { status: 500 }
    )
  }
}
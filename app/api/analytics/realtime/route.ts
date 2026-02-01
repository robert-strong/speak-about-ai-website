import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt-utils'
import { getRealTimeStats } from '@/lib/analytics-db'

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const token = request.cookies.get('session')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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
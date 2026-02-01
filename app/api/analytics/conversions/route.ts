import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/jwt-utils'
import { getConversionEvents } from '@/lib/analytics-db'

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

    // Get conversion events
    const data = await getConversionEvents(days)

    return NextResponse.json({
      success: true,
      data,
      period: `${days} days`
    })

  } catch (error) {
    console.error('Conversion analytics error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversion analytics' },
      { status: 500 }
    )
  }
}
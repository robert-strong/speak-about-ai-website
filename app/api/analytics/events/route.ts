import { NextRequest, NextResponse } from 'next/server'
import { recordEvent } from '@/lib/analytics-db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const { eventName, eventCategory, eventValue, metadata } = body

    if (!eventName) {
      return NextResponse.json(
        { error: 'Event name is required' },
        { status: 400 }
      )
    }

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

    // Record the event
    await recordEvent({
      sessionId,
      visitorId,
      eventName,
      eventCategory,
      eventValue: eventValue ? parseFloat(eventValue) : undefined,
      pagePath: request.headers.get('referer') ? new URL(request.headers.get('referer')!).pathname : undefined,
      metadata
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Event tracking error:', error)
    return NextResponse.json(
      { error: 'Failed to record event' },
      { status: 500 }
    )
  }
}
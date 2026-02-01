import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const apiKey = process.env.UMAMI_API_KEY
    const websiteId = process.env.UMAMI_WEBSITE_ID || 'e9883970-17ec-4067-a92a-a32cfe6a36d0'

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Umami API key not configured' },
        { status: 500 }
      )
    }

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    
    const endAt = Date.now()
    const startAt = endAt - (days * 24 * 60 * 60 * 1000)

    // Create an AbortController with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    try {
      // Fetch events from Umami
      const headers: HeadersInit = {
        'x-umami-api-key': apiKey as string,
        'Accept': 'application/json'
      }

      // Get speaker profile view events
      const eventsResponse = await fetch(
        `https://api.umami.is/v1/websites/${websiteId}/events?startAt=${startAt}&endAt=${endAt}&name=speaker-profile-view`,
        { 
          headers,
          signal: controller.signal
        }
      )

      clearTimeout(timeoutId)

      if (!eventsResponse.ok) {
        console.error('Umami API error:', eventsResponse.status, eventsResponse.statusText)
        return NextResponse.json(
          { error: `Umami API error: ${eventsResponse.statusText}` },
          { status: eventsResponse.status }
        )
      }

      const eventsData = await eventsResponse.json()

      // Get book speaker click events
      const bookClicksResponse = await fetch(
        `https://api.umami.is/v1/websites/${websiteId}/events?startAt=${startAt}&endAt=${endAt}&name=book-speaker-click`,
        { headers }
      )

      let bookClicksData = { data: [] }
      if (bookClicksResponse.ok) {
        bookClicksData = await bookClicksResponse.json()
      }

      // Process the data to aggregate by speaker
      const speakerViews: Record<string, any> = {}

      // Process view events
      if (eventsData.data && Array.isArray(eventsData.data)) {
        eventsData.data.forEach((event: any) => {
          const speakerName = event.properties?.speaker_name || 'Unknown'
          const speakerSlug = event.properties?.speaker_slug || ''
          
          if (!speakerViews[speakerName]) {
            speakerViews[speakerName] = {
              name: speakerName,
              slug: speakerSlug,
              views: 0,
              bookClicks: 0,
              conversionRate: 0,
              topics: event.properties?.speaker_topics || '',
              location: event.properties?.speaker_location || ''
            }
          }
          
          speakerViews[speakerName].views++
        })
      }

      // Process book click events
      if (bookClicksData.data && Array.isArray(bookClicksData.data)) {
        bookClicksData.data.forEach((event: any) => {
          const speakerName = event.properties?.speaker_name || 'Unknown'
          
          if (speakerViews[speakerName]) {
            speakerViews[speakerName].bookClicks++
          }
        })
      }

      // Calculate conversion rates
      Object.values(speakerViews).forEach((speaker: any) => {
        if (speaker.views > 0) {
          speaker.conversionRate = ((speaker.bookClicks / speaker.views) * 100).toFixed(2)
        }
      })

      // Convert to array and sort by views
      const speakerAnalytics = Object.values(speakerViews)
        .sort((a: any, b: any) => b.views - a.views)

      return NextResponse.json({
        success: true,
        dateRange: {
          startAt: new Date(startAt).toISOString(),
          endAt: new Date(endAt).toISOString(),
          days
        },
        totalViews: eventsData.data?.length || 0,
        totalBookClicks: bookClicksData.data?.length || 0,
        speakers: speakerAnalytics
      })

    } catch (error: any) {
      clearTimeout(timeoutId)
      
      if (error.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout - Umami API took too long to respond' },
          { status: 504 }
        )
      }
      
      console.error('Error fetching Umami speaker analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch speaker analytics', details: error.message },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error in speaker analytics endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
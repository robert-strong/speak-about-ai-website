import { NextRequest, NextResponse } from 'next/server'
import { requireSpeakerAuth, getSpeakerIdFromToken } from '@/lib/auth-middleware'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    // Check speaker authentication
    const authHeader = request.headers.get('authorization')
    let speakerInfo: any = null

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      // Try to decode the JWT token (new format from login)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any
        speakerInfo = {
          email: decoded.email,
          name: decoded.name,
          speakerId: decoded.speakerId
        }
      } catch (jwtError) {
        // Fallback: try old base64 format for backwards compatibility
        try {
          const decoded = Buffer.from(token, 'base64').toString()
          const [email, name] = decoded.split(':')
          speakerInfo = { email, name }
        } catch (e) {
          console.error('Token decode error:', e)
          return NextResponse.json({ error: 'Invalid authentication' }, { status: 401 })
        }
      }
    } else {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const apiKey = process.env.UMAMI_API_KEY
    const websiteId = process.env.UMAMI_WEBSITE_ID || 'e9883970-17ec-4067-a92a-a32cfe6a36d0'

    // Get date range from query params
    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || '30d'

    let days = 30
    if (range === '7d') days = 7
    else if (range === '90d') days = 90
    else if (range === '365d') days = 365

    // If analytics not configured, return empty data structure
    if (!apiKey) {
      const emptyDailyViews = []
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        emptyDailyViews.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          views: 0
        })
      }

      return NextResponse.json({
        success: true,
        analytics: {
          profileViews: 0,
          bookingClicks: 0,
          conversionRate: 0,
          viewsByDay: emptyDailyViews,
          topReferrers: [
            { source: "No data available", count: 0 }
          ],
          viewsByLocation: [
            { location: "No data available", count: 0 }
          ],
          engagementMetrics: {
            avgTimeOnProfile: "N/A",
            bounceRate: 0,
            repeatVisitors: 0
          }
        }
      })
    }

    const endAt = Date.now()
    const startAt = endAt - (days * 24 * 60 * 60 * 1000)

    const headers: HeadersInit = {
      'x-umami-api-key': apiKey as string,
      'Accept': 'application/json'
    }

    try {
      // Fetch overall website stats
      const statsResponse = await fetch(
        `https://api.umami.is/v1/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`,
        { headers }
      )

      let stats = {
        pageviews: { value: 0 },
        visitors: { value: 0 },
        visits: { value: 0 },
        bounces: { value: 0 },
        totaltime: { value: 0 }
      }

      if (statsResponse.ok) {
        stats = await statsResponse.json()
      }

      // Fetch page views for this speaker's profile
      // We'll filter by URL pattern /speakers/[slug]
      const speakerSlug = speakerInfo.name?.toLowerCase().replace(/\s+/g, '-') || ''
      const pageviewsResponse = await fetch(
        `https://api.umami.is/v1/websites/${websiteId}/pageviews?startAt=${startAt}&endAt=${endAt}&unit=day`,
        { headers }
      )

      let pageviews = []
      if (pageviewsResponse.ok) {
        const data = await pageviewsResponse.json()
        pageviews = data.pageviews || data || [] // Handle different response formats
      }

      // Fetch all events to find speaker-specific page views
      // Umami returns page views with urlPath which we can filter by /speakers/{slug}
      let profileViews = 0
      let bookingClicks = 0
      let viewsByDayMap: { [key: string]: number } = {}

      // Fetch events in batches to get all speaker profile views
      let page = 1
      let hasMore = true

      while (hasMore && page <= 10) { // Limit to 10 pages (200 events) for performance
        const eventsResponse = await fetch(
          `https://api.umami.is/v1/websites/${websiteId}/events?startAt=${startAt}&endAt=${endAt}&page=${page}&pageSize=20`,
          { headers }
        )

        if (!eventsResponse.ok) break

        const eventsData = await eventsResponse.json()

        if (eventsData.data && Array.isArray(eventsData.data)) {
          eventsData.data.forEach((event: any) => {
            const urlPath = event.urlPath || ''

            // Check for speaker profile page views by URL pattern
            // URL format: /speakers/{slug}
            if (urlPath.startsWith('/speakers/') && !urlPath.includes('/dashboard')) {
              const pathParts = urlPath.split('/')
              const slug = pathParts[2] // Get the slug from /speakers/{slug}

              // Match if the slug matches this speaker's name (converted to slug format)
              if (slug && slug === speakerSlug) {
                profileViews++
                const eventDate = new Date(event.createdAt || event.created_at || event.timestamp)
                const dateKey = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                viewsByDayMap[dateKey] = (viewsByDayMap[dateKey] || 0) + 1
              }
            }

            // Check for custom events (speaker-profile-view, book-speaker-click)
            if (event.eventName === 'speaker-profile-view') {
              if (event.eventData?.speaker_name === speakerInfo.name) {
                profileViews++
                const eventDate = new Date(event.createdAt || event.created_at || event.timestamp)
                const dateKey = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                viewsByDayMap[dateKey] = (viewsByDayMap[dateKey] || 0) + 1
              }
            } else if (event.eventName === 'book-speaker-click') {
              if (event.eventData?.speaker_name === speakerInfo.name) {
                bookingClicks++
              }
            }

            // Also check for contact page visits with this speaker in the URL query
            if (urlPath === '/contact' && event.urlQuery?.includes(encodeURIComponent(speakerInfo.name))) {
              bookingClicks++
            }
          })

          hasMore = eventsData.data.length === 20
          page++
        } else {
          hasMore = false
        }
      }

      // Calculate conversion rate
      const conversionRate = profileViews > 0 
        ? ((bookingClicks / profileViews) * 100).toFixed(1)
        : '0'

      // Get referrers
      const referrersResponse = await fetch(
        `https://api.umami.is/v1/websites/${websiteId}/referrers?startAt=${startAt}&endAt=${endAt}`,
        { headers }
      )

      let topReferrers: any[] = []
      if (referrersResponse.ok) {
        const referrersData = await referrersResponse.json()
        topReferrers = (referrersData.referrers || [])
          .slice(0, 5)
          .map((r: any) => ({
            source: r.referrer || 'Direct',
            count: r.visitors || 0
          }))
      }

      // Get countries
      const countriesResponse = await fetch(
        `https://api.umami.is/v1/websites/${websiteId}/countries?startAt=${startAt}&endAt=${endAt}`,
        { headers }
      )

      let viewsByLocation: any[] = []
      if (countriesResponse.ok) {
        const countriesData = await countriesResponse.json()
        viewsByLocation = (countriesData.countries || [])
          .slice(0, 5)
          .map((c: any) => ({
            location: c.country || 'Unknown',
            count: c.visitors || 0
          }))
      }

      // Engagement metrics - only show speaker-specific data
      // Since Umami doesn't provide per-page engagement metrics via API,
      // we show 0 or derive from speaker-specific events only
      const avgTimeFormatted = "N/A" // Not available per-speaker
      const bounceRate = 0 // Not available per-speaker

      // Generate daily view data
      const dailyViews = []
      
      // Use viewsByDayMap if we have event data
      if (Object.keys(viewsByDayMap).length > 0) {
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          const dateKey = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          dailyViews.push({
            date: dateKey,
            views: viewsByDayMap[dateKey] || 0
          })
        }
      } else if (pageviews && pageviews.length > 0) {
        // Use pageview data if available
        pageviews.forEach((pv: any) => {
          dailyViews.push({
            date: new Date(pv.x || pv.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            views: pv.y || pv.views || 0
          })
        })
      } else {
        // Generate empty data for the period
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date()
          date.setDate(date.getDate() - i)
          dailyViews.push({
            date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            views: 0
          })
        }
      }

      return NextResponse.json({
        success: true,
        analytics: {
          profileViews,
          bookingClicks,
          conversionRate: parseFloat(conversionRate),
          viewsByDay: dailyViews,
          topReferrers: topReferrers.length > 0 ? topReferrers : [
            { source: "Google Search", count: 0 },
            { source: "LinkedIn", count: 0 },
            { source: "Direct", count: 0 }
          ],
          viewsByLocation: viewsByLocation.length > 0 ? viewsByLocation : [
            { location: "No data", count: 0 }
          ],
          engagementMetrics: {
            avgTimeOnProfile: avgTimeFormatted,
            bounceRate: bounceRate,
            repeatVisitors: 0 // Speaker-specific repeat visitors not available via Umami API
          }
        }
      })
    } catch (error: any) {
      console.error('Error fetching Umami analytics:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analytics', details: error.message },
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
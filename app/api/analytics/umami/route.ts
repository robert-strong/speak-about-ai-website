import { NextRequest, NextResponse } from 'next/server'

// Helper function to generate mock analytics data
function generateMockData(days: number, message?: string) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days)
  
  return {
    totalPageViews: 0,
    uniqueVisitors: 0,
    bounceRate: 0,
    avgSessionDuration: 0,
    topPages: [
      { page: '/', views: 0 },
      { page: '/speakers', views: 0 },
      { page: '/our-services', views: 0 },
      { page: '/contact', views: 0 },
      { page: '/about', views: 0 }
    ],
    topReferrers: [
      { referrer: 'No data available', count: 0 }
    ],
    deviceBreakdown: [
      { device: 'No data', count: 0 }
    ],
    browserBreakdown: [
      { browser: 'No data', count: 0 }
    ],
    countryBreakdown: [
      { country: 'No data', count: 0 }
    ],
    dailyStats: Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - (days - i - 1) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      page_views: 0,
      unique_visitors: 0,
      bounce_rate: 0
    })),
    recentEvents: [],
    period: {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
      days: days
    },
    _message: message || 'Analytics data unavailable'
  }
}

export async function GET(request: NextRequest) {
  console.log('Umami API endpoint called')
  
  try {
    // Check for admin authentication (using localStorage approach)
    const authHeader = request.headers.get('x-admin-request')
    if (authHeader !== 'true') {
      console.log('Umami Analytics API accessed without admin header')
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    
    // Check if Umami credentials are configured
    const hasUmamiConfig = process.env.UMAMI_API_KEY && process.env.UMAMI_WEBSITE_ID
    
    console.log('Umami config check:', { 
      hasApiKey: !!process.env.UMAMI_API_KEY,
      hasWebsiteId: !!process.env.UMAMI_WEBSITE_ID,
      apiKeyPrefix: process.env.UMAMI_API_KEY?.substring(0, 10),
      websiteId: process.env.UMAMI_WEBSITE_ID
    })
    
    if (!hasUmamiConfig) {
      console.log('Umami not configured, returning empty data')
      return NextResponse.json(generateMockData(days))
    }

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Format dates for Umami API (Unix timestamps in milliseconds)
    const startAt = startDate.getTime()
    const endAt = endDate.getTime()

    const websiteId = process.env.UMAMI_WEBSITE_ID
    const apiKey = process.env.UMAMI_API_KEY

    // Try to fetch real data from Umami with a timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    try {
      // Umami Cloud API authentication
      const headers: HeadersInit = {
        'x-umami-api-key': apiKey as string,
        'Accept': 'application/json'
      }

      // Use the Umami Cloud API endpoint
      const apiUrl = `https://cloud.umami.is/api/websites/${websiteId}/stats?startAt=${startAt}&endAt=${endAt}`
      console.log('Calling Umami API:', apiUrl)
      
      const response = await fetch(apiUrl, { 
        headers,
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        const errorText = await response.text()
        console.log(`Umami API returned ${response.status}: ${errorText}`)
        console.log('API Key format:', apiKey?.substring(0, 10) + '...')
        console.log('Website ID:', websiteId)
        
        // Return mock data with a note about the API issue
        const mockData = generateMockData(days, 
          'Umami Cloud API access is not available. Data is being collected but API access requires self-hosted Umami. View your analytics at cloud.umami.is'
        )
        return NextResponse.json({
          ...mockData,
          _note: 'Umami Cloud does not provide API access for reading analytics data. Consider self-hosting Umami for API access.',
          _status: response.status,
          _tracking: 'Active - Data is being collected',
          _dashboard: 'https://cloud.umami.is'
        })
      }

      const stats = await response.json()

      // Fetch additional metrics with timeout
      const metricsController = new AbortController()
      const metricsTimeoutId = setTimeout(() => metricsController.abort(), 3000)
      
      try {
        const [pageViewsRes, metricsRes] = await Promise.all([
          fetch(`https://cloud.umami.is/api/websites/${websiteId}/pageviews?startAt=${startAt}&endAt=${endAt}&unit=day`, { 
            headers,
            signal: metricsController.signal
          }),
          fetch(`https://cloud.umami.is/api/websites/${websiteId}/metrics?startAt=${startAt}&endAt=${endAt}&type=url`, { 
            headers,
            signal: metricsController.signal
          })
        ])
        
        clearTimeout(metricsTimeoutId)
        
        const [pageViews, metrics] = await Promise.all([
          pageViewsRes.json(),
          metricsRes.json()
        ])

        // Return real Umami data
        return NextResponse.json({
          totalPageViews: stats.pageviews?.value || 0,
          uniqueVisitors: stats.visitors?.value || 0,
          bounceRate: stats.bounces?.value ? (stats.bounces.value / stats.visits?.value * 100) : 0,
          avgSessionDuration: stats.totaltime?.value ? (stats.totaltime.value / stats.visits?.value) : 0,
          topPages: metrics?.slice(0, 10).map((page: any) => ({
            page: page.x || 'Unknown',
            views: page.y || 0
          })) || [],
          topReferrers: [],
          deviceBreakdown: [],
          browserBreakdown: [],
          countryBreakdown: [],
          dailyStats: pageViews?.pageviews?.map((pv: any, index: number) => ({
            date: pv.x || new Date(startDate.getTime() + (index * 24 * 60 * 60 * 1000)).toISOString().split('T')[0],
            page_views: pv.y || 0,
            unique_visitors: pageViews.uniques?.[index]?.y || 0,
            bounce_rate: 0
          })) || [],
          recentEvents: [],
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            days: days
          }
        })
        
      } catch (metricsError) {
        clearTimeout(metricsTimeoutId)
        console.log('Timeout fetching additional metrics, returning partial data')
        
        // Return partial real data
        return NextResponse.json({
          totalPageViews: stats.pageviews?.value || 0,
          uniqueVisitors: stats.visitors?.value || 0,
          bounceRate: stats.bounces?.value ? (stats.bounces.value / stats.visits?.value * 100) : 0,
          avgSessionDuration: stats.totaltime?.value ? (stats.totaltime.value / stats.visits?.value) : 0,
          ...generateMockData(days), // Fill in the rest with mock data
          period: {
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            days: days
          }
        })
      }
      
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.log('Umami API request timed out, using mock data')
      } else {
        console.error('Error fetching from Umami:', fetchError.message)
      }
      
      // Return mock data on any error
      return NextResponse.json(generateMockData(days))
    }
    
  } catch (error) {
    console.error('Umami Analytics API error:', error)
    // Always return data, even if it's mock data
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '7')
    return NextResponse.json(generateMockData(days))
  }
}
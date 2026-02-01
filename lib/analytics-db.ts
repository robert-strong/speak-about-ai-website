import { neon } from '@neondatabase/serverless'
import { AnalyticsData, EventData } from './analytics-utils'

// Initialize Neon client with error handling
let sql: any = null
try {
  if (process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL)
  }
} catch (error) {
  console.error('Failed to initialize Neon client:', error)
}

/**
 * Record a page view
 */
export async function recordPageView(data: AnalyticsData): Promise<void> {
  if (!sql) {
    console.warn('Analytics database not available')
    return
  }
  
  try {
    await sql`
      INSERT INTO page_views (
        session_id, visitor_id, page_path, page_title, referrer,
        utm_source, utm_medium, utm_campaign, utm_content, utm_term,
        user_agent, ip_address, country, city, device_type, browser, os,
        screen_resolution, viewport_size, is_bot
      ) VALUES (
        ${data.sessionId}, ${data.visitorId}, ${data.pagePath}, ${data.pageTitle || null}, ${data.referrer || null},
        ${data.utmSource || null}, ${data.utmMedium || null}, ${data.utmCampaign || null}, ${data.utmContent || null}, ${data.utmTerm || null},
        ${data.userAgent || null}, ${data.ipAddress || null}, ${data.country || null}, ${data.city || null}, 
        ${data.deviceType || null}, ${data.browser || null}, ${data.os || null},
        ${data.screenResolution || null}, ${data.viewportSize || null}, ${data.isBot || false}
      )
    `
  } catch (error) {
    console.error('Failed to record page view:', error)
    // If the error is about missing tables, provide helpful message
    if (error instanceof Error && error.message.includes('relation') && error.message.includes('does not exist')) {
      console.error('Analytics tables do not exist. Please run the database migration script from scripts/create-analytics-tables.sql')
    }
  }
}

/**
 * Record an event
 */
export async function recordEvent(data: EventData): Promise<void> {
  if (!sql) {
    console.warn('Analytics database not available')
    return
  }
  
  try {
    await sql`
      INSERT INTO events (
        session_id, visitor_id, event_name, event_category, event_value, page_path, metadata
      ) VALUES (
        ${data.sessionId}, ${data.visitorId}, ${data.eventName}, ${data.eventCategory || null},
        ${data.eventValue || null}, ${data.pagePath || null}, ${JSON.stringify(data.metadata || {})}
      )
    `
  } catch (error) {
    console.error('Failed to record event:', error)
  }
}

/**
 * Update or create session
 */
export async function updateSession(sessionId: string, data: Partial<{
  visitorId: string
  firstPage: string
  lastPage: string
  pageCount: number
  duration: number
  referrer: string
  utmSource: string
  utmMedium: string
  utmCampaign: string
  country: string
  deviceType: string
  browser: string
  isConversion: boolean
}>): Promise<void> {
  if (!sql) {
    console.warn('Analytics database not available')
    return
  }
  
  try {
    // Try to update existing session first
    const result = await sql`
      UPDATE sessions SET
        last_page = COALESCE(${data.lastPage || null}, last_page),
        page_count = COALESCE(${data.pageCount || null}, page_count),
        duration_seconds = COALESCE(${data.duration || null}, duration_seconds),
        is_conversion = COALESCE(${data.isConversion || false}, is_conversion),
        ended_at = CURRENT_TIMESTAMP
      WHERE session_id = ${sessionId}
      RETURNING id
    `

    // If no session exists, create one
    if (result.length === 0) {
      await sql`
        INSERT INTO sessions (
          session_id, visitor_id, first_page, last_page, page_count, duration_seconds,
          referrer, utm_source, utm_medium, utm_campaign, country, device_type, browser, is_conversion
        ) VALUES (
          ${sessionId}, ${data.visitorId || ''}, ${data.firstPage || data.lastPage || ''}, ${data.lastPage || ''},
          ${data.pageCount || 1}, ${data.duration || 0}, ${data.referrer || null}, ${data.utmSource || null},
          ${data.utmMedium || null}, ${data.utmCampaign || null}, ${data.country || null}, 
          ${data.deviceType || null}, ${data.browser || null}, ${data.isConversion || false}
        )
      `
    }
  } catch (error) {
    console.error('Failed to update session:', error)
  }
}

/**
 * Get analytics overview
 */
export async function getAnalyticsOverview(days: number = 30) {
  if (!sql) {
    console.warn('Analytics database not available')
    return {
      overview: {},
      topPages: [],
      trafficSources: [],
      deviceBreakdown: [],
      dailyStats: []
    }
  }
  
  try {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

    // Get basic stats
    const stats = await sql`
      SELECT 
        COUNT(*) as total_page_views,
        COUNT(DISTINCT visitor_id) as unique_visitors,
        COUNT(DISTINCT session_id) as total_sessions,
        AVG(duration_seconds) as avg_duration,
        COUNT(*) FILTER (WHERE is_bot = false) as human_page_views
      FROM page_views 
      WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
    `

    // Get top pages
    const topPages = await sql`
      SELECT page_path, COUNT(*) as views
      FROM page_views 
      WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
        AND is_bot = false
      GROUP BY page_path
      ORDER BY views DESC
      LIMIT 10
    `

    // Get traffic sources
    const trafficSources = await sql`
      SELECT 
        COALESCE(utm_source, 'direct') as source,
        COUNT(*) as visits
      FROM page_views 
      WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
        AND is_bot = false
      GROUP BY utm_source
      ORDER BY visits DESC
      LIMIT 10
    `

    // Get device breakdown
    const deviceBreakdown = await sql`
      SELECT device_type, COUNT(*) as count
      FROM page_views 
      WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
        AND is_bot = false
        AND device_type IS NOT NULL
      GROUP BY device_type
      ORDER BY count DESC
    `

    // Get daily stats for chart
    const dailyStats = await sql`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as page_views,
        COUNT(DISTINCT visitor_id) as unique_visitors
      FROM page_views 
      WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
        AND is_bot = false
      GROUP BY DATE(created_at)
      ORDER BY date
    `

    return {
      overview: stats[0] || {},
      topPages: topPages || [],
      trafficSources: trafficSources || [],
      deviceBreakdown: deviceBreakdown || [],
      dailyStats: dailyStats || []
    }
  } catch (error) {
    console.error('Failed to get analytics overview:', error)
    return {
      overview: {},
      topPages: [],
      trafficSources: [],
      deviceBreakdown: [],
      dailyStats: []
    }
  }
}

/**
 * Get conversion events
 */
export async function getConversionEvents(days: number = 30) {
  if (!sql) {
    console.warn('Analytics database not available')
    return []
  }
  
  try {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000))

    const conversions = await sql`
      SELECT 
        event_name,
        COUNT(*) as count,
        SUM(event_value) as total_value
      FROM events 
      WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
        AND event_category = 'conversion'
      GROUP BY event_name
      ORDER BY count DESC
    `

    return conversions || []
  } catch (error) {
    console.error('Failed to get conversion events:', error)
    return []
  }
}

/**
 * Get real-time stats (last hour)
 */
export async function getRealTimeStats() {
  if (!sql) {
    console.warn('Analytics database not available')
    return {
      stats: {},
      recentPages: []
    }
  }
  
  try {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    const stats = await sql`
      SELECT 
        COUNT(*) as page_views_last_hour,
        COUNT(DISTINCT visitor_id) as active_visitors,
        COUNT(DISTINCT page_path) as pages_viewed
      FROM page_views 
      WHERE created_at >= ${oneHourAgo.toISOString()}
        AND is_bot = false
    `

    const recentPages = await sql`
      SELECT page_path, COUNT(*) as views
      FROM page_views 
      WHERE created_at >= ${oneHourAgo.toISOString()}
        AND is_bot = false
      GROUP BY page_path
      ORDER BY views DESC
      LIMIT 5
    `

    return {
      stats: stats[0] || {},
      recentPages: recentPages || []
    }
  } catch (error) {
    console.error('Failed to get real-time stats:', error)
    return {
      stats: {},
      recentPages: []
    }
  }
}

// Test connection function
export async function testAnalyticsConnection(): Promise<boolean> {
  if (!sql) {
    return false
  }
  
  try {
    await sql`SELECT 1`
    return true
  } catch (error) {
    console.error("Analytics database connection test failed:", error)
    return false
  }
}
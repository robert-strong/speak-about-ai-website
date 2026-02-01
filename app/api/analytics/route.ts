import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "7")
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Get basic analytics metrics
    const [
      totalPageViews,
      uniqueVisitors,
      bounceRateResult,
      avgSessionDuration,
      topPages,
      topReferrers,
      deviceBreakdown,
      dailyStats,
      recentEvents
    ] = await Promise.all([
      // Total page views
      sql`
        SELECT COUNT(*) as count 
        FROM page_views 
        WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
      `,
      
      // Unique visitors
      sql`
        SELECT COUNT(DISTINCT visitor_id) as count 
        FROM page_views 
        WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
      `,
      
      // Bounce rate (sessions with only 1 page view)
      sql`
        SELECT 
          (COUNT(CASE WHEN page_count = 1 THEN 1 END)::float / COUNT(*)::float * 100) as bounce_rate
        FROM sessions 
        WHERE started_at >= ${startDate.toISOString()} 
        AND started_at <= ${endDate.toISOString()}
      `,
      
      // Average session duration
      sql`
        SELECT AVG(duration_seconds) as avg_duration 
        FROM sessions 
        WHERE started_at >= ${startDate.toISOString()} 
        AND started_at <= ${endDate.toISOString()}
        AND duration_seconds > 0
      `,
      
      // Top pages
      sql`
        SELECT page_path as page, COUNT(*) as views 
        FROM page_views 
        WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
        GROUP BY page_path 
        ORDER BY views DESC 
        LIMIT 10
      `,
      
      // Top referrers
      sql`
        SELECT referrer, COUNT(*) as count 
        FROM page_views 
        WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
        AND referrer IS NOT NULL
        GROUP BY referrer 
        ORDER BY count DESC 
        LIMIT 10
      `,
      
      // Device breakdown
      sql`
        SELECT device_type as device, COUNT(*) as count 
        FROM page_views 
        WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
        AND device_type IS NOT NULL
        GROUP BY device_type 
        ORDER BY count DESC
      `,
      
      // Daily stats
      sql`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as page_views,
          COUNT(DISTINCT visitor_id) as unique_visitors,
          (COUNT(CASE WHEN duration_seconds <= 10 THEN 1 END)::float / COUNT(*)::float * 100) as bounce_rate
        FROM page_views 
        WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
        GROUP BY DATE(created_at) 
        ORDER BY date DESC
      `,
      
      // Recent events
      sql`
        SELECT event_name, page_path, created_at, metadata 
        FROM events 
        WHERE created_at >= ${startDate.toISOString()} 
        AND created_at <= ${endDate.toISOString()}
        ORDER BY created_at DESC 
        LIMIT 20
      `
    ])

    const analytics = {
      totalPageViews: parseInt(totalPageViews[0]?.count || "0"),
      uniqueVisitors: parseInt(uniqueVisitors[0]?.count || "0"),
      bounceRate: parseFloat(bounceRateResult[0]?.bounce_rate || "0"),
      avgSessionDuration: parseFloat(avgSessionDuration[0]?.avg_duration || "0"),
      topPages: topPages.map(p => ({
        page: p.page,
        views: parseInt(p.views)
      })),
      topReferrers: topReferrers.map(r => ({
        referrer: r.referrer,
        count: parseInt(r.count)
      })),
      deviceBreakdown: deviceBreakdown.map(d => ({
        device: d.device,
        count: parseInt(d.count)
      })),
      dailyStats: dailyStats.map(d => ({
        date: d.date,
        page_views: parseInt(d.page_views),
        unique_visitors: parseInt(d.unique_visitors),
        bounce_rate: parseFloat(d.bounce_rate || "0")
      })),
      recentEvents: recentEvents.map(e => ({
        event_name: e.event_name,
        page_path: e.page_path,
        created_at: e.created_at,
        metadata: e.metadata
      }))
    }

    return NextResponse.json(analytics)
  } catch (error) {
    console.error("Analytics API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch analytics data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
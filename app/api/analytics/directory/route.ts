import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const days = searchParams.get('days') || '7'

    // Get vendor statistics
    const vendorStats = await sql`
      SELECT 
        COUNT(DISTINCT id) as total_vendors,
        COUNT(DISTINCT CASE WHEN status = 'approved' THEN id END) as approved_vendors,
        COUNT(DISTINCT CASE WHEN featured = true THEN id END) as featured_vendors,
        COUNT(DISTINCT CASE WHEN verified = true THEN id END) as verified_vendors
      FROM vendors
    `

    // Get category distribution
    const categoryStats = await sql`
      SELECT 
        c.name as category,
        COUNT(v.id) as count
      FROM vendors v
      LEFT JOIN vendor_categories c ON v.category_id = c.id
      WHERE v.status = 'approved'
      GROUP BY c.name
      ORDER BY count DESC
    `

    // Get recent vendor activity
    const recentActivity = await sql`
      SELECT 
        company_name,
        status,
        created_at
      FROM vendors
      ORDER BY created_at DESC
      LIMIT 10
    `

    // Get subscriber statistics
    const subscriberStats = await sql`
      SELECT 
        COUNT(DISTINCT id) as total_subscribers,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '7 days' THEN id END) as new_this_week,
        COUNT(DISTINCT CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN id END) as new_this_month
      FROM directory_subscribers
    `

    // Real data - will show zeros until events are tracked
    // These will populate as users interact with the directory
    const realEventData = {
      totalSearches: 0,
      topSearchTerms: [],
      categoryFilters: categoryStats.map(cat => ({
        category: cat.category || 'Uncategorized',
        count: 0
      })),
      vendorViews: [],
      contactMethods: {
        email: 0,
        phone: 0,
        website: 0,
        quote: 0
      },
      conversionFunnel: {
        directoryVisits: 0,
        vendorPageViews: 0,
        contactInitiated: 0,
        quoteRequested: 0
      }
    }

    return NextResponse.json({
      ...realEventData,
      totalVendors: vendorStats[0]?.total_vendors || 0,
      approvedVendors: vendorStats[0]?.approved_vendors || 0,
      featuredVendors: vendorStats[0]?.featured_vendors || 0,
      verifiedVendors: vendorStats[0]?.verified_vendors || 0,
      totalSubscribers: subscriberStats[0]?.total_subscribers || 0,
      newSubscribersThisWeek: subscriberStats[0]?.new_this_week || 0,
      newSubscribersThisMonth: subscriberStats[0]?.new_this_month || 0,
      recentActivity: recentActivity.map(activity => ({
        vendor: activity.company_name,
        action: `Status: ${activity.status}`,
        timestamp: activity.created_at
      }))
    })

  } catch (error) {
    console.error("Error fetching directory analytics:", error)
    return NextResponse.json(
      { error: "Failed to fetch directory analytics" },
      { status: 500 }
    )
  }
}
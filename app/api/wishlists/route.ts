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
    const days = parseInt(searchParams.get("days") || "30")
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(endDate.getDate() - days)

    // Get wishlist data with speaker information
    const [wishlists, stats] = await Promise.all([
      // Get all wishlists with speaker details
      sql`
        SELECT 
          w.id,
          w.session_id,
          w.visitor_id,
          w.speaker_id,
          w.added_at,
          s.name as speaker_name,
          s.headshot_url as speaker_headshot_url,
          s.location as speaker_location,
          s.topics as speaker_topics
        FROM wishlists w
        JOIN speakers s ON w.speaker_id = s.id
        WHERE w.added_at >= ${startDate.toISOString()}
        AND w.added_at <= ${endDate.toISOString()}
        ORDER BY w.added_at DESC
      `,
      
      // Get statistics
      sql`
        SELECT 
          COUNT(*) as total_wishlists,
          COUNT(DISTINCT session_id) as unique_sessions
        FROM wishlists
        WHERE added_at >= ${startDate.toISOString()}
        AND added_at <= ${endDate.toISOString()}
      `
    ])

    // Get top speakers
    const topSpeakers = await sql`
      SELECT 
        w.speaker_id,
        s.name as speaker_name,
        COUNT(*) as wishlist_count
      FROM wishlists w
      JOIN speakers s ON w.speaker_id = s.id
      WHERE w.added_at >= ${startDate.toISOString()}
      AND w.added_at <= ${endDate.toISOString()}
      GROUP BY w.speaker_id, s.name
      ORDER BY wishlist_count DESC
      LIMIT 10
    `

    const response = {
      wishlists: wishlists.map(w => ({
        id: w.id,
        session_id: w.session_id,
        visitor_id: w.visitor_id,
        speaker_id: w.speaker_id,
        speaker_name: w.speaker_name,
        speaker_headshot_url: w.speaker_headshot_url,
        speaker_location: w.speaker_location,
        speaker_topics: w.speaker_topics,
        added_at: w.added_at
      })),
      stats: {
        totalWishlists: parseInt(stats[0]?.total_wishlists || "0"),
        uniqueSessions: parseInt(stats[0]?.unique_sessions || "0"),
        topSpeakers: topSpeakers.map(t => ({
          speaker_id: t.speaker_id,
          speaker_name: t.speaker_name,
          wishlist_count: parseInt(t.wishlist_count)
        }))
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Wishlists API error:", error)
    return NextResponse.json(
      { 
        error: "Failed to fetch wishlist data",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
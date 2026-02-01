import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = neon(process.env.DATABASE_URL!)
    
    // Get counts by status
    const statsResult = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'published') as published,
        COUNT(*) FILTER (WHERE status = 'draft') as draft,
        COUNT(*) FILTER (WHERE status = 'archived') as archived
      FROM blog_posts
    `
    
    const stats = statsResult[0]
    
    return NextResponse.json({
      total: parseInt(stats.total),
      published: parseInt(stats.published),
      draft: parseInt(stats.draft),
      archived: parseInt(stats.archived),
      views: 0, // Placeholder - implement view tracking
      engagement: 0 // Placeholder - implement engagement tracking
    })
  } catch (error) {
    console.error('Error fetching blog stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog stats' },
      { status: 500 }
    )
  }
}
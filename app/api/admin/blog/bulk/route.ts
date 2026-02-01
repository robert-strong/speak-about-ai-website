import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { ids, action } = await request.json()
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'Invalid request: missing ids' },
        { status: 400 }
      )
    }

    const sql = neon(process.env.DATABASE_URL!)
    
    switch (action) {
      case 'publish':
        await sql`
          UPDATE blog_posts 
          SET status = 'published', updated_at = NOW()
          WHERE id = ANY(${ids})
        `
        break
        
      case 'archive':
        await sql`
          UPDATE blog_posts 
          SET status = 'archived', updated_at = NOW()
          WHERE id = ANY(${ids})
        `
        break
        
      case 'delete':
        await sql`
          DELETE FROM blog_posts 
          WHERE id = ANY(${ids})
        `
        break
        
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
    
    return NextResponse.json({ 
      success: true,
      affected: ids.length
    })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}
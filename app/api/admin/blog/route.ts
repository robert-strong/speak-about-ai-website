import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')

    const sql = neon(process.env.DATABASE_URL!)

    let posts
    if (status && status !== 'all') {
      posts = await sql`
        SELECT
          id, title, slug, content, meta_description,
          featured_image_url, published_date, tags, status,
          created_at, updated_at, outrank_id, source
        FROM blog_posts
        WHERE status = ${status}
        ORDER BY created_at DESC
      `
    } else {
      posts = await sql`
        SELECT
          id, title, slug, content, meta_description,
          featured_image_url, published_date, tags, status,
          created_at, updated_at, outrank_id, source
        FROM blog_posts
        ORDER BY created_at DESC
      `
    }
    
    return NextResponse.json({ posts })
  } catch (error) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const sql = neon(process.env.DATABASE_URL!)
    
    const result = await sql`
      INSERT INTO blog_posts (
        title,
        slug,
        content,
        meta_description,
        featured_image_url,
        published_date,
        tags,
        status,
        source
      ) VALUES (
        ${data.title},
        ${data.slug},
        ${data.content},
        ${data.meta_description},
        ${data.featured_image_url},
        ${data.published_date},
        ${JSON.stringify(data.tags)}::jsonb,
        ${data.status},
        'manual'
      ) RETURNING id
    `
    
    return NextResponse.json({ 
      success: true, 
      id: result[0].id 
    })
  } catch (error) {
    console.error('Error creating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to create blog post' },
      { status: 500 }
    )
  }
}
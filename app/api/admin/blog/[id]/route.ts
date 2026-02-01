import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const sql = neon(process.env.DATABASE_URL!)
    
    await sql`
      UPDATE blog_posts 
      SET 
        title = ${data.title},
        slug = ${data.slug},
        content = ${data.content},
        meta_description = ${data.meta_description},
        featured_image_url = ${data.featured_image_url},
        published_date = ${data.published_date},
        tags = ${JSON.stringify(data.tags)}::jsonb,
        status = ${data.status},
        updated_at = NOW()
      WHERE id = ${params.id}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating blog post:', error)
    return NextResponse.json(
      { error: 'Failed to update blog post' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = neon(process.env.DATABASE_URL!)
    
    await sql`DELETE FROM blog_posts WHERE id = ${params.id}`
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog post' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'

const getSqlClient = () => {
  if (!process.env.DATABASE_URL) {
    console.log('Blog drafts: No DATABASE_URL found')
    return null
  }
  try {
    return neon(process.env.DATABASE_URL)
  } catch (error) {
    console.error('Failed to initialize Neon client for blog drafts:', error)
    return null
  }
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now()
}

// GET - Retrieve all drafts
export async function GET(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const sql = getSqlClient()
    if (!sql) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const drafts = await sql`
      SELECT
        id, title, slug, content, original_content,
        source_type, source_url, source_filename,
        speakers_mentioned, status, created_at, updated_at
      FROM blog_posts
      WHERE source = 'ai-blog-writer'
      ORDER BY created_at DESC
      LIMIT 50
    `

    return NextResponse.json({ drafts })
  } catch (error) {
    console.error('Error fetching blog drafts:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// POST - Save a new draft
export async function POST(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const sql = getSqlClient()
    if (!sql) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const body = await request.json()
    const {
      title,
      content,
      original_content,
      source_type,
      source_url,
      source_filename,
      speakers_mentioned = 0
    } = body

    if (!title || !content) {
      return NextResponse.json({
        error: 'Title and content are required'
      }, { status: 400 })
    }

    const slug = generateSlug(title)

    const result = await sql`
      INSERT INTO blog_posts (
        title, slug, content, original_content,
        source_type, source_url, source_filename,
        speakers_mentioned, status, source
      )
      VALUES (
        ${title}, ${slug}, ${content}, ${original_content || null},
        ${source_type || null}, ${source_url || null}, ${source_filename || null},
        ${speakers_mentioned}, 'draft', 'ai-blog-writer'
      )
      RETURNING id, title, slug, created_at
    `

    return NextResponse.json({
      success: true,
      draft: result[0]
    })
  } catch (error) {
    console.error('Error saving blog draft:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// PUT - Update an existing draft
export async function PUT(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const sql = getSqlClient()
    if (!sql) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const body = await request.json()
    const { id, title, content } = body

    if (!id || !title || !content) {
      return NextResponse.json({
        error: 'ID, title, and content are required'
      }, { status: 400 })
    }

    const result = await sql`
      UPDATE blog_posts
      SET
        title = ${title},
        content = ${content},
        updated_at = NOW()
      WHERE id = ${id} AND source = 'ai-blog-writer'
      RETURNING id, title, slug, updated_at
    `

    if (result.length === 0) {
      return NextResponse.json({
        error: 'Draft not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      draft: result[0]
    })
  } catch (error) {
    console.error('Error updating blog draft:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// DELETE - Delete a draft
export async function DELETE(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const sql = getSqlClient()
    if (!sql) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({
        error: 'Draft ID is required'
      }, { status: 400 })
    }

    const result = await sql`
      DELETE FROM blog_posts
      WHERE id = ${id} AND source = 'ai-blog-writer'
      RETURNING id
    `

    if (result.length === 0) {
      return NextResponse.json({
        error: 'Draft not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Draft deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting blog draft:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

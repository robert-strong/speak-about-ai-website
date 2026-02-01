import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin authentication
    const adminRequest = request.headers.get('x-admin-request')
    if (!adminRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const sql = neon(process.env.DATABASE_URL!)
    
    const result = await sql`
      SELECT * FROM newsletter_templates WHERE id = ${id}
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error fetching newsletter template:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletter template' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin authentication
    const adminRequest = request.headers.get('x-admin-request')
    if (!adminRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()
    
    const result = await sql`
      UPDATE newsletter_templates SET
        name = ${body.name},
        description = ${body.description || null},
        html_template = ${body.html_template},
        text_template = ${body.text_template || null},
        default_styles = ${body.default_styles || null},
        variables = ${JSON.stringify(body.variables || [])},
        thumbnail_url = ${body.thumbnail_url || null},
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error updating newsletter template:', error)
    return NextResponse.json(
      { error: 'Failed to update newsletter template' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin authentication
    const adminRequest = request.headers.get('x-admin-request')
    if (!adminRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const sql = neon(process.env.DATABASE_URL!)
    
    await sql`
      DELETE FROM newsletter_templates WHERE id = ${id}
    `
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting newsletter template:', error)
    return NextResponse.json(
      { error: 'Failed to delete newsletter template' },
      { status: 500 }
    )
  }
}
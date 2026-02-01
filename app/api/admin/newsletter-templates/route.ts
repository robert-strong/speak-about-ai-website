import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    const adminRequest = request.headers.get('x-admin-request')
    if (!adminRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = neon(process.env.DATABASE_URL!)
    
    const templates = await sql`
      SELECT * FROM newsletter_templates 
      ORDER BY created_at DESC
    `
    
    return NextResponse.json(templates)
  } catch (error) {
    console.error('Error fetching newsletter templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletter templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const adminRequest = request.headers.get('x-admin-request')
    if (!adminRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()
    
    const result = await sql`
      INSERT INTO newsletter_templates (
        name,
        description,
        html_template,
        text_template,
        default_styles,
        variables,
        thumbnail_url
      ) VALUES (
        ${body.name},
        ${body.description || null},
        ${body.html_template},
        ${body.text_template || null},
        ${body.default_styles || null},
        ${JSON.stringify(body.variables || [])},
        ${body.thumbnail_url || null}
      )
      RETURNING *
    `
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error creating newsletter template:', error)
    return NextResponse.json(
      { error: 'Failed to create newsletter template' },
      { status: 500 }
    )
  }
}
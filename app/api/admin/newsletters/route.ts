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
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    
    let query = 'SELECT * FROM newsletters'
    const params = []
    
    if (status) {
      query += ' WHERE status = $1'
      params.push(status)
    }
    
    query += ' ORDER BY created_at DESC'
    
    const newsletters = await sql(query, params)
    
    return NextResponse.json(newsletters)
  } catch (error) {
    console.error('Error fetching newsletters:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletters' },
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
      INSERT INTO newsletters (
        title,
        subject,
        preheader,
        content,
        html_content,
        template,
        status
      ) VALUES (
        ${body.title},
        ${body.subject},
        ${body.preheader || null},
        ${body.content},
        ${body.html_content},
        ${body.template || 'default'},
        ${body.status || 'draft'}
      )
      RETURNING *
    `
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error creating newsletter:', error)
    return NextResponse.json(
      { error: 'Failed to create newsletter' },
      { status: 500 }
    )
  }
}
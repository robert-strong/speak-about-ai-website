import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    const templates = await sql`
      SELECT * FROM contract_templates 
      WHERE is_active = true
      ORDER BY name
    `
    
    return NextResponse.json(templates)
  } catch (error: any) {
    console.error('Error fetching templates:', error)
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()
    
    const result = await sql`
      INSERT INTO contract_templates (
        name,
        type,
        description,
        template_content,
        variables
      ) VALUES (
        ${body.name},
        ${body.type},
        ${body.description},
        ${body.template_content},
        ${JSON.stringify(body.variables || {})}
      )
      RETURNING *
    `
    
    return NextResponse.json(result[0])
  } catch (error: any) {
    console.error('Error creating template:', error)
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    )
  }
}
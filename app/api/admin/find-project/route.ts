import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()
    const { search } = body

    const projects = await sql`
      SELECT p.*,
        (SELECT COUNT(*) FROM invoices i WHERE i.project_id = p.id) as invoice_count,
        d.client_email as deal_email,
        d.deal_value,
        d.speaker_requested
      FROM projects p
      LEFT JOIN deals d ON p.deal_id = d.id
      WHERE p.client_name ILIKE ${'%' + search + '%'}
        OR p.project_name ILIKE ${'%' + search + '%'}
        OR p.company ILIKE ${'%' + search + '%'}
      ORDER BY p.created_at DESC
    `

    return NextResponse.json(projects)
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}

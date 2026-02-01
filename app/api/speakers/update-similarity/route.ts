import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST() {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Update Chris Barton to include Voice Technology
    const result = await sql`
      UPDATE speakers
      SET expertise = '["Innovation", "Friction Elimination", "Creative Persistence", "AI Applications", "Startup Strategy", "Voice Technology"]'::jsonb
      WHERE slug = 'chris-barton'
      RETURNING slug, name, expertise, industries
    `

    return NextResponse.json({
      success: true,
      message: 'Chris Barton updated successfully',
      data: result[0]
    })
  } catch (error) {
    console.error('Error updating speaker:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update speaker' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    const result = await sql`
      UPDATE speakers 
      SET programs = '["The Digital & AI Enhanced Future of Health & Medicine: Where Can Technology Take Us?", "Future of Health & Longevity", "The Exponential Future of Virtual, Augmented, & Extended Reality in Health & Medicine", "Stem Cell Biology and Regenerative Medicine, Hype Hope, & Reality"]'::jsonb
      WHERE name = 'Daniel Kraft'
      RETURNING name, programs
    `
    
    return NextResponse.json({ 
      success: true,
      updated: result[0]
    })
    
  } catch (error) {
    console.error('Error fixing Daniel Kraft:', error)
    return NextResponse.json({ 
      error: 'Failed to fix Daniel Kraft',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
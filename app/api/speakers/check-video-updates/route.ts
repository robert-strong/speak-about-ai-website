import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Check recent video updates for Noah
    const updates = await sql`
      SELECT field_name, old_value, new_value, created_at, changed_by
      FROM speaker_updates 
      WHERE speaker_id = 85 
      AND field_name = 'videos'
      ORDER BY created_at DESC
      LIMIT 10
    `
    
    return NextResponse.json({ 
      success: true,
      videoUpdates: updates
    })
    
  } catch (error) {
    console.error('Error checking video updates:', error)
    return NextResponse.json({ 
      error: 'Failed to check video updates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
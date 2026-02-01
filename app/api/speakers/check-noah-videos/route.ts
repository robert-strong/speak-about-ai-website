import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Get Noah's data directly from database
    const noah = await sql`
      SELECT id, name, videos 
      FROM speakers 
      WHERE name = 'Noah Cheyer'
    `
    
    return NextResponse.json({ 
      success: true,
      noah: noah[0],
      videosType: typeof noah[0]?.videos,
      videosRaw: noah[0]?.videos
    })
    
  } catch (error) {
    console.error('Error checking Noah videos:', error)
    return NextResponse.json({ 
      error: 'Failed to check Noah videos',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
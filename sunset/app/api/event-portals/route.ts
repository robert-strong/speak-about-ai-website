import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // For now, return empty array since we don't have an event_portals table yet
    // In the future, this would fetch event portal data
    const eventPortals: any[] = []
    
    return NextResponse.json(eventPortals)
  } catch (error) {
    console.error('Error fetching event portals:', error)
    return NextResponse.json(
      { error: 'Failed to fetch event portals' },
      { status: 500 }
    )
  }
}
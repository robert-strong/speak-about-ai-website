import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { getAllSpeakers } from '@/lib/speakers-data'

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      database: { available: false, speakers: [], error: null },
      fallback: { speakers: [] }
    }
    
    // Try to get speakers from database
    if (process.env.DATABASE_URL) {
      results.database.available = true
      try {
        const sql = neon(process.env.DATABASE_URL)
        const dbSpeakers = await sql`
          SELECT id, name, email 
          FROM speakers 
          ORDER BY name
        `
        results.database.speakers = dbSpeakers
      } catch (error) {
        results.database.error = error instanceof Error ? error.message : 'Unknown error'
      }
    }
    
    // Get fallback speakers
    const fallbackSpeakers = await getAllSpeakers()
    results.fallback.speakers = fallbackSpeakers.map(s => ({
      name: s.name,
      email: `${s.name.toLowerCase().replace(/\s+/g, '.')}@example.com`
    }))
    
    // Find duplicates
    const dbNames = results.database.speakers.map((s: any) => s.name.toLowerCase())
    const duplicates = dbNames.filter((name: string, index: number) => dbNames.indexOf(name) !== index)
    
    return NextResponse.json({
      summary: {
        databaseCount: results.database.speakers.length,
        fallbackCount: results.fallback.speakers.length,
        duplicates: duplicates
      },
      database: results.database,
      fallback: results.fallback
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to debug speakers',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
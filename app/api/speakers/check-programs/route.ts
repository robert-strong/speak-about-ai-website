import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Check how many speakers have programs data
    const withPrograms = await sql`
      SELECT COUNT(*) as count 
      FROM speakers 
      WHERE programs IS NOT NULL 
      AND programs != 'null'
      AND programs != '[]'
    `
    
    // Get a sample of speakers with programs
    const samplesWithPrograms = await sql`
      SELECT id, name, programs 
      FROM speakers 
      WHERE programs IS NOT NULL 
      AND programs != 'null'
      AND programs != '[]'
      LIMIT 10
    `
    
    // Get a sample of speakers without programs
    const samplesWithoutPrograms = await sql`
      SELECT id, name, programs 
      FROM speakers 
      WHERE programs IS NULL 
      OR programs = 'null'
      OR programs = '[]'
      LIMIT 10
    `
    
    // Check different program formats in database
    const programFormats = await sql`
      SELECT 
        COUNT(CASE WHEN programs IS NULL THEN 1 END) as null_count,
        COUNT(CASE WHEN programs = 'null' THEN 1 END) as string_null_count,
        COUNT(CASE WHEN programs = '[]' THEN 1 END) as empty_array_count,
        COUNT(CASE WHEN programs::text LIKE '[%' THEN 1 END) as json_array_count,
        COUNT(CASE WHEN programs::text LIKE '"%' THEN 1 END) as quoted_json_count,
        COUNT(*) as total_count
      FROM speakers
    `
    
    return NextResponse.json({ 
      success: true,
      stats: {
        speakersWithPrograms: withPrograms[0].count,
        programFormats: programFormats[0]
      },
      samplesWithPrograms,
      samplesWithoutPrograms
    })
    
  } catch (error) {
    console.error('Error checking programs:', error)
    return NextResponse.json({ 
      error: 'Failed to check programs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
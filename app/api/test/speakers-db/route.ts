import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    console.log('Test speakers DB: Starting test...')
    
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({
        error: 'DATABASE_URL not set',
        hasUrl: false
      })
    }
    
    console.log('Test speakers DB: DATABASE_URL is available')
    const sql = neon(process.env.DATABASE_URL)
    
    // Test connection
    console.log('Test speakers DB: Testing connection...')
    await sql`SELECT 1 as test`
    console.log('Test speakers DB: Connection successful')
    
    // Test speakers query
    console.log('Test speakers DB: Querying speakers...')
    const speakers = await sql`
      SELECT id, name, email, featured, active 
      FROM speakers 
      LIMIT 5
    `
    console.log(`Test speakers DB: Found ${speakers.length} speakers`)
    
    return NextResponse.json({
      success: true,
      speakerCount: speakers.length,
      sampleSpeakers: speakers,
      message: 'Database connection and query successful'
    })
    
  } catch (error) {
    console.error('Test speakers DB error:', error)
    return NextResponse.json({
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
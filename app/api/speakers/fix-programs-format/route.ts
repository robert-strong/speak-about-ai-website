import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Get all speakers with programs that aren't in proper JSON array format
    const speakersToFix = await sql`
      SELECT id, name, programs 
      FROM speakers 
      WHERE programs IS NOT NULL 
      AND programs != 'null'
      AND programs != '[]'
      AND programs::text NOT LIKE '[%]'
    `
    
    console.log(`Found ${speakersToFix.length} speakers to fix`)
    
    const fixed = []
    const failed = []
    
    for (const speaker of speakersToFix) {
      try {
        let programsArray = []
        const programsStr = speaker.programs
        
        // Try to parse as JSON first
        try {
          const parsed = JSON.parse(programsStr)
          if (Array.isArray(parsed)) {
            programsArray = parsed
          } else if (typeof parsed === 'object') {
            // It's a JSON object, extract values
            programsArray = Object.values(parsed).filter(v => typeof v === 'string')
          } else if (typeof parsed === 'string') {
            // Single program as string
            programsArray = [parsed]
          }
        } catch (e) {
          // Not valid JSON, treat as comma-separated or plain text
          if (programsStr.includes(',')) {
            // Comma-separated list
            programsArray = programsStr.split(',').map(p => p.trim()).filter(p => p)
          } else if (programsStr.includes('{') && programsStr.includes('}')) {
            // Try to extract from malformed JSON object
            // Look for quoted strings first
            const quotedMatches = programsStr.match(/"([^"]+)"/g)
            if (quotedMatches) {
              programsArray = quotedMatches.map(m => m.replace(/"/g, '').trim()).filter(p => p && p.length > 5)
            } else {
              // Fall back to splitting by comma
              const cleaned = programsStr.replace(/[{}]/g, '')
              programsArray = cleaned.split(',').map(p => p.trim()).filter(p => p && p.length > 5)
            }
          } else {
            // Single program or multiline
            const lines = programsStr.split('\n').map(l => l.trim()).filter(l => l && l.length > 5)
            programsArray = lines.length > 0 ? lines : [programsStr.trim()]
          }
        }
        
        // Clean up the programs
        programsArray = programsArray
          .map(p => p.replace(/^["']|["']$/g, '').trim()) // Remove quotes
          .filter(p => p && p.length > 3) // Remove empty or too short
          .slice(0, 10) // Limit to 10 programs max
        
        if (programsArray.length > 0) {
          // Update the speaker with properly formatted JSON array
          await sql`
            UPDATE speakers 
            SET programs = ${JSON.stringify(programsArray)}::jsonb
            WHERE id = ${speaker.id}
          `
          
          fixed.push({
            id: speaker.id,
            name: speaker.name,
            original: programsStr.substring(0, 100),
            fixed: programsArray
          })
        }
      } catch (error) {
        failed.push({
          id: speaker.id,
          name: speaker.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }
    
    return NextResponse.json({ 
      success: true,
      message: `Fixed ${fixed.length} speakers, failed ${failed.length}`,
      fixed: fixed.slice(0, 10), // Show first 10 fixed
      failed
    })
    
  } catch (error) {
    console.error('Error fixing programs format:', error)
    return NextResponse.json({ 
      error: 'Failed to fix programs format',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
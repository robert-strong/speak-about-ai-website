import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  // GET: Check for speakers with comma-separated programs (don't fix, just report)
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const speakers = await sql`
      SELECT id, name, programs
      FROM speakers
      WHERE programs IS NOT NULL
      AND programs != 'null'
      AND programs != '[]'
      ORDER BY name
    `

    const issues: any[] = []

    for (const speaker of speakers) {
      const programs = speaker.programs

      if (Array.isArray(programs)) {
        for (const program of programs) {
          if (typeof program === 'string' && program.includes(',')) {
            const parts = program.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 3)
            if (parts.length >= 2) {
              issues.push({
                id: speaker.id,
                name: speaker.name,
                problematicProgram: program,
                suggestedSplit: parts
              })
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      totalSpeakersChecked: speakers.length,
      issuesFound: issues.length,
      issues
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      error: 'Failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // PART 1: Fix speakers with comma-separated strings inside valid arrays
    const allSpeakers = await sql`
      SELECT id, name, programs
      FROM speakers
      WHERE programs IS NOT NULL
      AND programs != 'null'
      AND programs != '[]'
    `

    const fixedComma: any[] = []

    for (const speaker of allSpeakers) {
      const programs = speaker.programs

      if (Array.isArray(programs)) {
        let needsFix = false
        const newPrograms: string[] = []

        for (const program of programs) {
          if (typeof program === 'string' && program.includes(',')) {
            const parts = program.split(',').map((p: string) => p.trim()).filter((p: string) => p.length > 3)
            if (parts.length >= 2) {
              needsFix = true
              newPrograms.push(...parts)
            } else {
              newPrograms.push(program)
            }
          } else if (typeof program === 'string') {
            newPrograms.push(program)
          }
        }

        if (needsFix) {
          await sql`
            UPDATE speakers
            SET programs = ${JSON.stringify(newPrograms)}::jsonb
            WHERE id = ${speaker.id}
          `
          fixedComma.push({
            id: speaker.id,
            name: speaker.name,
            before: programs,
            after: newPrograms
          })
        }
      }
    }

    // PART 2: Fix speakers with programs that aren't in proper JSON array format
    const speakersToFix = await sql`
      SELECT id, name, programs
      FROM speakers
      WHERE programs IS NOT NULL
      AND programs != 'null'
      AND programs != '[]'
      AND programs::text NOT LIKE '[%]'
    `

    console.log(`Found ${speakersToFix.length} speakers to fix (non-array format)`)
    
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
      message: `Fixed ${fixedComma.length} comma-separated, ${fixed.length} non-array format, ${failed.length} failed`,
      fixedCommaSeparated: fixedComma,
      fixedNonArray: fixed.slice(0, 10),
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
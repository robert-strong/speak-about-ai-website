import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Get all speakers with programs
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
        // Check if any program item contains commas (suggesting it should be split)
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

    // Get all speakers with programs that have comma issues
    const speakers = await sql`
      SELECT id, name, programs
      FROM speakers
      WHERE programs IS NOT NULL
      AND programs != 'null'
      AND programs != '[]'
    `

    const fixed: any[] = []

    for (const speaker of speakers) {
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
          fixed.push({
            id: speaker.id,
            name: speaker.name,
            before: programs,
            after: newPrograms
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Fixed ${fixed.length} speakers`,
      fixed
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      error: 'Failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

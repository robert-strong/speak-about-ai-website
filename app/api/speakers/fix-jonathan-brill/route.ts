import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    // Get Jonathan Brill's current data
    const speakers = await sql`
      SELECT id, name, programs, topics
      FROM speakers
      WHERE LOWER(name) LIKE '%jonathan%brill%'
      OR slug = 'jonathan-brill'
    `

    if (speakers.length === 0) {
      return NextResponse.json({ error: 'Jonathan Brill not found' })
    }

    const speaker = speakers[0]

    return NextResponse.json({
      id: speaker.id,
      name: speaker.name,
      programs: speaker.programs,
      programsType: typeof speaker.programs,
      programsIsArray: Array.isArray(speaker.programs),
      topics: speaker.topics,
      topicsType: typeof speaker.topics
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

    // Get Jonathan Brill
    const speakers = await sql`
      SELECT id, name, programs, topics
      FROM speakers
      WHERE LOWER(name) LIKE '%jonathan%brill%'
      OR slug = 'jonathan-brill'
    `

    if (speakers.length === 0) {
      return NextResponse.json({ error: 'Jonathan Brill not found' })
    }

    const speaker = speakers[0]
    let programs = speaker.programs

    // Check if programs is a single comma-separated string in an array
    if (Array.isArray(programs) && programs.length === 1 && typeof programs[0] === 'string' && programs[0].includes(',')) {
      // Split the comma-separated string into separate items
      const splitPrograms = programs[0].split(',').map((p: string) => p.trim()).filter((p: string) => p)

      await sql`
        UPDATE speakers
        SET programs = ${JSON.stringify(splitPrograms)}::jsonb
        WHERE id = ${speaker.id}
      `

      return NextResponse.json({
        success: true,
        message: 'Fixed programs - split comma-separated string',
        before: programs,
        after: splitPrograms
      })
    }

    // Check if programs is empty but topics has data
    if ((!programs || (Array.isArray(programs) && programs.length === 0)) && Array.isArray(speaker.topics) && speaker.topics.length > 0) {
      await sql`
        UPDATE speakers
        SET programs = ${JSON.stringify(speaker.topics)}::jsonb
        WHERE id = ${speaker.id}
      `

      return NextResponse.json({
        success: true,
        message: 'Copied topics to programs',
        before: programs,
        after: speaker.topics
      })
    }

    return NextResponse.json({
      success: false,
      message: 'No fix needed or unable to determine fix',
      programs,
      topics: speaker.topics
    })

  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json({
      error: 'Failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

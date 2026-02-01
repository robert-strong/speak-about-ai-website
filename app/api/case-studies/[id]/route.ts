import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// GET /api/case-studies/[id] - Fetch a single case study
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const { id } = params

    const result = await sql`
      SELECT
        cs.*,
        json_agg(
          json_build_object(
            'id', s.id,
            'name', s.name,
            'slug', s.slug,
            'title', s.one_liner,
            'headshot', s.headshot_url
          ) ORDER BY css.display_order
        ) FILTER (WHERE s.id IS NOT NULL) as speakers
      FROM case_studies cs
      LEFT JOIN case_study_speakers css ON cs.id = css.case_study_id
      LEFT JOIN speakers s ON css.speaker_id = s.id
      WHERE cs.id = ${id}
      GROUP BY cs.id
    `

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Case study not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error fetching case study:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch case study' },
      { status: 500 }
    )
  }
}

// PUT /api/case-studies/[id] - Update a case study
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const { id } = params
    const body = await request.json()
    const {
      company,
      logo_url,
      location,
      event_type,
      image_url,
      image_alt,
      speaker_contribution,
      testimonial,
      testimonial_author,
      testimonial_title,
      video_url,
      impact_points,
      speaker_ids,
      display_order,
      active,
      featured
    } = body

    // Update case study
    const result = await sql`
      UPDATE case_studies
      SET company = ${company}, logo_url = ${logo_url}, location = ${location}, event_type = ${event_type},
          image_url = ${image_url}, image_alt = ${image_alt}, speaker_contribution = ${speaker_contribution},
          testimonial = ${testimonial}, testimonial_author = ${testimonial_author}, testimonial_title = ${testimonial_title},
          video_url = ${video_url}, impact_points = ${impact_points}, display_order = ${display_order}, active = ${active}, featured = ${featured}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Case study not found' },
        { status: 404 }
      )
    }

    // Update speaker associations
    await sql`DELETE FROM case_study_speakers WHERE case_study_id = ${id}`

    if (speaker_ids && speaker_ids.length > 0) {
      for (let i = 0; i < speaker_ids.length; i++) {
        await sql`
          INSERT INTO case_study_speakers (case_study_id, speaker_id, display_order)
          VALUES (${id}, ${speaker_ids[i]}, ${i})
        `
      }
    }

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error updating case study:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update case study' },
      { status: 500 }
    )
  }
}

// DELETE /api/case-studies/[id] - Delete a case study
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const { id } = params

    const result = await sql`DELETE FROM case_studies WHERE id = ${id} RETURNING *`

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Case study not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: 'Case study deleted successfully' })
  } catch (error) {
    console.error('Error deleting case study:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete case study' },
      { status: 500 }
    )
  }
}

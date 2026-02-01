import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// GET /api/case-studies - Fetch all case studies
export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const result = await sql`
      SELECT
        cs.id,
        cs.company,
        cs.logo_url,
        cs.location,
        cs.event_type,
        cs.image_url,
        cs.image_alt,
        cs.speaker_contribution,
        cs.testimonial,
        cs.testimonial_author,
        cs.testimonial_title,
        cs.video_url,
        cs.impact_points,
        cs.display_order,
        cs.active,
        cs.featured,
        json_agg(
          json_build_object(
            'name', s.name,
            'slug', s.slug,
            'title', s.one_liner,
            'headshot', s.headshot_url
          ) ORDER BY css.display_order
        ) FILTER (WHERE s.id IS NOT NULL) as speakers
      FROM case_studies cs
      LEFT JOIN case_study_speakers css ON cs.id = css.case_study_id
      LEFT JOIN speakers s ON css.speaker_id = s.id
      WHERE cs.active = true
      GROUP BY cs.id, cs.company, cs.logo_url, cs.location, cs.event_type, cs.image_url, cs.image_alt, cs.speaker_contribution, cs.testimonial, cs.testimonial_author, cs.testimonial_title, cs.video_url, cs.impact_points, cs.display_order, cs.active, cs.featured
      ORDER BY cs.display_order, cs.created_at DESC
    `

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Error fetching case studies:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch case studies' },
      { status: 500 }
    )
  }
}

// POST /api/case-studies - Create a new case study
export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    const body = await request.json()
    const {
      company,
      logo_url,
      location,
      event_type,
      image_url,
      image_alt,
      testimonial,
      testimonial_author,
      testimonial_title,
      speaker_contribution,
      video_url,
      impact_points,
      speaker_ids,
      display_order = 0,
      active = true,
      featured = false
    } = body

    // Validate required fields
    if (!company || !image_url || !image_alt || !impact_points) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert case study
    const result = await sql`
      INSERT INTO case_studies
        (company, logo_url, location, event_type, image_url, image_alt, testimonial, testimonial_author, testimonial_title, speaker_contribution, video_url, impact_points, display_order, active, featured)
      VALUES (${company}, ${logo_url}, ${location}, ${event_type}, ${image_url}, ${image_alt}, ${testimonial}, ${testimonial_author}, ${testimonial_title}, ${speaker_contribution}, ${video_url}, ${impact_points}, ${display_order}, ${active}, ${featured})
      RETURNING *
    `

    const caseStudyId = result[0].id

    // Insert speaker associations
    if (speaker_ids && speaker_ids.length > 0) {
      for (let i = 0; i < speaker_ids.length; i++) {
        await sql`
          INSERT INTO case_study_speakers (case_study_id, speaker_id, display_order)
          VALUES (${caseStudyId}, ${speaker_ids[i]}, ${i})
        `
      }
    }

    return NextResponse.json({ success: true, data: result[0] })
  } catch (error) {
    console.error('Error creating case study:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create case study' },
      { status: 500 }
    )
  }
}

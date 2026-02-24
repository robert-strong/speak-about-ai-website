import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const results = {
      invoicing_migrated: 0,
      invoicing_track_copied: 0,
      errors: [] as string[]
    }

    // 1. Migrate projects at "invoicing" status → "logistics_planning"
    const invoicingProjects = await sql`
      SELECT id, project_name, stage_completion
      FROM projects
      WHERE status = 'invoicing'
    `

    for (const project of invoicingProjects) {
      try {
        await sql`
          UPDATE projects
          SET status = 'logistics_planning', updated_at = CURRENT_TIMESTAMP
          WHERE id = ${project.id}
        `
        results.invoicing_migrated++
      } catch (err) {
        results.errors.push(`Failed to migrate project #${project.id}: ${err}`)
      }
    }

    // 2. Copy stage_completion.invoicing → stage_completion.invoicing_track for all projects
    const allProjects = await sql`
      SELECT id, project_name, stage_completion
      FROM projects
      WHERE stage_completion IS NOT NULL
    `

    for (const project of allProjects) {
      try {
        const sc = project.stage_completion || {}

        // If there's an "invoicing" key but no "invoicing_track", copy it
        if (sc.invoicing && !sc.invoicing_track) {
          sc.invoicing_track = { ...sc.invoicing }
          delete sc.invoicing

          await sql`
            UPDATE projects
            SET stage_completion = ${JSON.stringify(sc)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${project.id}
          `
          results.invoicing_track_copied++
        }
      } catch (err) {
        results.errors.push(`Failed to copy invoicing_track for project #${project.id}: ${err}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow stage migration completed',
      results
    })

  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

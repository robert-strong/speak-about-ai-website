import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

/**
 * Migration endpoint to populate Notes with Additional Information
 * for existing inquiries that have additional_info but empty notes
 */
export async function POST() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }
    const sql = neon(databaseUrl)

    // Update deals: copy additional_info to notes where notes is empty/null
    const dealsResult = await sql`
      UPDATE deals
      SET notes = '[Additional Information from Inquiry]' || E'\n' || additional_info,
          updated_at = CURRENT_TIMESTAMP
      WHERE additional_info IS NOT NULL
        AND additional_info != ''
        AND (notes IS NULL OR notes = '')
      RETURNING id
    `

    // Update form_submissions: copy additional_info to admin_notes where admin_notes is empty/null
    const formSubmissionsResult = await sql`
      UPDATE form_submissions
      SET admin_notes = '[Additional Information from Inquiry]' || E'\n' || additional_info,
          updated_at = CURRENT_TIMESTAMP
      WHERE additional_info IS NOT NULL
        AND additional_info != ''
        AND (admin_notes IS NULL OR admin_notes = '')
      RETURNING id
    `

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      dealsUpdated: dealsResult.length,
      formSubmissionsUpdated: formSubmissionsResult.length,
      updatedDealIds: dealsResult.map(d => d.id),
      updatedFormSubmissionIds: formSubmissionsResult.map(f => f.id)
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json({
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Also allow GET for easy browser access
export async function GET() {
  return POST()
}

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(databaseUrl)
    
    // Get recent form submissions
    const recentSubmissions = await sql`
      SELECT 
        id,
        submission_type,
        source_url,
        name,
        email,
        organization_name,
        newsletter_opt_in,
        created_at,
        form_data->>'sourceUrl' as form_source_url,
        form_data->>'landingPageTitle' as form_landing_title
      FROM form_submissions
      ORDER BY created_at DESC
      LIMIT 10
    `
    
    // Get recent newsletter signups
    const recentNewsletters = await sql`
      SELECT 
        id,
        email,
        name,
        company,
        status,
        source,
        ip_address,
        subscribed_at
      FROM newsletter_signups
      ORDER BY subscribed_at DESC
      LIMIT 10
    `
    
    // Get counts
    const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM form_submissions) as total_submissions,
        (SELECT COUNT(*) FROM form_submissions WHERE created_at >= CURRENT_DATE - INTERVAL '1 day') as submissions_today,
        (SELECT COUNT(*) FROM newsletter_signups) as total_newsletters,
        (SELECT COUNT(*) FROM newsletter_signups WHERE subscribed_at >= CURRENT_DATE - INTERVAL '1 day') as newsletters_today
    `
    
    return NextResponse.json({
      counts: counts[0],
      recentSubmissions,
      recentNewsletters,
      debug: {
        databaseConnected: true,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch debug data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
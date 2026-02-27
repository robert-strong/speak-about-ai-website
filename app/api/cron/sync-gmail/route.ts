import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { syncGmailForUser } from '@/lib/sync-gmail'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all authenticated Gmail users
    const users = await sql`SELECT user_email FROM gmail_auth_tokens`

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Gmail accounts connected',
        synced: 0
      })
    }

    const results = []

    // Sync each user's Gmail
    for (const user of users) {
      try {
        const syncResults = await syncGmailForUser(user.user_email)
        results.push({
          userEmail: user.user_email,
          success: true,
          data: syncResults
        })
      } catch (error) {
        results.push({
          userEmail: user.user_email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${results.length} Gmail accounts`,
      timestamp: new Date().toISOString(),
      results
    })
  } catch (error) {
    console.error('Cron Gmail sync error:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync Gmail',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const runtime = 'edge'

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
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    // Sync each user's Gmail
    for (const user of users) {
      try {
        const response = await fetch(`${baseUrl}/api/gmail/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: user.user_email })
        })

        const data = await response.json()
        results.push({
          userEmail: user.user_email,
          success: response.ok,
          data
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

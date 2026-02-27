import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { syncGmailForUser } from '@/lib/sync-gmail'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    let fullSync = false
    try {
      const body = await request.json()
      fullSync = body.fullSync === true
    } catch {
      // No body or invalid JSON is fine, default to incremental sync
    }

    // Get all authenticated Gmail users
    const users = await sql`SELECT user_email FROM gmail_auth_tokens`

    if (users.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No Gmail accounts connected. Go to Settings to connect your Gmail account.'
      }, { status: 400 })
    }

    const results = []

    for (const user of users) {
      try {
        const syncResults = await syncGmailForUser(user.user_email, fullSync)
        results.push({
          userEmail: user.user_email,
          success: true,
          data: { results: syncResults }
        })
      } catch (error) {
        results.push({
          userEmail: user.user_email,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    const totalStored = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.data?.results?.stored || 0), 0)
    const totalMessages = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + (r.data?.results?.totalMessages || 0), 0)

    return NextResponse.json({
      success: true,
      message: `Synced ${totalStored} of ${totalMessages} emails from ${results.length} account(s)`,
      results
    })
  } catch (error) {
    console.error('Error syncing Gmail:', error)
    return NextResponse.json(
      {
        error: 'Failed to sync Gmail',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

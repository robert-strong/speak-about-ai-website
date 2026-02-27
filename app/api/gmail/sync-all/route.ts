import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

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

    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const results = []

    for (const user of users) {
      try {
        const response = await fetch(`${baseUrl}/api/gmail/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userEmail: user.user_email, fullSync })
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

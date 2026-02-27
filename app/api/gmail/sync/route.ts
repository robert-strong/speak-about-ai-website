import { NextRequest, NextResponse } from 'next/server'
import { syncGmailForUser } from '@/lib/sync-gmail'

export async function POST(request: NextRequest) {
  try {
    const { userEmail, fullSync } = await request.json()

    if (!userEmail) {
      return NextResponse.json({ error: 'userEmail is required' }, { status: 400 })
    }

    const results = await syncGmailForUser(userEmail, fullSync)

    return NextResponse.json({
      success: true,
      message: `Synced ${results.stored} emails (${results.matched.leads} leads, ${results.matched.deals} deals, ${results.unmatched} unmatched)`,
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

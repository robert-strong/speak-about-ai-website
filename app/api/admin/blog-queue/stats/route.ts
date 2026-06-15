import { NextRequest, NextResponse } from 'next/server'
import { getQueueStats } from '@/lib/blog-queue-db'

export async function GET(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const stats = await getQueueStats()

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching blog queue stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog queue stats' },
      { status: 500 }
    )
  }
}

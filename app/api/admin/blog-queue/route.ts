import { NextRequest, NextResponse } from 'next/server'
import { getQueueItems, createQueueItem, QueueStatus } from '@/lib/blog-queue-db'

export async function GET(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as QueueStatus | null
    const search = searchParams.get('search')
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')

    const items = await getQueueItems({
      status: status && status !== 'all' ? status as QueueStatus : undefined,
      search: search || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching blog queue items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog queue items' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    if (!data.brief) {
      return NextResponse.json(
        { error: 'Brief is required' },
        { status: 400 }
      )
    }

    const item = await createQueueItem(data)

    return NextResponse.json({
      success: true,
      item
    })
  } catch (error) {
    console.error('Error creating blog queue item:', error)
    return NextResponse.json(
      { error: 'Failed to create blog queue item' },
      { status: 500 }
    )
  }
}

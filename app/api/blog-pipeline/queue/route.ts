import { NextRequest, NextResponse } from 'next/server'
import { getQueuedItems, getQueueItemById, updateQueueItem, getQueueItems, QueueStatus } from '@/lib/blog-queue-db'

// Verify API key authentication
function verifyApiKey(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false
  }
  const token = authHeader.substring(7)
  const expectedKey = process.env.BLOG_PIPELINE_API_KEY
  if (!expectedKey) {
    console.error('BLOG_PIPELINE_API_KEY environment variable is not set')
    return false
  }
  return token === expectedKey
}

export async function GET(request: NextRequest) {
  try {
    if (!verifyApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')
    const status = searchParams.get('status') as QueueStatus | null

    if (id) {
      // Get specific item
      const item = await getQueueItemById(parseInt(id))
      if (!item) {
        return NextResponse.json({ error: 'Item not found' }, { status: 404 })
      }
      return NextResponse.json({ item })
    }

    // Get items by status (default to 'queued' for backward compatibility)
    if (status) {
      const items = await getQueueItems({ status })
      return NextResponse.json({ items })
    }

    // Default: get all queued items
    const items = await getQueuedItems()
    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error fetching queue items:', error)
    return NextResponse.json(
      { error: 'Failed to fetch queue items' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!verifyApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { id, ...updates } = data

    if (!id) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      )
    }

    // Add timestamp for last_run
    if (updates.status === 'processing' || updates.status === 'drafted' || updates.status === 'created') {
      updates.last_run = new Date().toISOString()
    }

    const item = await updateQueueItem(parseInt(id), updates)

    return NextResponse.json({
      success: true,
      item
    })
  } catch (error) {
    console.error('Error updating queue item:', error)
    return NextResponse.json(
      { error: 'Failed to update queue item' },
      { status: 500 }
    )
  }
}

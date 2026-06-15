import { NextRequest, NextResponse } from 'next/server'
import { getQueueItemById, updateQueueItem, deleteQueueItem } from '@/lib/blog-queue-db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const item = await getQueueItemById(parseInt(id))

    if (!item) {
      return NextResponse.json(
        { error: 'Queue item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ item })
  } catch (error) {
    console.error('Error fetching blog queue item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog queue item' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    const item = await updateQueueItem(parseInt(id), data)

    return NextResponse.json({
      success: true,
      item
    })
  } catch (error) {
    console.error('Error updating blog queue item:', error)
    return NextResponse.json(
      { error: 'Failed to update blog queue item' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await deleteQueueItem(parseInt(id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting blog queue item:', error)
    return NextResponse.json(
      { error: 'Failed to delete blog queue item' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { bulkUpdateStatus, bulkDeleteItems, QueueStatus } from '@/lib/blog-queue-db'

export async function POST(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { ids, action, status } = data

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: 'IDs array is required' },
        { status: 400 }
      )
    }

    if (!action) {
      return NextResponse.json(
        { error: 'Action is required' },
        { status: 400 }
      )
    }

    let affected = 0

    switch (action) {
      case 'delete':
        affected = await bulkDeleteItems(ids)
        break
      case 'status':
        if (!status) {
          return NextResponse.json(
            { error: 'Status is required for status action' },
            { status: 400 }
          )
        }
        affected = await bulkUpdateStatus(ids, status as QueueStatus)
        break
      case 'archive':
        affected = await bulkUpdateStatus(ids, 'archived')
        break
      case 'queue':
        affected = await bulkUpdateStatus(ids, 'queued')
        break
      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      affected
    })
  } catch (error) {
    console.error('Error performing bulk action:', error)
    return NextResponse.json(
      { error: 'Failed to perform bulk action' },
      { status: 500 }
    )
  }
}

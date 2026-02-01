import { NextRequest, NextResponse } from 'next/server'
import { getConferenceById, updateConference, deleteConference } from '@/lib/conferences-db'

// GET /api/conferences/[id] - Get single conference
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const conferenceId = parseInt(id, 10)

    if (isNaN(conferenceId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid conference ID' },
        { status: 400 }
      )
    }

    const conference = await getConferenceById(conferenceId)

    if (!conference) {
      return NextResponse.json(
        { success: false, error: 'Conference not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, conference })
  } catch (error) {
    console.error('Error fetching conference:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch conference' },
      { status: 500 }
    )
  }
}

// PUT /api/conferences/[id] - Update conference
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const conferenceId = parseInt(id, 10)

    if (isNaN(conferenceId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid conference ID' },
        { status: 400 }
      )
    }

    const body = await request.json()

    // Update the conference
    const updated = await updateConference(conferenceId, body)

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Conference not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, conference: updated })
  } catch (error) {
    console.error('Error updating conference:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update conference' },
      { status: 500 }
    )
  }
}

// DELETE /api/conferences/[id] - Delete conference
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const conferenceId = parseInt(id, 10)

    if (isNaN(conferenceId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid conference ID' },
        { status: 400 }
      )
    }

    const deleted = await deleteConference(conferenceId)

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Conference not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, message: 'Conference deleted successfully' })
  } catch (error) {
    console.error('Error deleting conference:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete conference' },
      { status: 500 }
    )
  }
}

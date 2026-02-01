import { NextRequest, NextResponse } from 'next/server'
import { getConferenceBySlug } from '@/lib/conferences-db'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const conference = await getConferenceBySlug(params.slug)

    if (!conference) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    // Check if user is admin or if conference is published
    const isAdmin = request.cookies.get('adminLoggedIn')?.value === 'true'
    if (!conference.published && !isAdmin) {
      return NextResponse.json(
        { error: 'Conference not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ conference })
  } catch (error) {
    console.error('Error fetching conference by slug:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conference' },
      { status: 500 }
    )
  }
}

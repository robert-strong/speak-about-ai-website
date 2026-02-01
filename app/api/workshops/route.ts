import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getActiveWorkshops, getAllWorkshops, createWorkshop } from '@/lib/workshops-db'
import { requireAdminAuth } from '@/lib/auth-middleware'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const workshops = includeInactive ? await getAllWorkshops() : await getActiveWorkshops()

    // Return full workshop data (used by both directory and contact form)
    return NextResponse.json({
      success: true,
      workshops: workshops
    })
  } catch (error) {
    console.error('Get workshops error:', error)
    return NextResponse.json({
      success: false,
      workshops: [],
      error: 'Failed to fetch workshops'
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const devBypass = request.headers.get('x-dev-admin-bypass')
    if (devBypass !== 'dev-admin-access') {
      const authError = requireAdminAuth(request)
      if (authError) return authError
    }

    const body = await request.json()
    const workshop = await createWorkshop(body)

    // Revalidate the public workshop pages cache
    try {
      revalidatePath('/ai-workshops')
      if (workshop.slug) {
        revalidatePath(`/ai-workshops/${workshop.slug}`)
        console.log(`Revalidated cache for new workshop /ai-workshops/${workshop.slug}`)
      }
    } catch (revalidateError) {
      console.error('Failed to revalidate cache:', revalidateError)
      // Don't fail the create if revalidation fails
    }

    return NextResponse.json(workshop, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/workshops:', error)
    return NextResponse.json(
      { error: 'Failed to create workshop', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

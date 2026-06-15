import { NextRequest, NextResponse } from 'next/server'
import { getExistingBriefs, createBriefs } from '@/lib/blog-queue-db'

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
    const limit = searchParams.get('limit')

    const briefs = await getExistingBriefs(limit ? parseInt(limit) : 30)

    return NextResponse.json({ briefs })
  } catch (error) {
    console.error('Error fetching briefs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch briefs' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyApiKey(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const { briefs } = data

    if (!briefs || !Array.isArray(briefs) || briefs.length === 0) {
      return NextResponse.json(
        { error: 'Briefs array is required' },
        { status: 400 }
      )
    }

    const created = await createBriefs(briefs)

    return NextResponse.json({
      success: true,
      count: created.length,
      items: created
    })
  } catch (error) {
    console.error('Error creating briefs:', error)
    return NextResponse.json(
      { error: 'Failed to create briefs' },
      { status: 500 }
    )
  }
}

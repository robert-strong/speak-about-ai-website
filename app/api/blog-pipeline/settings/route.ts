import { NextRequest, NextResponse } from 'next/server'
import { getSetting } from '@/lib/blog-queue-db'

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
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json(
        { error: 'Setting key is required' },
        { status: 400 }
      )
    }

    const value = await getSetting(key)

    if (value === null) {
      return NextResponse.json(
        { error: `Setting '${key}' not found` },
        { status: 404 }
      )
    }

    return NextResponse.json({ key, value })
  } catch (error) {
    console.error('Error fetching setting:', error)
    return NextResponse.json(
      { error: 'Failed to fetch setting' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { getSetting, getSettings } from '@/lib/blog-queue-db'

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
    const keys = searchParams.get('keys') // Comma-separated list of keys

    // If no key specified, return all settings
    if (!key && !keys) {
      const allSettings = await getSettings()
      // Convert array of {key, value} to object
      const settingsObject: Record<string, string> = {}
      for (const setting of allSettings) {
        settingsObject[setting.key] = setting.value
      }
      return NextResponse.json({ settings: settingsObject })
    }

    // If multiple keys requested
    if (keys) {
      const keyList = keys.split(',').map(k => k.trim())
      const result: Record<string, string | null> = {}
      for (const k of keyList) {
        result[k] = await getSetting(k)
      }
      return NextResponse.json({ settings: result })
    }

    // Single key lookup (original behavior)
    const value = await getSetting(key!)

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

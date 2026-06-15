import { NextRequest, NextResponse } from 'next/server'
import { getSettings, updateSettings } from '@/lib/blog-queue-db'

export async function GET(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getSettings()

    // Convert array to object for easier consumption
    const settingsObj: Record<string, string> = {}
    for (const setting of settings) {
      settingsObj[setting.key] = setting.value
    }

    return NextResponse.json({ settings: settingsObj, raw: settings })
  } catch (error) {
    console.error('Error fetching blog settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch blog settings' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    if (!data.settings || typeof data.settings !== 'object') {
      return NextResponse.json(
        { error: 'Settings object is required' },
        { status: 400 }
      )
    }

    const updated = await updateSettings(data.settings)

    return NextResponse.json({
      success: true,
      updated
    })
  } catch (error) {
    console.error('Error updating blog settings:', error)
    return NextResponse.json(
      { error: 'Failed to update blog settings' },
      { status: 500 }
    )
  }
}

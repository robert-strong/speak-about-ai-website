import { NextResponse } from 'next/server'
import { put } from '@vercel/blob'

export async function POST(request: Request) {
  try {
    // Check referer for admin access
    const referer = request.headers.get('referer')
    if (!referer || !referer.includes('/admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Check if Blob token is available
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      console.error('BLOB_READ_WRITE_TOKEN is not set')
      return NextResponse.json({ error: 'File upload service unavailable' }, { status: 503 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string || 'uploads'

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Please upload JPEG, PNG, GIF, WebP, or SVG.' }, { status: 400 })
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 5MB.' }, { status: 400 })
    }

    // Create a safe filename with folder prefix
    const timestamp = Date.now()
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase()
    const filename = `${folder}/${timestamp}-${originalName}`

    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    })

    return NextResponse.json({
      success: true,
      path: blob.url,
      filename: blob.pathname,
      size: file.size,
      type: file.type,
      url: blob.url
    })
  } catch (error) {
    console.error('Error uploading image:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to upload image'
    }, { status: 500 })
  }
}

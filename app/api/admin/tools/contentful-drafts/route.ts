import { NextRequest, NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/auth-middleware'

const contentful = require('contentful-management')

export async function GET(request: NextRequest) {
  try {
    // Authentication check
    const authError = requireAdminAuth(request)
    if (authError) {
      return authError
    }

    // Check for Contentful Management Token
    if (!process.env.CONTENTFUL_MANAGEMENT_TOKEN || !process.env.CONTENTFUL_SPACE_ID) {
      return NextResponse.json({
        error: 'Contentful credentials not configured'
      }, { status: 500 })
    }

    // Initialize Contentful Management client
    const client = contentful.createClient({
      accessToken: process.env.CONTENTFUL_MANAGEMENT_TOKEN
    })

    // Get space and environment
    const space = await client.getSpace(process.env.CONTENTFUL_SPACE_ID)
    const environment = await space.getEnvironment('master')

    // Fetch all blog post entries (both draft and published)
    const entries = await environment.getEntries({
      content_type: 'blogPost',
      order: '-sys.updatedAt',
      limit: 50
    })

    // Filter to only draft entries (not published) and map to simple format
    const drafts = entries.items
      .filter((entry: any) => !entry.sys.publishedAt || entry.sys.updatedAt > entry.sys.publishedAt)
      .map((entry: any) => ({
        id: entry.sys.id,
        title: entry.fields.title?.['en-US'] || 'Untitled',
        body: entry.fields.body?.['en-US']?.substring(0, 200) || '',
        createdAt: entry.sys.createdAt,
        updatedAt: entry.sys.updatedAt,
        status: entry.sys.publishedAt ? 'changed' : 'draft',
        url: `https://app.contentful.com/spaces/${process.env.CONTENTFUL_SPACE_ID}/entries/${entry.sys.id}`
      }))

    return NextResponse.json({
      success: true,
      drafts
    })

  } catch (error) {
    console.error('Fetch Contentful drafts error:', error)
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to fetch drafts'
    }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { revalidatePath } from 'next/cache'
import { clearContentCache } from '@/lib/website-content'

export async function POST() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(databaseUrl)

    const newIndustriesLinks = JSON.stringify([
      { text: 'Healthcare AI', url: '/industries/healthcare-keynote-speakers' },
      { text: 'Technology & Enterprise', url: '/industries/technology-keynote-speakers' },
      { text: 'Financial Services', url: '/industries/financial-services-keynote-speakers' },
      { text: 'Leadership & Business', url: '/industries/leadership-business-keynote-speakers' },
      { text: 'Sales, Marketing & Retail', url: '/industries/sales-marketing-keynote-speakers' },
      { text: 'Industrial & Automotive', url: '/industries/industrial-automotive-keynote-speakers' },
      { text: 'Government & Education', url: '/industries/government-education-keynote-speakers' }
    ])

    const result = await sql`
      UPDATE website_content
      SET content_value = ${newIndustriesLinks},
          updated_at = CURRENT_TIMESTAMP,
          updated_by = 'system'
      WHERE page = 'footer' AND section = 'industries' AND content_key = 'links'
      RETURNING *
    `

    // Clear cache and revalidate
    clearContentCache()
    revalidatePath('/', 'layout')

    return NextResponse.json({
      success: true,
      message: 'Footer industries updated',
      updated: result[0]
    })
  } catch (error) {
    console.error('Error updating footer industries:', error)
    return NextResponse.json({ error: 'Failed to update footer industries' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(databaseUrl)

    const result = await sql`
      SELECT * FROM website_content
      WHERE page = 'footer' AND section = 'industries'
    `

    return NextResponse.json({ current: result })
  } catch (error) {
    console.error('Error fetching footer industries:', error)
    return NextResponse.json({ error: 'Failed to fetch footer industries' }, { status: 500 })
  }
}

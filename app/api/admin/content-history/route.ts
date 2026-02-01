import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { clearContentCache } from '@/lib/website-content'
import { revalidatePath } from 'next/cache'

// Create the history table if it doesn't exist
async function ensureHistoryTable(sql: ReturnType<typeof neon>) {
  await sql`
    CREATE TABLE IF NOT EXISTS website_content_history (
      id SERIAL PRIMARY KEY,
      content_id INTEGER,
      page VARCHAR(50) NOT NULL,
      section VARCHAR(100) NOT NULL,
      content_key VARCHAR(100) NOT NULL,
      old_value TEXT,
      new_value TEXT NOT NULL,
      changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      changed_by VARCHAR(255) DEFAULT 'admin',
      action VARCHAR(20) DEFAULT 'update'
    )
  `

  // Create index for faster queries
  await sql`
    CREATE INDEX IF NOT EXISTS idx_content_history_key
    ON website_content_history(page, section, content_key)
  `
}

// GET - Fetch edit history
export async function GET(request: Request) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(databaseUrl)
    await ensureHistoryTable(sql)

    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let history
    if (page) {
      history = await sql`
        SELECT * FROM website_content_history
        WHERE page = ${page}
        ORDER BY changed_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      history = await sql`
        SELECT * FROM website_content_history
        ORDER BY changed_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    // Get total count
    const countResult = page
      ? await sql`SELECT COUNT(*) as total FROM website_content_history WHERE page = ${page}`
      : await sql`SELECT COUNT(*) as total FROM website_content_history`

    return NextResponse.json({
      history,
      total: parseInt(countResult[0].total),
      limit,
      offset
    })
  } catch (error) {
    console.error('Error fetching content history:', error)
    return NextResponse.json({ error: 'Failed to fetch content history' }, { status: 500 })
  }
}

// POST - Rollback to a previous version
export async function POST(request: Request) {
  try {
    const databaseUrl = process.env.DATABASE_URL
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is not set')
    }

    const sql = neon(databaseUrl)
    await ensureHistoryTable(sql)

    const body = await request.json()
    const { historyId } = body

    if (!historyId) {
      return NextResponse.json({ error: 'historyId is required' }, { status: 400 })
    }

    // Get the history entry
    const historyEntry = await sql`
      SELECT * FROM website_content_history WHERE id = ${historyId}
    `

    if (historyEntry.length === 0) {
      return NextResponse.json({ error: 'History entry not found' }, { status: 404 })
    }

    const entry = historyEntry[0]

    // Get current value before rollback
    const currentContent = await sql`
      SELECT content_value FROM website_content
      WHERE page = ${entry.page} AND section = ${entry.section} AND content_key = ${entry.content_key}
    `
    const currentValue = currentContent.length > 0 ? currentContent[0].content_value : null

    // Rollback to the old value
    const result = await sql`
      UPDATE website_content
      SET content_value = ${entry.old_value},
          updated_at = CURRENT_TIMESTAMP,
          updated_by = 'admin (rollback)'
      WHERE page = ${entry.page} AND section = ${entry.section} AND content_key = ${entry.content_key}
      RETURNING *
    `

    // Log the rollback in history
    await sql`
      INSERT INTO website_content_history (content_id, page, section, content_key, old_value, new_value, changed_by, action)
      VALUES (
        ${result[0]?.id || null},
        ${entry.page},
        ${entry.section},
        ${entry.content_key},
        ${currentValue},
        ${entry.old_value},
        'admin',
        'rollback'
      )
    `

    // Clear cache and revalidate
    clearContentCache()
    revalidatePath('/', 'layout')
    revalidatePath('/services', 'layout')
    revalidatePath('/team', 'layout')

    return NextResponse.json({
      success: true,
      message: `Rolled back ${entry.page}.${entry.section}.${entry.content_key}`,
      content: result[0]
    })
  } catch (error) {
    console.error('Error rolling back content:', error)
    return NextResponse.json({ error: 'Failed to rollback content' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function GET(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = neon(process.env.DATABASE_URL!)
    
    // Check if config table exists, if not create it
    await sql`
      CREATE TABLE IF NOT EXISTS outrank_config (
        id SERIAL PRIMARY KEY,
        webhook_secret TEXT,
        auto_publish BOOLEAN DEFAULT true,
        last_sync TIMESTAMP WITH TIME ZONE,
        total_synced INTEGER DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Get or create config
    let config = await sql`SELECT * FROM outrank_config LIMIT 1`
    
    if (config.length === 0) {
      // Create default config
      config = await sql`
        INSERT INTO outrank_config (webhook_secret, auto_publish) 
        VALUES ('', true) 
        RETURNING *
      `
    }
    
    const configData = config[0]
    
    // Check connection status
    const hasSecret = !!process.env.OUTRANK_WEBHOOK_SECRET || !!configData.webhook_secret
    const syncStatus = hasSecret ? 'connected' : 'disconnected'
    
    return NextResponse.json({
      webhook_url: '/api/outrank-webhook',
      webhook_secret: configData.webhook_secret || process.env.OUTRANK_WEBHOOK_SECRET || '',
      last_sync: configData.last_sync,
      auto_publish: configData.auto_publish,
      sync_status: syncStatus,
      total_synced: configData.total_synced || 0
    })
  } catch (error) {
    console.error('Error fetching Outrank config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch Outrank configuration' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const sql = neon(process.env.DATABASE_URL!)
    
    // Update or create config
    await sql`
      INSERT INTO outrank_config (id, webhook_secret, auto_publish) 
      VALUES (1, ${data.webhook_secret}, ${data.auto_publish})
      ON CONFLICT (id) 
      DO UPDATE SET 
        webhook_secret = ${data.webhook_secret},
        auto_publish = ${data.auto_publish},
        updated_at = NOW()
    `
    
    // Update environment variable if needed
    if (data.webhook_secret) {
      // Note: In production, you'd want to update this in your hosting platform's env vars
      process.env.OUTRANK_WEBHOOK_SECRET = data.webhook_secret
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving Outrank config:', error)
    return NextResponse.json(
      { error: 'Failed to save Outrank configuration' },
      { status: 500 }
    )
  }
}
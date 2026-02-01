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
    
    // Create webhook_logs table
    await sql`
      CREATE TABLE IF NOT EXISTS webhook_logs (
        id SERIAL PRIMARY KEY,
        webhook_type VARCHAR(50) DEFAULT 'outrank',
        request_method VARCHAR(10),
        request_headers JSONB,
        request_body JSONB,
        response_status INTEGER,
        response_body JSONB,
        error_message TEXT,
        ip_address VARCHAR(45),
        user_agent TEXT,
        processing_time_ms INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `
    
    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC)`
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_type ON webhook_logs(webhook_type)`
    await sql`CREATE INDEX IF NOT EXISTS idx_webhook_logs_response_status ON webhook_logs(response_status)`
    
    return NextResponse.json({ 
      success: true,
      message: 'Webhook logs table created successfully'
    })
  } catch (error) {
    console.error('Error creating webhook logs table:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook logs table' },
      { status: 500 }
    )
  }
}
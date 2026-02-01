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
    
    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status') // e.g., '200', '401', '500'
    
    // Build query conditionally
    let query
    if (status) {
      query = sql`
        SELECT 
          id,
          webhook_type,
          request_method,
          request_headers,
          request_body,
          response_status,
          response_body,
          error_message,
          ip_address,
          user_agent,
          processing_time_ms,
          created_at
        FROM webhook_logs
        WHERE webhook_type = 'outrank'
        AND response_status = ${parseInt(status)}
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    } else {
      query = sql`
        SELECT 
          id,
          webhook_type,
          request_method,
          request_headers,
          request_body,
          response_status,
          response_body,
          error_message,
          ip_address,
          user_agent,
          processing_time_ms,
          created_at
        FROM webhook_logs
        WHERE webhook_type = 'outrank'
        ORDER BY created_at DESC
        LIMIT ${limit}
        OFFSET ${offset}
      `
    }
    
    const logs = await query
    
    // Get total count
    const countResult = await sql`
      SELECT COUNT(*) as total
      FROM webhook_logs
      WHERE webhook_type = 'outrank'
    `
    
    // Get status breakdown
    const statusBreakdown = await sql`
      SELECT 
        response_status,
        COUNT(*) as count
      FROM webhook_logs
      WHERE webhook_type = 'outrank'
      GROUP BY response_status
      ORDER BY response_status
    `
    
    return NextResponse.json({
      logs,
      total: parseInt(countResult[0].total),
      statusBreakdown: statusBreakdown.reduce((acc: any, item: any) => {
        acc[item.response_status] = parseInt(item.count)
        return acc
      }, {})
    })
  } catch (error) {
    console.error('Error fetching webhook logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch webhook logs' },
      { status: 500 }
    )
  }
}

// Delete old logs
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sql = neon(process.env.DATABASE_URL!)
    
    // Keep only last 1000 logs
    await sql`
      DELETE FROM webhook_logs
      WHERE webhook_type = 'outrank'
      AND id NOT IN (
        SELECT id FROM webhook_logs
        WHERE webhook_type = 'outrank'
        ORDER BY created_at DESC
        LIMIT 1000
      )
    `
    
    return NextResponse.json({ 
      success: true,
      message: 'Old logs deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting webhook logs:', error)
    return NextResponse.json(
      { error: 'Failed to delete webhook logs' },
      { status: 500 }
    )
  }
}
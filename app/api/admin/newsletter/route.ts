import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function GET(request: NextRequest) {
  try {
    // For now, skip authentication check since we're using localStorage
    // In production, you should implement proper server-side session management
    
    // Optional: Check for a custom header if you want some basic protection
    const authHeader = request.headers.get('x-admin-request')
    if (authHeader !== 'true') {
      // Allow for now, but log the request
      console.log('Newsletter API accessed without admin header')
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // Get query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all'
    const search = searchParams.get('search') || ''
    
    // Simplified query approach - always use the same query structure
    let signups
    
    try {
      // Get all signups first, then filter in memory if needed
      signups = await sql`
        SELECT 
          id,
          email,
          name,
          company,
          subscribed_at,
          status,
          source,
          ip_address,
          unsubscribed_at
        FROM newsletter_signups
        ORDER BY subscribed_at DESC
      `
      
      // Apply filters in memory if needed
      if (status !== 'all') {
        signups = signups.filter(s => s.status === status)
      }
      
      if (search) {
        const searchLower = search.toLowerCase()
        signups = signups.filter(s => 
          (s.email && s.email.toLowerCase().includes(searchLower)) ||
          (s.name && s.name.toLowerCase().includes(searchLower)) ||
          (s.company && s.company.toLowerCase().includes(searchLower))
        )
      }
    } catch (queryError) {
      console.error('Error querying newsletter signups:', queryError)
      signups = []
    }
    
    // Get statistics
    let stats
    try {
      const statsResult = await sql`
        SELECT 
          COUNT(*) FILTER (WHERE status = 'active') as active_count,
          COUNT(*) FILTER (WHERE status = 'unsubscribed') as unsubscribed_count,
          COUNT(*) as total_count,
          COUNT(*) FILTER (WHERE subscribed_at >= CURRENT_DATE - INTERVAL '7 days' AND status = 'active') as week_count,
          COUNT(*) FILTER (WHERE subscribed_at >= CURRENT_DATE - INTERVAL '30 days' AND status = 'active') as month_count
        FROM newsletter_signups
      `
      stats = statsResult[0]
    } catch (statsError) {
      console.error('Error getting newsletter stats:', statsError)
      // Provide default stats if query fails
      stats = {
        active_count: signups.filter(s => s.status === 'active').length,
        unsubscribed_count: signups.filter(s => s.status === 'unsubscribed').length,
        total_count: signups.length,
        week_count: 0,
        month_count: 0
      }
    }
    
    return NextResponse.json({
      success: true,
      signups,
      stats: stats
    })
    
  } catch (error) {
    console.error('Error fetching newsletter signups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch newsletter signups' },
      { status: 500 }
    )
  }
}

// Export newsletter list as CSV
export async function POST(request: NextRequest) {
  try {
    // For now, skip authentication check since we're using localStorage
    // In production, you should implement proper server-side session management

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // Get only active subscribers for export
    const signups = await sql`
      SELECT 
        email,
        name,
        company,
        subscribed_at
      FROM newsletter_signups
      WHERE status = 'active'
      ORDER BY subscribed_at DESC
    `
    
    // Create CSV content
    const csvHeaders = 'Email,Name,Company,Subscribed Date\n'
    const csvRows = signups.map(signup => {
      const date = new Date(signup.subscribed_at).toLocaleDateString()
      return `"${signup.email}","${signup.name || ''}","${signup.company || ''}","${date}"`
    }).join('\n')
    
    const csv = csvHeaders + csvRows
    
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv"`
      }
    })
    
  } catch (error) {
    console.error('Error exporting newsletter signups:', error)
    return NextResponse.json(
      { error: 'Failed to export newsletter signups' },
      { status: 500 }
    )
  }
}
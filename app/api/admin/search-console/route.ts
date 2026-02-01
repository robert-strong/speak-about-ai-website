import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'

// Initialize the Google Search Console API
const searchconsole = google.searchconsole('v1')

export async function GET(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('endDate') || new Date().toISOString().split('T')[0]
    const dimensions = searchParams.get('dimensions')?.split(',') || ['query']
    
    // Check if credentials are configured
    const clientEmail = process.env.GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL
    const privateKey = process.env.GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY
    const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL || 'https://speakabout.ai'
    
    if (!clientEmail || !privateKey) {
      return NextResponse.json({ 
        error: 'Google Search Console not configured',
        setup: {
          steps: [
            '1. Go to Google Cloud Console',
            '2. Create a service account',
            '3. Enable Search Console API',
            '4. Add service account email to Search Console property',
            '5. Add credentials to environment variables'
          ],
          requiredEnvVars: [
            'GOOGLE_SEARCH_CONSOLE_CLIENT_EMAIL',
            'GOOGLE_SEARCH_CONSOLE_PRIVATE_KEY',
            'GOOGLE_SEARCH_CONSOLE_SITE_URL'
          ]
        }
      }, { status: 503 })
    }
    
    // Create auth client
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: privateKey.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    })
    
    // Make the request to Search Console API
    const response = await searchconsole.searchanalytics.query({
      auth,
      siteUrl,
      requestBody: {
        startDate,
        endDate,
        dimensions,
        rowLimit: 25,
        dataState: 'final'
      }
    })
    
    // Process the data
    const data = response.data
    
    // Calculate totals
    const totals = {
      clicks: data.rows?.reduce((sum, row) => sum + (row.clicks || 0), 0) || 0,
      impressions: data.rows?.reduce((sum, row) => sum + (row.impressions || 0), 0) || 0,
      ctr: 0,
      position: 0
    }
    
    if (totals.impressions > 0) {
      totals.ctr = totals.clicks / totals.impressions
      totals.position = (data.rows?.reduce((sum, row) => sum + (row.position || 0) * (row.impressions || 0), 0) || 0) / totals.impressions
    }
    
    return NextResponse.json({
      data: data.rows || [],
      totals,
      period: { startDate, endDate },
      dimensions
    })
    
  } catch (error) {
    console.error('Error fetching Search Console data:', error)
    
    // Check if it's an auth error
    if (error instanceof Error && error.message.includes('auth')) {
      return NextResponse.json({ 
        error: 'Authentication failed. Please check your credentials.',
        details: error.message 
      }, { status: 401 })
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch Search Console data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Verify admin request
    const isAdmin = request.headers.get('x-admin-request') === 'true'
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get webhook secret
    const webhookSecret = process.env.OUTRANK_WEBHOOK_SECRET
    
    if (!webhookSecret) {
      return NextResponse.json({
        success: false,
        message: 'Webhook secret not configured. Please save your configuration first.'
      })
    }

    // Create test payload
    const testPayload = {
      event_type: 'publish_articles',
      timestamp: new Date().toISOString(),
      data: {
        articles: [{
          id: `test-${Date.now()}`,
          title: 'Test Article from Admin Panel',
          content_html: '<h1>Test Article</h1><p>This is a test article sent from the admin panel.</p>',
          content_markdown: '# Test Article\n\nThis is a test article sent from the admin panel.',
          meta_description: 'Test article for webhook verification',
          created_at: new Date().toISOString(),
          slug: `test-article-${Date.now()}`,
          tags: ['test', 'webhook-test'],
          image_url: 'https://example.com/test-image.jpg'
        }]
      }
    }

    // Send test request to our own webhook
    const webhookUrl = `${request.nextUrl.origin}/api/outrank-webhook`
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`
      },
      body: JSON.stringify(testPayload)
    })

    const result = await response.json()

    if (response.ok) {
      return NextResponse.json({
        success: true,
        message: 'Webhook test successful! Test article was received and processed.',
        details: result
      })
    } else {
      return NextResponse.json({
        success: false,
        message: `Webhook test failed: ${result.error || 'Unknown error'}`,
        status: response.status
      })
    }
  } catch (error) {
    console.error('Error testing webhook:', error)
    return NextResponse.json({
      success: false,
      message: 'Failed to test webhook',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
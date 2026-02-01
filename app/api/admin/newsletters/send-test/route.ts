import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'

// Lazy initialize Resend to avoid build-time errors
let resend: Resend | null = null
function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const adminRequest = request.headers.get('x-admin-request')
    if (!adminRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { test_email, subject, html_content, content } = body
    
    if (!test_email || !subject || !html_content) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Add test banner to the HTML
    const testHtml = `
      <div style="background: #fbbf24; color: #000; padding: 10px; text-align: center; font-weight: bold;">
        TEST EMAIL - This is a test version of the newsletter
      </div>
      ${html_content.replace('{{unsubscribe_url}}', '#').replace('{{name}}', 'Test User')}
    `
    
    const result = await getResend().emails.send({
      from: 'Speak About AI <newsletter@speakabout.ai>',
      to: test_email,
      subject: `[TEST] ${subject}`,
      html: testHtml,
      text: content || 'Test newsletter content',
    })
    
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      result
    })
    
  } catch (error) {
    console.error('Error sending test email:', error)
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
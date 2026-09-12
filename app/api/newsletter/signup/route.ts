import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { isFormHealthCheckRequest, HEALTH_CHECK_EMAIL } from '@/lib/form-health'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, company } = body

    // Validate email
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Synthetic submission from the form health monitor (lib/form-health.ts):
    // exercises the real insert and deletes its own record.
    const isHealthCheck = isFormHealthCheckRequest(request) && email.toLowerCase() === HEALTH_CHECK_EMAIL

    // Get request metadata
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || ''
    const referrer = request.headers.get('referer') || ''

    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not configured')
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const sql = neon(process.env.DATABASE_URL)

    if (isHealthCheck) {
      // Clear any leftover from an interrupted previous check, then take the real insert path
      await sql`DELETE FROM newsletter_signups WHERE email = ${HEALTH_CHECK_EMAIL}`
    }

    // Check if email already exists
    const existing = await sql`
      SELECT email, status FROM newsletter_signups
      WHERE email = ${email.toLowerCase()}
    `

    if (existing.length > 0) {
      if (existing[0].status === 'active') {
        return NextResponse.json(
          { success: false, error: 'This email is already subscribed' },
          { status: 409 }
        )
      } else {
        // Reactivate subscription
        await sql`
          UPDATE newsletter_signups 
          SET 
            status = 'active',
            subscribed_at = CURRENT_TIMESTAMP,
            unsubscribed_at = NULL,
            name = COALESCE(${name}, name),
            company = COALESCE(${company}, company)
          WHERE email = ${email.toLowerCase()}
        `
        
        return NextResponse.json({
          success: true,
          message: 'Welcome back! Your subscription has been reactivated.'
        })
      }
    }

    // Insert new subscription
    await sql`
      INSERT INTO newsletter_signups (
        email, name, company, ip_address, user_agent, referrer, source
      ) VALUES (
        ${email.toLowerCase()},
        ${name || null},
        ${company || null},
        ${ip.toString()},
        ${userAgent},
        ${referrer},
        'services-page'
      )
    `

    if (isHealthCheck) {
      await sql`DELETE FROM newsletter_signups WHERE email = ${HEALTH_CHECK_EMAIL}`
      return NextResponse.json({ success: true, healthCheck: true })
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you for subscribing! We\'ll keep you updated on our upcoming events.'
    })

  } catch (error) {
    console.error('Newsletter signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process subscription' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Newsletter signup endpoint' })
}
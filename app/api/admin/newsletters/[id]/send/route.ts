import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { Resend } from 'resend'

// Lazy initialize Resend to avoid build-time errors
let resend: Resend | null = null
function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin authentication
    const adminRequest = request.headers.get('x-admin-request')
    if (!adminRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const sql = neon(process.env.DATABASE_URL!)
    
    // Fetch the newsletter
    const newsletterResult = await sql`
      SELECT * FROM newsletters WHERE id = ${id}
    `
    
    if (newsletterResult.length === 0) {
      return NextResponse.json({ error: 'Newsletter not found' }, { status: 404 })
    }
    
    const newsletter = newsletterResult[0]
    
    // Check if already sent
    if (newsletter.status === 'sent') {
      return NextResponse.json(
        { error: 'Newsletter has already been sent' },
        { status: 400 }
      )
    }
    
    // Get recipients - either from body or fetch all active subscribers
    let recipients = body.recipient_list || []
    
    if (recipients.length === 0) {
      // Fetch all active newsletter subscribers
      const subscribers = await sql`
        SELECT email, name FROM newsletter_signups 
        WHERE status = 'active'
      `
      recipients = subscribers.map((s: any) => ({
        email: s.email,
        name: s.name
      }))
    }
    
    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found' },
        { status: 400 }
      )
    }
    
    // Update newsletter status to sending
    await sql`
      UPDATE newsletters 
      SET status = 'sending', updated_at = NOW()
      WHERE id = ${id}
    `
    
    // Send emails in batches to avoid rate limits
    const batchSize = 10
    let successCount = 0
    let failCount = 0
    const errors: any[] = []
    
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize)
      
      // Send emails in parallel within each batch
      const batchPromises = batch.map(async (recipient: any) => {
        try {
          // Personalize the HTML content with unsubscribe link
          const personalizedHtml = newsletter.html_content.replace(
            '{{unsubscribe_url}}',
            `https://speakabout.ai/unsubscribe?email=${encodeURIComponent(recipient.email)}`
          ).replace(
            '{{name}}',
            recipient.name || 'Subscriber'
          )
          
          await getResend().emails.send({
            from: 'Speak About AI <newsletter@speakabout.ai>',
            to: recipient.email,
            subject: newsletter.subject,
            html: personalizedHtml,
            text: newsletter.content, // Plain text fallback
            headers: {
              'X-Newsletter-ID': id,
              'List-Unsubscribe': `<https://speakabout.ai/unsubscribe?email=${encodeURIComponent(recipient.email)}>`,
            },
          })
          
          // Record successful send
          await sql`
            INSERT INTO newsletter_sends (
              newsletter_id,
              recipient_email,
              recipient_name,
              status,
              sent_at
            ) VALUES (
              ${id},
              ${recipient.email},
              ${recipient.name || null},
              'sent',
              NOW()
            )
            ON CONFLICT (newsletter_id, recipient_email) 
            DO UPDATE SET 
              status = 'sent',
              sent_at = NOW()
          `
          
          successCount++
        } catch (error) {
          console.error(`Failed to send to ${recipient.email}:`, error)
          failCount++
          errors.push({
            email: recipient.email,
            error: error instanceof Error ? error.message : 'Unknown error'
          })
          
          // Record failed send
          await sql`
            INSERT INTO newsletter_sends (
              newsletter_id,
              recipient_email,
              recipient_name,
              status,
              error_message
            ) VALUES (
              ${id},
              ${recipient.email},
              ${recipient.name || null},
              'failed',
              ${error instanceof Error ? error.message : 'Unknown error'}
            )
            ON CONFLICT (newsletter_id, recipient_email) 
            DO UPDATE SET 
              status = 'failed',
              error_message = ${error instanceof Error ? error.message : 'Unknown error'}
          `
        }
      })
      
      await Promise.all(batchPromises)
      
      // Add a small delay between batches to respect rate limits
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
    
    // Update newsletter status and stats
    await sql`
      UPDATE newsletters 
      SET 
        status = 'sent',
        sent_at = NOW(),
        recipient_count = ${successCount},
        updated_at = NOW()
      WHERE id = ${id}
    `
    
    return NextResponse.json({
      success: true,
      sent: successCount,
      failed: failCount,
      errors: errors.slice(0, 10), // Return first 10 errors
      message: `Newsletter sent to ${successCount} recipients`
    })
    
  } catch (error) {
    console.error('Error sending newsletter:', error)
    
    // Update status back to draft if sending failed
    try {
      const { id } = await params
      const sql = neon(process.env.DATABASE_URL!)
      await sql`
        UPDATE newsletters 
        SET status = 'draft', updated_at = NOW()
        WHERE id = ${id}
      `
    } catch (updateError) {
      console.error('Error updating status:', updateError)
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to send newsletter',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
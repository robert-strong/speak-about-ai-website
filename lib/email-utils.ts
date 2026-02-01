import { neon } from '@neondatabase/serverless'
import { Deal, DealFormData } from './deals-utils'

// Initialize Neon client
let sql: any = null
try {
  if (process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL)
  }
} catch (error) {
  console.error('Failed to initialize Neon client for email:', error)
}

export interface EmailNotification {
  id: number
  dealId?: number
  recipientEmail: string
  emailType: string
  subject: string
  sentAt: string
  status: 'sent' | 'failed' | 'pending'
  errorMessage?: string
}

/**
 * Send email notification for new deal
 */
export async function sendNewDealNotification(deal: Deal, formData: DealFormData): Promise<boolean> {
  const recipients = ['human@speakabout.ai', 'noah@speakabout.ai']
  const subject = `New Deal Submission: ${deal.clientName} - ${deal.organizationName || 'Organization TBD'}`
  
  const emailBody = generateNewDealEmailBody(deal, formData)
  
  let allSent = true
  
  for (const recipient of recipients) {
    try {
      const sent = await sendEmail(recipient, subject, emailBody)
      await logEmailNotification(deal.id, recipient, 'new_deal', subject, sent ? 'sent' : 'failed')
      if (!sent) allSent = false
    } catch (error) {
      console.error(`Failed to send email to ${recipient}:`, error)
      await logEmailNotification(deal.id, recipient, 'new_deal', subject, 'failed', error instanceof Error ? error.message : 'Unknown error')
      allSent = false
    }
  }
  
  return allSent
}

/**
 * Generate email body for new deal notification
 */
function generateNewDealEmailBody(deal: Deal, formData: DealFormData): string {
  const wishlistSpeakers = formData.wishlistSpeakers || []
  const speakersList = wishlistSpeakers.length > 0 
    ? wishlistSpeakers.map(s => `• ${s.name}`).join('\n')
    : 'No specific speakers selected'

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>New Deal Submission</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .field { margin-bottom: 15px; }
        .field-label { font-weight: bold; color: #2563eb; }
        .field-value { margin-top: 5px; }
        .speakers-list { background-color: #f8fafc; padding: 15px; border-radius: 5px; margin-top: 10px; }
        .priority { padding: 5px 10px; border-radius: 3px; font-weight: bold; color: white; }
        .priority-urgent { background-color: #dc2626; }
        .priority-high { background-color: #ea580c; }
        .priority-medium { background-color: #2563eb; }
        .priority-low { background-color: #059669; }
        .footer { background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎯 New Deal Submission</h1>
        <p>Priority: <span class="priority priority-${deal.priority}">${deal.priority.toUpperCase()}</span></p>
    </div>
    
    <div class="content">
        <h2>Contact Information</h2>
        
        <div class="field">
            <div class="field-label">Name:</div>
            <div class="field-value">${deal.clientName}</div>
        </div>
        
        <div class="field">
            <div class="field-label">Email:</div>
            <div class="field-value"><a href="mailto:${deal.clientEmail}">${deal.clientEmail}</a></div>
        </div>
        
        ${deal.phone ? `
        <div class="field">
            <div class="field-label">Phone:</div>
            <div class="field-value"><a href="tel:${deal.phone}">${deal.phone}</a></div>
        </div>
        ` : ''}
        
        ${deal.organizationName ? `
        <div class="field">
            <div class="field-label">Organization:</div>
            <div class="field-value">${deal.organizationName}</div>
        </div>
        ` : ''}
        
        <h2>Event Details</h2>
        
        ${deal.eventDate ? `
        <div class="field">
            <div class="field-label">Event Date:</div>
            <div class="field-value">${new Date(deal.eventDate).toLocaleDateString()}</div>
        </div>
        ` : ''}
        
        ${deal.eventLocation ? `
        <div class="field">
            <div class="field-label">Event Location:</div>
            <div class="field-value">${deal.eventLocation}</div>
        </div>
        ` : ''}
        
        ${deal.eventBudget ? `
        <div class="field">
            <div class="field-label">Budget Range:</div>
            <div class="field-value">${deal.eventBudget}</div>
        </div>
        ` : ''}
        
        ${deal.specificSpeaker ? `
        <div class="field">
            <div class="field-label">Specific Speaker Requested:</div>
            <div class="field-value">${deal.specificSpeaker}</div>
        </div>
        ` : ''}
        
        <h2>Speaker Wishlist</h2>
        <div class="speakers-list">
            ${speakersList === 'No specific speakers selected' ? 
              '<em>No specific speakers selected</em>' : 
              speakersList.split('\n').map(line => `<div>${line}</div>`).join('')
            }
        </div>
        
        ${deal.additionalInfo ? `
        <h2>Additional Information</h2>
        <div class="field">
            <div class="field-value" style="background-color: #f8fafc; padding: 15px; border-radius: 5px;">
                ${deal.additionalInfo.replace(/\n/g, '<br>')}
            </div>
        </div>
        ` : ''}
        
        <h2>Deal Summary</h2>
        <div class="field">
            <div class="field-label">Estimated Value:</div>
            <div class="field-value">$${deal.dealValue?.toLocaleString() || 'N/A'}</div>
        </div>
        
        <div class="field">
            <div class="field-label">Source:</div>
            <div class="field-value">${deal.source}</div>
        </div>
        
        <div class="field">
            <div class="field-label">Deal ID:</div>
            <div class="field-value">#${deal.id}</div>
        </div>
        
        <div class="field">
            <div class="field-label">Submitted:</div>
            <div class="field-value">${new Date(deal.createdAt).toLocaleString()}</div>
        </div>
    </div>
    
    <div class="footer">
        <p>This deal has been automatically added to your admin panel.</p>
        <p><a href="https://speakaboutai.com/admin/manage">View in Admin Panel</a></p>
    </div>
</body>
</html>
  `.trim()
}

/**
 * Send email using your own email service
 */
async function sendEmail(to: string, subject: string, htmlBody: string): Promise<boolean> {
  try {
    // Option 1: Use a simple email service like Resend (easiest)
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'notifications@speakaboutai.com', // Use your domain
          to: [to],
          subject: subject,
          html: htmlBody,
        }),
      })
      
      if (response.ok) {
        console.log(`✅ Email sent successfully to ${to}`)
        return true
      } else {
        const error = await response.text()
        console.error('Resend API error:', error)
        return false
      }
    }
    
    // Option 2: Use Gmail SMTP (if you want to use your Gmail)
    if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
      const nodemailer = require('nodemailer')
      
      const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD, // Gmail App Password, not regular password
        },
      })
      
      await transporter.sendMail({
        from: process.env.GMAIL_USER,
        to: to,
        subject: subject,
        html: htmlBody,
      })
      
      console.log(`✅ Email sent via Gmail to ${to}`)
      return true
    }
    
    // Fallback: Log to console
    console.log('=== EMAIL NOTIFICATION (No email service configured) ===')
    console.log(`To: ${to}`)
    console.log(`Subject: ${subject}`)
    console.log('Add RESEND_API_KEY or GMAIL_USER/GMAIL_APP_PASSWORD to .env to send real emails')
    console.log('=== END EMAIL ===')
    
    return true
    
  } catch (error) {
    console.error('Email sending error:', error)
    return false
  }
}

/**
 * Log email notification in database
 */
async function logEmailNotification(
  dealId: number,
  recipientEmail: string,
  emailType: string,
  subject: string,
  status: 'sent' | 'failed' | 'pending',
  errorMessage?: string
): Promise<void> {
  if (!sql) return

  try {
    await sql`
      INSERT INTO email_notifications (
        deal_id, recipient_email, email_type, subject, status, error_message
      ) VALUES (
        ${dealId}, ${recipientEmail}, ${emailType}, ${subject}, ${status}, ${errorMessage || null}
      )
    `
  } catch (error) {
    console.error('Failed to log email notification:', error)
  }
}

/**
 * Get email notifications for a deal
 */
export async function getEmailNotifications(dealId: number): Promise<EmailNotification[]> {
  if (!sql) return []

  try {
    const result = await sql`
      SELECT * FROM email_notifications 
      WHERE deal_id = ${dealId}
      ORDER BY sent_at DESC
    `

    return result.map((row: any) => ({
      id: row.id,
      dealId: row.deal_id,
      recipientEmail: row.recipient_email,
      emailType: row.email_type,
      subject: row.subject,
      sentAt: row.sent_at,
      status: row.status,
      errorMessage: row.error_message
    }))
  } catch (error) {
    console.error('Failed to get email notifications:', error)
    return []
  }
}
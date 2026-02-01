// Unified email service using Resend for all email functionality
import { Deal, DealFormData } from './deals-utils'
import { neon } from '@neondatabase/serverless'

// Initialize database client
let sql: any = null
try {
  if (process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL)
  }
} catch (error) {
  console.error('Failed to initialize database for email logging:', error)
}

// Initialize Resend client
let resend: any = null
if (typeof window === 'undefined') { // Only on server side
  try {
    const { Resend } = require('resend')
    resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
  } catch (error) {
    console.warn('Resend not installed or configured. Email sending disabled.')
  }
}

/**
 * Log email notification to database
 */
async function logEmailNotification(data: {
  recipient: string
  subject: string
  template: string
  status: 'sent' | 'failed' | 'pending'
  sentAt: Date | null
  error: string | null
}): Promise<void> {
  if (!sql) return
  
  try {
    await sql`
      INSERT INTO email_notifications (
        recipient_email, subject, email_type, status, sent_at, error_message
      ) VALUES (
        ${data.recipient}, ${data.subject}, ${data.template}, 
        ${data.status}, ${data.sentAt}, ${data.error}
      )
    `
  } catch (error) {
    console.error('Failed to log email notification:', error)
  }
}

// Email configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'hello@speakabout.ai'
const ADMIN_EMAILS = ['human@speakabout.ai', 'noah@speakabout.ai']
const TEST_MODE = process.env.EMAIL_TEST_MODE === 'true' // Set to prevent actual sending

interface EmailOptions {
  to: string | string[]
  subject: string
  html: string
  text: string
  from?: string
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

/**
 * Send email using Resend with fallback to logging
 */
export async function sendEmail(options: EmailOptions): Promise<boolean> {
  const { to, subject, html, text, from = FROM_EMAIL, replyTo, attachments } = options
  
  // Log the email attempt
  const recipients = Array.isArray(to) ? to : [to]
  
  for (const recipient of recipients) {
    await logEmailNotification({
      recipient,
      subject,
      template: 'custom',
      status: 'pending',
      sentAt: null,
      error: null
    })
  }

  // Test mode - don't actually send
  if (TEST_MODE) {
    console.log('📧 [TEST MODE] Email would be sent:')
    console.log('  To:', to)
    console.log('  Subject:', subject)
    console.log('  From:', from)
    
    for (const recipient of recipients) {
      await logEmailNotification({
        recipient,
        subject,
        template: 'custom',
        status: 'sent',
        sentAt: new Date(),
        error: null
      })
    }
    return true
  }

  // Check if Resend is configured
  if (!resend) {
    console.warn('Resend not configured - email not sent')
    console.log('Would have sent email:')
    console.log('  To:', to)
    console.log('  Subject:', subject)
    
    for (const recipient of recipients) {
      await logEmailNotification({
        recipient,
        subject,
        template: 'custom',
        status: 'failed',
        sentAt: null,
        error: 'Resend not configured'
      })
    }
    return false
  }

  try {
    // Send via Resend
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text,
      reply_to: replyTo,
      attachments
    })

    console.log('✅ Email sent successfully:', result)
    
    // Log success
    for (const recipient of recipients) {
      await logEmailNotification({
        recipient,
        subject,
        template: 'custom',
        status: 'sent',
        sentAt: new Date(),
        error: null
      })
    }
    
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    
    // Log failure
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    for (const recipient of recipients) {
      await logEmailNotification({
        recipient,
        subject,
        template: 'custom',
        status: 'failed',
        sentAt: null,
        error: errorMessage
      })
    }
    
    return false
  }
}

/**
 * Send proposal email to client
 */
export async function sendProposalEmail(proposal: any): Promise<boolean> {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; color: white; text-align: center; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Your Speaker Proposal is Ready</h1>
          </div>
          
          <div class="content">
            <p>Dear ${proposal.clientName},</p>
            
            <p>Thank you for your interest in booking a speaker through Speak About AI. We've prepared a customized proposal for your event.</p>
            
            <h3>Event Details:</h3>
            <ul>
              <li><strong>Event:</strong> ${proposal.eventTitle || 'AI Keynote Speaking Engagement'}</li>
              <li><strong>Date:</strong> ${proposal.eventDate ? new Date(proposal.eventDate).toLocaleDateString() : 'TBD'}</li>
              <li><strong>Location:</strong> ${proposal.eventLocation || 'TBD'}</li>
              <li><strong>Speaker:</strong> ${proposal.speakerName}</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/proposal/${proposal.token}" class="button">
                View Your Proposal →
              </a>
            </div>
            
            <p>This proposal is valid for 30 days. Please review it at your convenience and let us know if you have any questions.</p>
            
            <p>Best regards,<br>
            The Speak About AI Team</p>
          </div>
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} Speak About AI. All rights reserved.</p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Dear ${proposal.clientName},

Thank you for your interest in booking a speaker through Speak About AI. We've prepared a customized proposal for your event.

Event Details:
- Event: ${proposal.eventTitle || 'AI Keynote Speaking Engagement'}
- Date: ${proposal.eventDate ? new Date(proposal.eventDate).toLocaleDateString() : 'TBD'}
- Location: ${proposal.eventLocation || 'TBD'}
- Speaker: ${proposal.speakerName}

View Your Proposal: ${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/proposal/${proposal.token}

This proposal is valid for 30 days. Please review it at your convenience and let us know if you have any questions.

Best regards,
The Speak About AI Team
  `.trim()

  return sendEmail({
    to: proposal.clientEmail,
    subject: `Your Speaker Proposal - ${proposal.speakerName}`,
    html,
    text
  })
}

/**
 * Send proposal acceptance notification
 */
export async function sendProposalAcceptedEmail(proposal: any): Promise<boolean> {
  const adminHtml = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>🎉 Proposal Accepted!</h2>
          <p><strong>${proposal.clientName}</strong> has accepted the proposal for:</p>
          <ul>
            <li>Speaker: ${proposal.speakerName}</li>
            <li>Event: ${proposal.eventTitle}</li>
            <li>Date: ${proposal.eventDate ? new Date(proposal.eventDate).toLocaleDateString() : 'TBD'}</li>
            <li>Fee: $${proposal.speakerFee?.toLocaleString() || '0'}</li>
          </ul>
          <p>Next step: Send the contract for signing.</p>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/admin/proposals">View in Admin →</a>
        </div>
      </body>
    </html>
  `

  const clientHtml = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Thank You for Accepting Our Proposal!</h2>
          <p>Dear ${proposal.clientName},</p>
          <p>We're thrilled that you've accepted our proposal for ${proposal.speakerName} to speak at your event.</p>
          <p>We'll be sending you the contract for review and signature shortly.</p>
          <p>If you have any questions in the meantime, please don't hesitate to reach out.</p>
          <p>Best regards,<br>The Speak About AI Team</p>
        </div>
      </body>
    </html>
  `

  // Send to admins
  await sendEmail({
    to: ADMIN_EMAILS,
    subject: `✅ Proposal Accepted: ${proposal.clientName} - ${proposal.speakerName}`,
    html: adminHtml,
    text: adminHtml.replace(/<[^>]*>/g, '')
  })

  // Send to client
  return sendEmail({
    to: proposal.clientEmail,
    subject: 'Proposal Accepted - Next Steps',
    html: clientHtml,
    text: clientHtml.replace(/<[^>]*>/g, '')
  })
}

/**
 * Send proposal rejection notification
 */
export async function sendProposalRejectedEmail(proposal: any, reason?: string): Promise<boolean> {
  const adminHtml = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>❌ Proposal Declined</h2>
          <p><strong>${proposal.clientName}</strong> has declined the proposal for:</p>
          <ul>
            <li>Speaker: ${proposal.speakerName}</li>
            <li>Event: ${proposal.eventTitle}</li>
          </ul>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/admin/proposals">View in Admin →</a>
        </div>
      </body>
    </html>
  `

  return sendEmail({
    to: ADMIN_EMAILS,
    subject: `❌ Proposal Declined: ${proposal.clientName} - ${proposal.speakerName}`,
    html: adminHtml,
    text: adminHtml.replace(/<[^>]*>/g, '')
  })
}

/**
 * Send contract signing request
 */
export async function sendContractEmail(contract: any, recipientType: 'client' | 'speaker'): Promise<boolean> {
  const isClient = recipientType === 'client'
  const recipientName = isClient ? contract.clientName : contract.speakerName
  const recipientEmail = isClient ? contract.clientEmail : contract.speakerEmail
  const signingUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/contracts/sign/${contract.token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .button { display: inline-block; padding: 12px 30px; background: #10b981; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Contract Ready for Signature</h2>
          </div>
          
          <p>Dear ${recipientName},</p>
          
          <p>The speaking engagement contract is ready for your review and signature.</p>
          
          <h3>Contract Details:</h3>
          <ul>
            <li><strong>Event:</strong> ${contract.eventTitle}</li>
            <li><strong>Date:</strong> ${contract.eventDate ? new Date(contract.eventDate).toLocaleDateString() : 'TBD'}</li>
            <li><strong>Location:</strong> ${contract.eventLocation || 'TBD'}</li>
            ${isClient ? `<li><strong>Speaker:</strong> ${contract.speakerName}</li>` : `<li><strong>Client:</strong> ${contract.clientName}</li>`}
            <li><strong>Speaking Fee:</strong> $${contract.speakerFee?.toLocaleString() || '0'}</li>
          </ul>
          
          <div style="text-align: center;">
            <a href="${signingUrl}" class="button">Review & Sign Contract →</a>
          </div>
          
          <p>Please review the contract carefully. If you have any questions, feel free to reach out.</p>
          
          <p>Best regards,<br>
          The Speak About AI Team</p>
        </div>
      </body>
    </html>
  `

  const text = `
Dear ${recipientName},

The speaking engagement contract is ready for your review and signature.

Contract Details:
- Event: ${contract.eventTitle}
- Date: ${contract.eventDate ? new Date(contract.eventDate).toLocaleDateString() : 'TBD'}
- Location: ${contract.eventLocation || 'TBD'}
${isClient ? `- Speaker: ${contract.speakerName}` : `- Client: ${contract.clientName}`}
- Speaking Fee: $${contract.speakerFee?.toLocaleString() || '0'}

Review & Sign Contract: ${signingUrl}

Please review the contract carefully. If you have any questions, feel free to reach out.

Best regards,
The Speak About AI Team
  `.trim()

  return sendEmail({
    to: recipientEmail,
    subject: `Contract Ready for Signature - ${contract.eventTitle}`,
    html,
    text
  })
}

/**
 * Send contract completion notification
 */
export async function sendContractCompletedEmail(contract: any): Promise<boolean> {
  const adminHtml = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>✅ Contract Fully Executed!</h2>
          <p>Both parties have signed the contract for:</p>
          <ul>
            <li>Client: ${contract.clientName}</li>
            <li>Speaker: ${contract.speakerName}</li>
            <li>Event: ${contract.eventTitle}</li>
            <li>Date: ${contract.eventDate ? new Date(contract.eventDate).toLocaleDateString() : 'TBD'}</li>
            <li>Fee: $${contract.speakerFee?.toLocaleString() || '0'}</li>
          </ul>
          <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/admin/contracts">View in Admin →</a>
        </div>
      </body>
    </html>
  `

  // Notify admins
  await sendEmail({
    to: ADMIN_EMAILS,
    subject: `✅ Contract Signed: ${contract.clientName} & ${contract.speakerName}`,
    html: adminHtml,
    text: adminHtml.replace(/<[^>]*>/g, '')
  })

  // Send confirmation to both parties
  const confirmationHtml = `
    <!DOCTYPE html>
    <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Contract Fully Executed</h2>
          <p>All parties have signed the speaking engagement contract.</p>
          <ul>
            <li>Event: ${contract.eventTitle}</li>
            <li>Date: ${contract.eventDate ? new Date(contract.eventDate).toLocaleDateString() : 'TBD'}</li>
            <li>Location: ${contract.eventLocation || 'TBD'}</li>
          </ul>
          <p>A copy of the fully executed contract will be sent separately.</p>
          <p>Thank you!</p>
        </div>
      </body>
    </html>
  `

  await sendEmail({
    to: [contract.clientEmail, contract.speakerEmail],
    subject: 'Contract Fully Executed - ' + contract.eventTitle,
    html: confirmationHtml,
    text: confirmationHtml.replace(/<[^>]*>/g, '')
  })

  return true
}

/**
 * Send client portal invitation
 */
export async function sendClientPortalInvite(invitation: any): Promise<boolean> {
  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/portal/client/accept-invite?token=${invitation.token}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; color: white; text-align: center; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0;">Welcome to Your Project Portal</h1>
          </div>
          
          <div class="content">
            <p>Dear ${invitation.clientName},</p>
            
            <p>You've been invited to access your project portal where you can:</p>
            
            <ul>
              <li>View project details and timeline</li>
              <li>Access contracts and documents</li>
              <li>Communicate with our team</li>
              <li>Track project progress</li>
            </ul>
            
            <div style="text-align: center;">
              <a href="${inviteUrl}" class="button">Access Your Portal →</a>
            </div>
            
            <p>This invitation will expire in 7 days for security purposes.</p>
            
            <p>If you have any questions, please don't hesitate to reach out.</p>
            
            <p>Best regards,<br>
            The Speak About AI Team</p>
          </div>
        </div>
      </body>
    </html>
  `

  const text = `
Dear ${invitation.clientName},

You've been invited to access your project portal where you can:
- View project details and timeline
- Access contracts and documents
- Communicate with our team
- Track project progress

Access Your Portal: ${inviteUrl}

This invitation will expire in 7 days for security purposes.

If you have any questions, please don't hesitate to reach out.

Best regards,
The Speak About AI Team
  `.trim()

  return sendEmail({
    to: invitation.email,
    subject: 'Invitation to Your Project Portal - Speak About AI',
    html,
    text
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/portal/speaker-reset-password?token=${resetToken}`

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          .button { display: inline-block; padding: 12px 30px; background: #ef4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>Password Reset Request</h2>
          </div>
          
          <p>You've requested to reset your password for Speak About AI.</p>
          
          <p>Click the link below to create a new password:</p>
          
          <div style="text-align: center;">
            <a href="${resetUrl}" class="button">Reset Password →</a>
          </div>
          
          <p>This link will expire in 1 hour for security purposes.</p>
          
          <p>If you didn't request this password reset, please ignore this email.</p>
          
          <p>Best regards,<br>
          The Speak About AI Team</p>
        </div>
      </body>
    </html>
  `

  const text = `
Password Reset Request

You've requested to reset your password for Speak About AI.

Click the link below to create a new password:
${resetUrl}

This link will expire in 1 hour for security purposes.

If you didn't request this password reset, please ignore this email.

Best regards,
The Speak About AI Team
  `.trim()

  return sendEmail({
    to: email,
    subject: 'Password Reset Request - Speak About AI',
    html,
    text
  })
}

/**
 * Export functions from email-service-new.ts for backward compatibility
 */
export { sendNewInquiryEmail, generateAdminEmailHtml, generateAdminEmailText, generateClientConfirmationHtml, generateClientConfirmationText } from './email-service-new'
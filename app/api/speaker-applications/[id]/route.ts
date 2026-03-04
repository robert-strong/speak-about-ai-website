import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"
import crypto from 'crypto'

const sql = neon(process.env.DATABASE_URL!)

// Get single application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id } = await params
    const applicationId = parseInt(id)

    const [application] = await sql`
      SELECT * FROM speaker_applications
      WHERE id = ${applicationId}
    `

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(application)

  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    )
  }
}

// Update application (status, notes, etc.)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id } = await params
    const applicationId = parseInt(id)
    const body = await request.json()

    const { action, admin_notes, rejection_reason } = body

    // Handle different actions
    switch (action) {
      case 'review':
        await sql`
          UPDATE speaker_applications
          SET
            status = 'under_review',
            reviewed_at = CURRENT_TIMESTAMP,
            reviewed_by = 'admin',
            admin_notes = ${admin_notes || null}
          WHERE id = ${applicationId}
        `
        break

      case 'approve': {
        // Generate invitation token on approval
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7)

        const [approvedApp] = await sql`
          UPDATE speaker_applications
          SET
            status = 'approved',
            reviewed_at = CURRENT_TIMESTAMP,
            reviewed_by = 'admin',
            admin_notes = ${admin_notes || null},
            invitation_token = ${token},
            invitation_sent_at = CURRENT_TIMESTAMP,
            invitation_expires_at = ${expiresAt.toISOString()}
          WHERE id = ${applicationId}
          RETURNING *
        `

        // Send approved letter via Gmail SMTP
        try {
          await sendApplicationEmail(approvedApp, 'application_approved')
        } catch (emailError) {
          console.error('Failed to send approval email:', emailError)
          return NextResponse.json({
            success: true,
            message: "Application approved but email sending failed. You can resend it later.",
            emailError: emailError instanceof Error ? emailError.message : "Unknown email error"
          })
        }

        return NextResponse.json({
          success: true,
          message: "Application approved and notification sent"
        })
      }

      case 'reject': {
        const [rejectedApp] = await sql`
          UPDATE speaker_applications
          SET
            status = 'rejected',
            reviewed_at = CURRENT_TIMESTAMP,
            reviewed_by = 'admin',
            rejection_reason = ${rejection_reason || 'Does not meet current requirements'},
            admin_notes = ${admin_notes || null}
          WHERE id = ${applicationId}
          RETURNING *
        `

        // Send rejection letter via Gmail SMTP
        try {
          await sendApplicationEmail(rejectedApp, 'application_rejected')
        } catch (emailError) {
          console.error('Failed to send rejection email:', emailError)
          return NextResponse.json({
            success: true,
            message: "Application rejected but email sending failed. You can resend it later.",
            emailError: emailError instanceof Error ? emailError.message : "Unknown email error"
          })
        }

        return NextResponse.json({
          success: true,
          message: "Application rejected and notification sent"
        })
      }

      case 'invite': {
        // Generate unique invitation token
        const inviteToken = crypto.randomBytes(32).toString('hex')
        const inviteExpiresAt = new Date()
        inviteExpiresAt.setDate(inviteExpiresAt.getDate() + 7)

        const [updatedApp] = await sql`
          UPDATE speaker_applications
          SET
            status = 'invited',
            invitation_token = ${inviteToken},
            invitation_sent_at = CURRENT_TIMESTAMP,
            invitation_expires_at = ${inviteExpiresAt.toISOString()},
            admin_notes = ${admin_notes || null}
          WHERE id = ${applicationId}
          RETURNING *
        `

        try {
          await sendApplicationEmail(updatedApp, 'application_approved')
        } catch (emailError) {
          console.error('Failed to send invitation email:', emailError)
          return NextResponse.json({
            success: true,
            message: "Invitation saved but email sending failed. You can resend it later.",
            emailError: emailError instanceof Error ? emailError.message : "Unknown email error"
          })
        }

        return NextResponse.json({
          success: true,
          message: "Invitation sent successfully"
        })
      }

      case 'resend_invite': {
        const [app] = await sql`
          SELECT * FROM speaker_applications WHERE id = ${applicationId}
        `

        if (!app) {
          return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        if (app.status !== 'approved' && app.status !== 'invited') {
          return NextResponse.json({ error: "Can only resend invitations for approved or invited applications" }, { status: 400 })
        }

        // Generate a new token
        const newToken = crypto.randomBytes(32).toString('hex')
        const newExpiresAt = new Date()
        newExpiresAt.setDate(newExpiresAt.getDate() + 7)

        const [refreshedApp] = await sql`
          UPDATE speaker_applications
          SET
            invitation_token = ${newToken},
            invitation_sent_at = CURRENT_TIMESTAMP,
            invitation_expires_at = ${newExpiresAt.toISOString()}
          WHERE id = ${applicationId}
          RETURNING *
        `

        try {
          await sendApplicationEmail(refreshedApp, 'application_approved')
        } catch (emailError) {
          console.error('Failed to resend invitation email:', emailError)
          return NextResponse.json({
            success: false,
            error: "Failed to send invitation email",
            details: emailError instanceof Error ? emailError.message : "Unknown email error"
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: "Invitation resent successfully"
        })
      }

      case 'resend_approved_letter': {
        const [app] = await sql`
          SELECT * FROM speaker_applications WHERE id = ${applicationId}
        `

        if (!app) {
          return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        if (app.status !== 'approved' && app.status !== 'invited') {
          return NextResponse.json({ error: "Can only resend approval letters for approved or invited applications" }, { status: 400 })
        }

        // Refresh the token
        const freshToken = crypto.randomBytes(32).toString('hex')
        const freshExpiresAt = new Date()
        freshExpiresAt.setDate(freshExpiresAt.getDate() + 7)

        const [updatedApp2] = await sql`
          UPDATE speaker_applications
          SET
            invitation_token = ${freshToken},
            invitation_sent_at = CURRENT_TIMESTAMP,
            invitation_expires_at = ${freshExpiresAt.toISOString()}
          WHERE id = ${applicationId}
          RETURNING *
        `

        try {
          await sendApplicationEmail(updatedApp2, 'application_approved')
        } catch (emailError) {
          console.error('Failed to resend approved letter:', emailError)
          return NextResponse.json({
            success: false,
            error: "Failed to resend approved letter",
            details: emailError instanceof Error ? emailError.message : "Unknown email error"
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: "Approved letter resent successfully"
        })
      }

      case 'resend_rejected_letter': {
        const [app] = await sql`
          SELECT * FROM speaker_applications WHERE id = ${applicationId}
        `

        if (!app) {
          return NextResponse.json({ error: "Application not found" }, { status: 404 })
        }

        if (app.status !== 'rejected') {
          return NextResponse.json({ error: "Can only resend rejection letters for rejected applications" }, { status: 400 })
        }

        try {
          await sendApplicationEmail(app, 'application_rejected')
        } catch (emailError) {
          console.error('Failed to resend rejection letter:', emailError)
          return NextResponse.json({
            success: false,
            error: "Failed to resend rejection letter",
            details: emailError instanceof Error ? emailError.message : "Unknown email error"
          }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          message: "Rejection letter resent successfully"
        })
      }

      case 'update_notes':
        await sql`
          UPDATE speaker_applications
          SET admin_notes = ${admin_notes}
          WHERE id = ${applicationId}
        `
        break

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      message: `Application ${action} successfully`
    })

  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    )
  }
}

// Delete application
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id } = await params
    const applicationId = parseInt(id)

    const [existing] = await sql`
      SELECT id FROM speaker_applications WHERE id = ${applicationId}
    `

    if (!existing) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    await sql`
      DELETE FROM speaker_applications
      WHERE id = ${applicationId}
    `

    return NextResponse.json({
      success: true,
      message: "Application deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting application:", error)
    return NextResponse.json(
      { error: "Failed to delete application" },
      { status: 500 }
    )
  }
}

/**
 * Send application email using Gmail SMTP (via DB config) with customizable template
 */
async function sendApplicationEmail(application: any, templateKey: string) {
  // Load template from DB
  let template: any = null
  try {
    const rows = await sql`
      SELECT * FROM email_templates WHERE template_key = ${templateKey}
    `
    if (rows.length > 0) {
      template = rows[0]
    }
  } catch (e) {
    console.warn('Could not load email template from DB, using defaults:', e)
  }

  // Build template variables
  const inviteUrl = application.invitation_token
    ? `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/create-account?token=${application.invitation_token}`
    : ''

  const rejectionReasonBlock = application.rejection_reason
    ? `<div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6b7280;">
        <p style="color: #4b5563; font-size: 14px; margin: 0;"><strong>Feedback:</strong> ${application.rejection_reason}</p>
      </div>`
    : ''

  const variables: Record<string, string> = {
    '{{first_name}}': application.first_name || '',
    '{{last_name}}': application.last_name || '',
    '{{full_name}}': `${application.first_name || ''} ${application.last_name || ''}`.trim(),
    '{{email}}': application.email || '',
    '{{company}}': application.company || '',
    '{{title}}': application.title || '',
    '{{invite_url}}': inviteUrl,
    '{{rejection_reason}}': application.rejection_reason || '',
    '{{rejection_reason_block}}': rejectionReasonBlock,
  }

  let subject: string
  let htmlContent: string

  if (template) {
    subject = replaceVariables(template.subject, variables)
    htmlContent = replaceVariables(template.body_html, variables)
  } else {
    // Fallback to hardcoded defaults
    if (templateKey === 'application_approved') {
      subject = `Congratulations! Your Application to Speak About AI Has Been Approved`
      htmlContent = getDefaultApprovedHtml(application, inviteUrl)
    } else {
      subject = `Update on Your Speak About AI Application`
      htmlContent = getDefaultRejectedHtml(application, rejectionReasonBlock)
    }
  }

  const textContent = htmlContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()

  // Send via Gmail SMTP using DB config
  await sendViaSmtp(application.email, subject, htmlContent, textContent)
}

function replaceVariables(text: string, variables: Record<string, string>): string {
  let result = text
  for (const [key, value] of Object.entries(variables)) {
    result = result.split(key).join(value)
  }
  return result
}

/**
 * Send email via SMTP config from database (Gmail SMTP)
 */
async function sendViaSmtp(to: string, subject: string, html: string, text: string) {
  // Try SMTP config from database first
  try {
    const rows = await sql`SELECT * FROM smtp_config LIMIT 1`

    if (rows.length > 0 && rows[0].username && rows[0].password) {
      const config = rows[0]
      const nodemailer = require('nodemailer')

      const transporter = nodemailer.createTransport({
        host: config.host || 'smtp.gmail.com',
        port: config.port || 587,
        secure: config.port === 465,
        auth: {
          user: config.username,
          pass: config.password,
        },
      })

      const fromAddress = config.from_email || config.username
      const senderName = config.from_name || 'Speak About AI'

      await transporter.sendMail({
        from: `"${senderName}" <${fromAddress}>`,
        to,
        subject,
        html,
        text,
      })

      console.log(`Email sent via SMTP to ${to}`)
      return
    }
  } catch (smtpError) {
    console.error('SMTP sending failed, trying fallbacks:', smtpError)
  }

  // Fallback to Gmail env vars
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    const nodemailer = require('nodemailer')

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"Speak About AI" <${process.env.GMAIL_USER}>`,
      to,
      subject,
      html,
      text,
    })

    console.log(`Email sent via Gmail env vars to ${to}`)
    return
  }

  // Fallback to Resend if configured
  if (process.env.RESEND_API_KEY) {
    const { Resend } = require('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Speak About AI <hello@speakabout.ai>',
      to,
      subject,
      html,
      text,
    })

    if (error) {
      throw new Error(`Resend error: ${error.message}`)
    }

    console.log(`Email sent via Resend to ${to}`)
    return
  }

  throw new Error('No email service configured. Please configure SMTP in admin settings.')
}

function getDefaultApprovedHtml(app: any, inviteUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1E68C6; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <img src="https://speakabout.ai/speak-about-ai-dark-logo.png" alt="Speak About AI" style="max-width: 220px; height: auto; display: block; margin: 0 auto;" />
  </div>
  <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Dear ${app.first_name} ${app.last_name},</h2>
    <p style="color: #4b5563; font-size: 16px;">Congratulations! Your application to join Speak About AI has been approved.</p>
    <p style="color: #4b5563; font-size: 16px;">We're excited to welcome you to our exclusive network of AI and technology thought leaders.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${inviteUrl}" style="display: inline-block; background: #1E68C6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Create Your Account</a>
    </div>
    <p style="color: #6b7280; font-size: 14px; text-align: center;">Or copy this link: ${inviteUrl}</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;"><strong>Important:</strong> This invitation link will expire in 7 days.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #6b7280; font-size: 14px;">Questions? Email <a href="mailto:hello@speakabout.ai" style="color: #1E68C6;">hello@speakabout.ai</a></p>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">Best regards,<br><strong>The Speak About AI Team</strong></p>
  </div>
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Speak About AI. All rights reserved.</p>
  </div>
</body>
</html>`
}

function getDefaultRejectedHtml(app: any, rejectionReasonBlock: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1E68C6; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <img src="https://speakabout.ai/speak-about-ai-dark-logo.png" alt="Speak About AI" style="max-width: 220px; height: auto; display: block; margin: 0 auto;" />
  </div>
  <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Dear ${app.first_name} ${app.last_name},</h2>
    <p style="color: #4b5563; font-size: 16px;">Thank you for your interest in joining Speak About AI and for taking the time to submit your application.</p>
    <p style="color: #4b5563; font-size: 16px;">After careful review, we regret to inform you that we are unable to accept your application at this time.</p>
    ${rejectionReasonBlock}
    <p style="color: #4b5563; font-size: 16px;">We encourage you to continue developing your speaking career and welcome you to reapply in the future.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #6b7280; font-size: 14px;">Questions? Email <a href="mailto:hello@speakabout.ai" style="color: #1E68C6;">hello@speakabout.ai</a></p>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">Best regards,<br><strong>The Speak About AI Team</strong></p>
  </div>
  <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">&copy; ${new Date().getFullYear()} Speak About AI. All rights reserved.</p>
  </div>
</body>
</html>`
}

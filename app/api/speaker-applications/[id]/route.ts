import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"
import crypto from 'crypto'
import { Resend } from 'resend'

const sql = neon(process.env.DATABASE_URL!)

// Lazy initialize Resend
let resend: Resend | null = null
function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

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

      case 'approve':
        await sql`
          UPDATE speaker_applications
          SET 
            status = 'approved',
            reviewed_at = CURRENT_TIMESTAMP,
            reviewed_by = 'admin',
            admin_notes = ${admin_notes || null}
          WHERE id = ${applicationId}
        `
        break

      case 'reject':
        await sql`
          UPDATE speaker_applications
          SET 
            status = 'rejected',
            reviewed_at = CURRENT_TIMESTAMP,
            reviewed_by = 'admin',
            rejection_reason = ${rejection_reason || 'Does not meet current requirements'},
            admin_notes = ${admin_notes || null}
          WHERE id = ${applicationId}
        `
        break

      case 'invite': {
        // Generate unique invitation token
        const token = crypto.randomBytes(32).toString('hex')
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 7) // Token expires in 7 days

        const [updatedApp] = await sql`
          UPDATE speaker_applications
          SET
            status = 'invited',
            invitation_token = ${token},
            invitation_sent_at = CURRENT_TIMESTAMP,
            invitation_expires_at = ${expiresAt.toISOString()},
            admin_notes = ${admin_notes || null}
          WHERE id = ${applicationId}
          RETURNING *
        `

        // Send invitation email via Resend
        try {
          await sendInvitationEmail(updatedApp)
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
        // Get the existing application
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
            status = 'invited',
            invitation_token = ${newToken},
            invitation_sent_at = CURRENT_TIMESTAMP,
            invitation_expires_at = ${newExpiresAt.toISOString()}
          WHERE id = ${applicationId}
          RETURNING *
        `

        try {
          await sendInvitationEmail(refreshedApp)
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

async function sendInvitationEmail(application: any) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/create-account?token=${application.invitation_token}`

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Welcome to Speak About AI</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Speak About AI</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">AI & Technology Speaker Bureau</p>
      </div>
      <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Dear ${application.first_name} ${application.last_name},</h2>
        <p style="color: #4b5563; font-size: 16px;">
          Congratulations! Your application to join Speak About AI has been approved.
        </p>
        <p style="color: #4b5563; font-size: 16px;">
          We're excited to welcome you to our exclusive network of AI and technology thought leaders.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            Create Your Account
          </a>
        </div>
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          Or copy and paste this link into your browser:
        </p>
        <p style="color: #3b82f6; font-size: 14px; word-break: break-all; text-align: center;">
          ${inviteUrl}
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          <strong>Important:</strong> This invitation link will expire in 7 days.
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          If you have any questions, please don't hesitate to reach out to us at
          <a href="mailto:hello@speakabout.ai" style="color: #3b82f6;">hello@speakabout.ai</a>
        </p>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">
          Best regards,<br>
          <strong>The Speak About AI Team</strong>
        </p>
      </div>
      <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} Speak About AI. All rights reserved.</p>
      </div>
    </body>
    </html>
  `

  const textContent = `Dear ${application.first_name} ${application.last_name},

Congratulations! Your application to join Speak About AI has been approved.

We're excited to welcome you to our exclusive network of AI and technology thought leaders.

Please click the link below to create your speaker account:
${inviteUrl}

This invitation link will expire in 7 days.

If you have any questions, please don't hesitate to reach out to us at hello@speakabout.ai.

Best regards,
The Speak About AI Team`

  const { data, error } = await getResend().emails.send({
    from: process.env.RESEND_FROM_EMAIL || 'Speak About AI <hello@speakabout.ai>',
    to: application.email,
    subject: 'Welcome to Speak About AI - Create Your Account',
    html: htmlContent,
    text: textContent
  })

  if (error) {
    console.error('Failed to send invitation email:', error)
    throw new Error(`Failed to send email: ${error.message}`)
  }

  console.log('Invitation email sent successfully:', data)
  return data
}
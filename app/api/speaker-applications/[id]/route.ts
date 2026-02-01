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

      case 'invite':
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

        // Send invitation email
        await sendInvitationEmail(updatedApp)

        return NextResponse.json({
          success: true,
          message: "Invitation sent successfully",
          token: token // For testing, remove in production
        })

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
  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/create-account?token=${application.invitation_token}`
  
  // TODO: Implement actual email sending using Resend or similar service
  console.log(`Sending invitation email to ${application.email}`)
  console.log(`Invitation URL: ${inviteUrl}`)
  
  // For now, just log the email content
  const emailContent = `
    Dear ${application.first_name} ${application.last_name},

    Congratulations! Your application to join Speak About AI has been approved.

    We're excited to welcome you to our exclusive network of AI and technology thought leaders.

    Please click the link below to create your speaker account:
    ${inviteUrl}

    This invitation link will expire in 7 days.

    If you have any questions, please don't hesitate to reach out.

    Best regards,
    The Speak About AI Team
  `
  
  console.log(emailContent)
  
  // In production, use Resend API:
  // const { data, error } = await resend.emails.send({
  //   from: 'Speak About AI <hello@speakabout.ai>',
  //   to: application.email,
  //   subject: 'Welcome to Speak About AI - Create Your Account',
  //   html: emailContent
  // })
}
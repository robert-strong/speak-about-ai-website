import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"
import crypto from 'crypto'
import { Resend } from 'resend'

const sql = neon(process.env.DATABASE_URL!)

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
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { speaker_id, first_name, last_name, email, personal_message, type } = body

    // Validate required fields
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      )
    }

    // For account creation invites, verify the speaker exists in the system
    if (type === 'account_creation') {
      if (!speaker_id) {
        return NextResponse.json(
          { error: "Speaker ID is required for account creation invitations" },
          { status: 400 }
        )
      }

      const existingSpeaker = await sql`
        SELECT id, name, email FROM speakers 
        WHERE id = ${speaker_id}
      `

      if (existingSpeaker.length === 0) {
        return NextResponse.json(
          { error: "Speaker not found in the system" },
          { status: 404 }
        )
      }

      // Verify the email matches the speaker's registered email
      if (existingSpeaker[0].email.toLowerCase() !== email.toLowerCase()) {
        return NextResponse.json(
          { error: "Email does not match the speaker's registered email address" },
          { status: 400 }
        )
      }
    }

    // Check if there's already a pending application or invitation
    const existingApplication = await sql`
      SELECT id, status FROM speaker_applications 
      WHERE LOWER(email) = ${email.toLowerCase()}
    `

    if (existingApplication.length > 0) {
      const status = existingApplication[0].status
      if (status === 'invited') {
        return NextResponse.json(
          { error: "An invitation has already been sent to this email" },
          { status: 400 }
        )
      } else if (status === 'pending' || status === 'under_review') {
        return NextResponse.json(
          { error: "There is already a pending application from this email" },
          { status: 400 }
        )
      }
    }

    // Generate unique invitation token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // Token expires in 7 days

    // Create a new speaker application with invited status
    const [application] = await sql`
      INSERT INTO speaker_applications (
        first_name,
        last_name,
        email,
        status,
        bio,
        speaking_topics,
        location,
        title,
        company,
        invitation_token,
        invitation_sent_at,
        invitation_expires_at,
        admin_notes,
        reviewed_by,
        reviewed_at
      ) VALUES (
        ${first_name || 'Speaker'},
        ${last_name || ''},
        ${email.toLowerCase()},
        'invited',
        ${type === 'account_creation' ? 'Account creation invitation for existing speaker' : 'Direct invitation from admin'},
        ${type === 'account_creation' ? 'Profile already exists in system' : 'To be provided'},
        'To be provided',
        'To be provided',
        'To be provided',
        ${token},
        CURRENT_TIMESTAMP,
        ${expiresAt.toISOString()},
        ${personal_message || (type === 'account_creation' ? `Account creation invite for speaker ID: ${speaker_id}` : 'Direct invitation sent by admin')},
        'admin',
        CURRENT_TIMESTAMP
      )
      RETURNING id, email, first_name, last_name, invitation_token
    `

    // Send invitation email
    console.log('Attempting to send invitation email to:', application.email)
    try {
      const emailResult = await sendInvitationEmail({
        ...application,
        personal_message,
        type
      })
      console.log('Email sent successfully:', emailResult)
    } catch (emailError) {
      console.error('Failed to send email:', emailError)
      // Don't fail the whole request if email fails - invitation is already saved in DB
      // But include warning in response
      return NextResponse.json({
        success: true,
        message: "Invitation recorded but email sending failed. Please check logs.",
        applicationId: application.id,
        token: token,
        emailError: emailError instanceof Error ? emailError.message : "Unknown email error"
      })
    }

    return NextResponse.json({
      success: true,
      message: "Invitation sent successfully",
      applicationId: application.id,
      token: token // For testing, remove in production
    })

  } catch (error) {
    console.error("Error sending speaker invitation:", error)
    return NextResponse.json(
      { 
        error: "Failed to send invitation",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

async function sendInvitationEmail(data: any) {
  const inviteUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://speakabout.ai'}/create-account?token=${data.invitation_token}`
  
  const isAccountCreation = data.type === 'account_creation'
  
  // Create HTML email content
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${isAccountCreation ? 'Create Your Speak About AI Account' : 'Invitation to Join Speak About AI'}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Speak About AI</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">AI & Technology Speaker Bureau</p>
      </div>
      
      <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Dear ${data.first_name} ${data.last_name},</h2>
        
        <p style="color: #4b5563; font-size: 16px;">
          ${isAccountCreation 
            ? "Your speaker profile is already set up on Speak About AI! We're inviting you to create your account so you can manage your profile and access the speaker portal."
            : "You've been invited to join Speak About AI as a featured speaker!"
          }
        </p>
        
        ${!isAccountCreation ? `
          <p style="color: #4b5563; font-size: 16px;">
            We're excited to welcome you to our exclusive network of AI and technology thought leaders.
          </p>
        ` : ''}
        
        ${data.personal_message ? `
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px; font-weight: 600;">Personal Message:</p>
            <p style="color: #4b5563; margin: 0;">${data.personal_message}</p>
          </div>
        ` : ''}
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
            ${isAccountCreation ? 'Create Your Account' : 'Accept Invitation'}
          </a>
        </div>
        
        <p style="color: #6b7280; font-size: 14px; text-align: center;">
          Or copy and paste this link into your browser:
        </p>
        <p style="color: #3b82f6; font-size: 14px; word-break: break-all; text-align: center;">
          ${inviteUrl}
        </p>
        
        ${isAccountCreation ? `
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #3b82f6;">
            <p style="color: #1e40af; font-weight: 600; margin: 0 0 10px 0;">Once you create your account, you'll be able to:</p>
            <ul style="color: #3730a3; margin: 10px 0; padding-left: 20px;">
              <li>View and edit your speaker profile</li>
              <li>Access the speaker portal dashboard</li>
              <li>Manage your speaking engagements</li>
              <li>Update your availability and preferences</li>
            </ul>
          </div>
        ` : ''}
        
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
        <p style="margin: 0;">
          © ${new Date().getFullYear()} Speak About AI. All rights reserved.
        </p>
        <p style="margin: 10px 0 0 0;">
          <a href="https://speakabout.ai" style="color: #6b7280; text-decoration: none;">speakabout.ai</a>
        </p>
      </div>
    </body>
    </html>
  `
  
  // Send email using Resend
  try {
    const { data: emailData, error } = await getResend().emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Speak About AI <hello@speakabout.ai>',
      to: data.email,
      subject: isAccountCreation ? 'Create Your Speak About AI Account' : 'You\'re Invited to Join Speak About AI',
      html: htmlContent,
      text: `Dear ${data.first_name} ${data.last_name},\n\n${isAccountCreation ? "Your speaker profile is already set up on Speak About AI! We're inviting you to create your account so you can manage your profile and access the speaker portal." : "You've been invited to join Speak About AI as a speaker!"}\n\n${data.personal_message ? `Personal message:\n${data.personal_message}\n\n` : ''}Please visit the following link to create your account:\n${inviteUrl}\n\nThis invitation link will expire in 7 days.\n\nBest regards,\nThe Speak About AI Team`
    })
    
    if (error) {
      console.error('Failed to send invitation email:', error)
      throw new Error(`Failed to send email: ${error.message}`)
    }
    
    console.log('Invitation email sent successfully:', emailData)
    return emailData
  } catch (error) {
    console.error('Error sending invitation email:', error)
    throw error
  }
}
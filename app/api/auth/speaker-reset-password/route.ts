import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { generateSecureToken, hashPassword, validatePassword } from '@/lib/password-utils'
import { sendPasswordResetEmail } from '@/lib/email-service-unified'

// Initialize Neon client
const sql = neon(process.env.DATABASE_URL!)

// Request password reset
export async function POST(request: NextRequest) {
  try {
    let body
    try {
      body = await request.json()
    } catch (jsonError) {
      console.error('JSON parsing error:', jsonError)
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }
    
    const { email, resetToken, newPassword } = body

    // If this is a password reset request (no resetToken provided)
    if (!resetToken) {
      // Email is required for requesting a reset
      if (!email) {
        return NextResponse.json(
          { error: 'Email is required' },
          { status: 400 }
        )
      }
      // First try to find in speaker_accounts table (for portal login)
      const accounts = await sql`
        SELECT 
          sa.id as account_id,
          sa.speaker_id,
          sa.speaker_email as email,
          sa.speaker_name as name,
          sa.is_active as active
        FROM speaker_accounts sa
        WHERE LOWER(sa.speaker_email) = ${email.toLowerCase()} 
          AND sa.is_active = true
        LIMIT 1
      `
      
      let speaker = null
      let useAccountsTable = false
      
      if (accounts.length > 0) {
        speaker = accounts[0]
        useAccountsTable = true
      } else {
        // Fallback to speakers table
        const speakers = await sql`
          SELECT id, email, name, active
          FROM speakers
          WHERE email = ${email.toLowerCase()} AND active = true
          LIMIT 1
        `
        if (speakers.length > 0) {
          speaker = speakers[0]
        }
      }

      if (!speaker) {
        // Don't reveal if email exists or not for security
        return NextResponse.json({
          success: true,
          message: 'If an account with this email exists, you will receive a password reset link.'
        })
      }

      // Generate reset token (expires in 1 hour)
      const resetToken = generateSecureToken()
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

      // Store reset token in the appropriate table
      if (useAccountsTable) {
        await sql`
          UPDATE speaker_accounts
          SET 
            reset_token = ${resetToken},
            reset_token_expires = ${expiresAt.toISOString()}
          WHERE id = ${speaker.account_id}
        `
      } else {
        await sql`
          UPDATE speakers
          SET 
            reset_token = ${resetToken},
            reset_token_expires = ${expiresAt.toISOString()},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${speaker.id}
        `
      }

      // Send password reset email
      try {
        await sendPasswordResetEmail(speaker.email, resetToken)
        console.log('✅ Password reset email sent to:', speaker.email)
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError)
        // Don't fail the request if email fails - token is still stored
      }

      const response: any = {
        success: true,
        message: 'Password reset link sent to your email address.'
      }

      // In development, include reset token for testing
      if (process.env.NODE_ENV === 'development') {
        response.resetToken = resetToken
        response.resetUrl = `/portal/speaker-reset-password?token=${resetToken}`
      }

      return NextResponse.json(response)
    }

    // If this is a password reset completion (resetToken and newPassword provided)
    if (!newPassword) {
      return NextResponse.json(
        { error: 'New password is required' },
        { status: 400 }
      )
    }

    // Validate new password strength
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.message },
        { status: 400 }
      )
    }

    // First try speaker_accounts table
    const accounts = await sql`
      SELECT 
        sa.id as account_id,
        sa.speaker_email as email,
        sa.speaker_name as name,
        sa.reset_token_expires
      FROM speaker_accounts sa
      WHERE sa.reset_token = ${resetToken} 
        AND sa.is_active = true 
        AND sa.reset_token_expires > NOW()
      LIMIT 1
    `

    let speaker = null
    let useAccountsTable = false

    if (accounts.length > 0) {
      speaker = accounts[0]
      useAccountsTable = true
    } else {
      // Fallback to speakers table
      const speakers = await sql`
        SELECT id, email, name, reset_token_expires
        FROM speakers
        WHERE reset_token = ${resetToken} 
          AND active = true 
          AND reset_token_expires > NOW()
        LIMIT 1
      `
      if (speakers.length > 0) {
        speaker = speakers[0]
      }
    }

    if (!speaker) {
      return NextResponse.json(
        { error: 'Invalid or expired reset token' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = hashPassword(newPassword)

    // Update password in the appropriate table
    if (useAccountsTable) {
      await sql`
        UPDATE speaker_accounts
        SET 
          password_hash = ${passwordHash},
          reset_token = NULL,
          reset_token_expires = NULL,
          email_verified = true
        WHERE id = ${speaker.account_id}
      `
    } else {
      await sql`
        UPDATE speakers
        SET 
          password_hash = ${passwordHash},
          reset_token = NULL,
          reset_token_expires = NULL,
          email_verified = true,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${speaker.id}
      `
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset successfully. You can now log in with your new password.',
      speaker: {
        id: speaker.account_id || speaker.id,
        email: speaker.email,
        name: speaker.name
      }
    })

  } catch (error) {
    console.error('Password reset error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset. Please try again.' },
      { status: 500 }
    )
  }
}
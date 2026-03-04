import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'

const sql = neon(process.env.DATABASE_URL!)

// GET - Fetch email template(s) by key or list all
export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const templateKey = searchParams.get('key')

  try {
    // If no key provided, return all templates
    if (!templateKey) {
      const rows = await sql`
        SELECT * FROM email_templates ORDER BY template_key
      `
      return NextResponse.json({ templates: rows })
    }

    const rows = await sql`
      SELECT * FROM email_templates WHERE template_key = ${templateKey}
    `

    if (rows.length === 0) {
      // Return defaults for known application templates
      if (templateKey === 'application_approved') {
        return NextResponse.json({
          template: {
            template_key: 'application_approved',
            subject: 'Congratulations! Your Application to Speak About AI Has Been Approved',
            body_html: getDefaultApprovedTemplate(),
          },
          is_new: true
        })
      }
      if (templateKey === 'application_rejected') {
        return NextResponse.json({
          template: {
            template_key: 'application_rejected',
            subject: 'Update on Your Speak About AI Application',
            body_html: getDefaultRejectedTemplate(),
          },
          is_new: true
        })
      }
      return NextResponse.json({
        template: {
          template_key: templateKey,
          subject: '',
          body_html: '',
        },
        is_new: true
      })
    }

    return NextResponse.json({ template: rows[0] })
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      return NextResponse.json({ template: null, needs_migration: true })
    }
    console.error('Error fetching email template:', error)
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}

// PUT - Update or create email template
export async function PUT(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const { template_key, subject, body_html } = await request.json()

    if (!template_key || !subject?.trim() || !body_html?.trim()) {
      return NextResponse.json({ error: 'Template key, subject, and body are required' }, { status: 400 })
    }

    const existing = await sql`
      SELECT id FROM email_templates WHERE template_key = ${template_key}
    `

    if (existing.length > 0) {
      await sql`
        UPDATE email_templates
        SET subject = ${subject.trim()},
            body_html = ${body_html},
            updated_at = NOW()
        WHERE template_key = ${template_key}
      `
    } else {
      await sql`
        INSERT INTO email_templates (template_key, subject, body_html)
        VALUES (${template_key}, ${subject.trim()}, ${body_html})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving email template:', error)
    return NextResponse.json({ error: 'Failed to save template' }, { status: 500 })
  }
}

function getDefaultApprovedTemplate(): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1E68C6; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <img src="https://speakabout.ai/speak-about-ai-dark-logo.png" alt="Speak About AI" style="max-width: 220px; height: auto; display: block; margin: 0 auto;" />
  </div>
  <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Dear {{first_name}} {{last_name}},</h2>
    <p style="color: #4b5563; font-size: 16px;">Congratulations! Your application to join Speak About AI has been approved.</p>
    <p style="color: #4b5563; font-size: 16px;">We are excited to welcome you to our exclusive network of AI and technology thought leaders.</p>
    <p style="color: #4b5563; font-size: 16px;">Please click the button below to create your speaker account:</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="{{invite_url}}" style="display: inline-block; background: #1E68C6; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Create Your Account</a>
    </div>
    <p style="color: #6b7280; font-size: 14px; text-align: center;">Or copy and paste this link: {{invite_url}}</p>
    <p style="color: #6b7280; font-size: 14px; margin-top: 30px;"><strong>Important:</strong> This invitation link will expire in 7 days.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #6b7280; font-size: 14px;">Questions? Reach out at <a href="mailto:hello@speakabout.ai" style="color: #1E68C6;">hello@speakabout.ai</a></p>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">Best regards,<br><strong>The Speak About AI Team</strong></p>
  </div>
</body>
</html>`
}

function getDefaultRejectedTemplate(): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: #1E68C6; padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <img src="https://speakabout.ai/speak-about-ai-dark-logo.png" alt="Speak About AI" style="max-width: 220px; height: auto; display: block; margin: 0 auto;" />
  </div>
  <div style="background: white; padding: 40px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
    <h2 style="color: #1f2937; margin-top: 0;">Dear {{first_name}} {{last_name}},</h2>
    <p style="color: #4b5563; font-size: 16px;">Thank you for your interest in joining Speak About AI and for taking the time to submit your application.</p>
    <p style="color: #4b5563; font-size: 16px;">After careful review, we regret to inform you that we are unable to accept your application at this time.</p>
    {{rejection_reason_block}}
    <p style="color: #4b5563; font-size: 16px;">We encourage you to continue developing your speaking career and welcome you to reapply in the future.</p>
    <p style="color: #4b5563; font-size: 16px;">We wish you the very best in your professional endeavors.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
    <p style="color: #6b7280; font-size: 14px;">Questions? Reach out at <a href="mailto:hello@speakabout.ai" style="color: #1E68C6;">hello@speakabout.ai</a></p>
    <p style="color: #6b7280; font-size: 14px; margin-bottom: 0;">Best regards,<br><strong>The Speak About AI Team</strong></p>
  </div>
</body>
</html>`
}

import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'
import { hashPassword } from '@/lib/password-utils'
import { randomBytes } from 'crypto'

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const { member_id } = await request.json()

    if (!member_id) {
      return NextResponse.json({ error: 'Member ID is required' }, { status: 400 })
    }

    // Fetch member info with role
    const members = await sql`
      SELECT tm.*, r.name as role_name
      FROM team_members tm
      LEFT JOIN roles r ON tm.role_id = r.id
      WHERE tm.id = ${member_id}
    `

    if (members.length === 0) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 })
    }

    const member = members[0]

    // Generate new temporary password
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
    const bytes = randomBytes(12)
    let tempPassword = ''
    for (let i = 0; i < 12; i++) {
      tempPassword += chars[bytes[i] % chars.length]
    }
    tempPassword = tempPassword.slice(0, 4) + 'A' + 'a' + '1' + tempPassword.slice(7)

    // Hash and update password
    const passwordHash = hashPassword(tempPassword)
    await sql`
      UPDATE team_members
      SET password_hash = ${passwordHash}, must_change_password = TRUE, updated_at = NOW()
      WHERE id = ${member_id}
    `

    // Fetch welcome email template
    const templates = await sql`
      SELECT subject, body_html FROM email_templates WHERE template_key = 'welcome_team_member'
    `

    if (templates.length === 0) {
      return NextResponse.json({ error: 'Welcome email template not found. Please save one first.' }, { status: 404 })
    }

    const template = templates[0]
    const loginUrl = getBaseUrl(request)
    const companyName = process.env.ENTITY_NAME || 'Speak About AI'

    // Replace template variables
    const subject = replaceVars(template.subject, {
      name: member.name,
      email: member.email,
      temporary_password: tempPassword,
      login_url: `${loginUrl}/admin`,
      role: member.role_name || 'Team Member',
      company_name: companyName,
    })

    const bodyHtml = replaceVars(template.body_html, {
      name: member.name,
      email: member.email,
      temporary_password: tempPassword,
      login_url: `${loginUrl}/admin`,
      role: member.role_name || 'Team Member',
      company_name: companyName,
    })

    // Send the email
    const sent = await sendWelcomeEmail(member.email, subject, bodyHtml)

    if (sent) {
      return NextResponse.json({
        success: true,
        message: `Welcome email sent to ${member.email}`
      })
    } else {
      return NextResponse.json({
        error: 'Failed to send email. Check your SMTP configuration in Settings > Email / SMTP.'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return NextResponse.json({ error: 'Failed to send welcome email' }, { status: 500 })
  }
}

function replaceVars(template: string, vars: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return result
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || 'localhost:3000'
  const protocol = host.includes('localhost') ? 'http' : 'https'
  return `${protocol}://${host}`
}

async function sendWelcomeEmail(to: string, subject: string, html: string): Promise<boolean> {
  try {
    // 1. Try database SMTP config first
    try {
      const smtpRows = await sql`SELECT * FROM smtp_config LIMIT 1`
      if (smtpRows.length > 0 && smtpRows[0].username && smtpRows[0].password) {
        const config = smtpRows[0]
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

        await transporter.sendMail({
          from: config.from_email
            ? `"${config.from_name || 'Admin'}" <${config.from_email}>`
            : config.username,
          to,
          subject,
          html,
        })

        console.log(`Welcome email sent via DB SMTP to ${to}`)
        return true
      }
    } catch (smtpErr) {
      console.warn('DB SMTP config not available, trying fallbacks:', smtpErr)
    }

    // 2. Try env Gmail SMTP
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
        from: process.env.GMAIL_USER,
        to,
        subject,
        html,
      })

      console.log(`Welcome email sent via Gmail env to ${to}`)
      return true
    }

    // 3. Try Resend
    if (process.env.RESEND_API_KEY) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@speakaboutai.com',
          to: [to],
          subject,
          html,
        }),
      })

      if (response.ok) {
        console.log(`Welcome email sent via Resend to ${to}`)
        return true
      }
    }

    // 4. No email service configured
    console.warn('No email service configured. Welcome email NOT sent.')
    console.log(`Would have sent to: ${to}`)
    console.log(`Subject: ${subject}`)
    return false
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { requireAdminAuth } from '@/lib/auth-middleware'

const sql = neon(process.env.DATABASE_URL!)

// GET - Fetch SMTP configuration
export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const rows = await sql`SELECT * FROM smtp_config ORDER BY id LIMIT 1`

    if (rows.length === 0) {
      return NextResponse.json({
        config: {
          provider: 'gmail',
          host: 'smtp.gmail.com',
          port: 587,
          username: '',
          password: '',
          from_name: '',
          from_email: '',
          use_tls: true,
        },
        is_new: true
      })
    }

    const config = rows[0]
    return NextResponse.json({
      config: {
        id: config.id,
        provider: config.provider,
        host: config.host,
        port: config.port,
        username: config.username,
        password: config.password ? '••••••••' : '',
        from_name: config.from_name,
        from_email: config.from_email,
        use_tls: config.use_tls,
      },
      has_password: !!config.password
    })
  } catch (error: any) {
    if (error.message?.includes('does not exist')) {
      return NextResponse.json({ config: null, needs_migration: true })
    }
    console.error('Error fetching SMTP config:', error)
    return NextResponse.json({ error: 'Failed to fetch SMTP config' }, { status: 500 })
  }
}

// PUT - Update SMTP configuration
export async function PUT(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const { config } = await request.json()

    if (!config) {
      return NextResponse.json({ error: 'Config is required' }, { status: 400 })
    }

    // Check if config exists
    const existing = await sql`SELECT id, password FROM smtp_config LIMIT 1`

    // If password is masked, keep the old one
    const password = config.password === '••••••••'
      ? (existing.length > 0 ? existing[0].password : '')
      : config.password

    if (existing.length > 0) {
      await sql`
        UPDATE smtp_config SET
          provider = ${config.provider || 'gmail'},
          host = ${config.host || 'smtp.gmail.com'},
          port = ${config.port || 587},
          username = ${config.username || ''},
          password = ${password || ''},
          from_name = ${config.from_name || ''},
          from_email = ${config.from_email || ''},
          use_tls = ${config.use_tls !== false},
          updated_at = NOW()
        WHERE id = ${existing[0].id}
      `
    } else {
      await sql`
        INSERT INTO smtp_config (provider, host, port, username, password, from_name, from_email, use_tls)
        VALUES (
          ${config.provider || 'gmail'},
          ${config.host || 'smtp.gmail.com'},
          ${config.port || 587},
          ${config.username || ''},
          ${password || ''},
          ${config.from_name || ''},
          ${config.from_email || ''},
          ${config.use_tls !== false}
        )
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating SMTP config:', error)
    return NextResponse.json({ error: 'Failed to save SMTP config' }, { status: 500 })
  }
}

// POST - Test SMTP connection
export async function POST(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  try {
    const { test_email } = await request.json()

    if (!test_email) {
      return NextResponse.json({ error: 'Test email address is required' }, { status: 400 })
    }

    // Fetch current SMTP config
    const rows = await sql`SELECT * FROM smtp_config LIMIT 1`
    if (rows.length === 0 || !rows[0].username || !rows[0].password) {
      return NextResponse.json({
        error: 'SMTP not configured. Please save your settings first.'
      }, { status: 400 })
    }

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

    // Verify connection
    await transporter.verify()

    // Send test email
    await transporter.sendMail({
      from: config.from_email
        ? `"${config.from_name || 'Test'}" <${config.from_email}>`
        : config.username,
      to: test_email,
      subject: 'SMTP Test - Speak About AI Admin',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>SMTP Configuration Test</h2>
          <p>If you're reading this, your email configuration is working correctly.</p>
          <p style="color: #666; font-size: 13px;">Sent from Speak About AI Admin Dashboard</p>
        </div>
      `,
    })

    return NextResponse.json({ success: true, message: `Test email sent to ${test_email}` })
  } catch (error: any) {
    console.error('SMTP test error:', error)
    return NextResponse.json({
      error: `SMTP test failed: ${error.message || 'Unknown error'}`
    }, { status: 500 })
  }
}

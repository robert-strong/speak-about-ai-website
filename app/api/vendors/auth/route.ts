import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { Resend } from "resend"
import crypto from "crypto"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

// Lazy initialize Resend to avoid build-time errors
let resend: Resend | null = null
function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}
const JWT_SECRET = process.env.JWT_SECRET || "vendor-secret-key-change-in-production"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, email, token, vendorData } = body

    switch (action) {
      case "request_login": {
        // Check if vendor exists
        const vendors = await sql`
          SELECT id, company_name, contact_email, status
          FROM vendors
          WHERE contact_email = ${email.toLowerCase()}
          AND status = 'approved'
        `

        if (vendors.length === 0) {
          return NextResponse.json(
            { error: "No approved vendor account found with this email" },
            { status: 404 }
          )
        }

        const vendor = vendors[0]
        
        // Generate secure login token
        const loginToken = crypto.randomBytes(32).toString('hex')
        const tokenExpiry = new Date(Date.now() + 30 * 60 * 1000) // 30 minutes

        // Store token in database
        await sql`
          INSERT INTO vendor_auth_tokens (
            vendor_id,
            token,
            token_type,
            expires_at,
            created_at
          ) VALUES (
            ${vendor.id},
            ${loginToken},
            'login',
            ${tokenExpiry},
            CURRENT_TIMESTAMP
          )
        `

        // Send login email
        const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/vendors/login?token=${loginToken}&email=${email}`
        
        await getResend().emails.send({
          from: 'Vendor Portal <vendors@speakaboutai.com>',
          to: email,
          subject: 'Your Vendor Portal Login Link',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Login to Your Vendor Portal</h2>
              <p>Hi ${vendor.company_name},</p>
              <p>Click the link below to securely log in to your vendor portal:</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  Access Vendor Portal
                </a>
              </div>
              <p style="color: #666; font-size: 14px;">This link will expire in 30 minutes for security reasons.</p>
              <p style="color: #666; font-size: 14px;">If you didn't request this login link, please ignore this email.</p>
            </div>
          `
        })

        // Log activity
        await sql`
          INSERT INTO vendor_activity (
            vendor_id, activity_type, description, metadata
          ) VALUES (
            ${vendor.id},
            'login_requested',
            'Login link requested',
            ${JSON.stringify({ ip: request.headers.get('x-forwarded-for') })}
          )
        `

        return NextResponse.json({ 
          success: true, 
          message: "Login link sent to your email"
        })
      }

      case "verify_login": {
        // Verify login token
        const tokens = await sql`
          SELECT vat.*, v.id as vendor_id, v.company_name, v.contact_email, v.slug
          FROM vendor_auth_tokens vat
          JOIN vendors v ON v.id = vat.vendor_id
          WHERE vat.token = ${token}
          AND vat.token_type = 'login'
          AND vat.expires_at > CURRENT_TIMESTAMP
          AND vat.used_at IS NULL
        `

        if (tokens.length === 0) {
          return NextResponse.json(
            { error: "Invalid or expired login link" },
            { status: 401 }
          )
        }

        const vendorInfo = tokens[0]

        // Mark token as used
        await sql`
          UPDATE vendor_auth_tokens
          SET used_at = CURRENT_TIMESTAMP
          WHERE token = ${token}
        `

        // Generate JWT session token
        const sessionToken = jwt.sign(
          { 
            vendorId: vendorInfo.vendor_id,
            email: vendorInfo.contact_email,
            company: vendorInfo.company_name
          },
          JWT_SECRET,
          { expiresIn: '7d' }
        )

        // Log successful login
        await sql`
          INSERT INTO vendor_activity (
            vendor_id, activity_type, description
          ) VALUES (
            ${vendorInfo.vendor_id},
            'login_success',
            'Successfully logged in'
          )
        `

        // Update last login
        await sql`
          UPDATE vendors
          SET last_activity_at = CURRENT_TIMESTAMP
          WHERE id = ${vendorInfo.vendor_id}
        `

        return NextResponse.json({
          success: true,
          token: sessionToken,
          vendor: {
            id: vendorInfo.vendor_id,
            company_name: vendorInfo.company_name,
            email: vendorInfo.contact_email,
            slug: vendorInfo.slug
          }
        })
      }

      case "verify_session": {
        // Verify JWT token
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any
          
          const vendors = await sql`
            SELECT id, company_name, contact_email, slug, status
            FROM vendors
            WHERE id = ${decoded.vendorId}
            AND status = 'approved'
          `

          if (vendors.length === 0) {
            return NextResponse.json(
              { error: "Vendor account not found or not approved" },
              { status: 404 }
            )
          }

          return NextResponse.json({
            success: true,
            vendor: vendors[0]
          })
        } catch (error) {
          return NextResponse.json(
            { error: "Invalid session token" },
            { status: 401 }
          )
        }
      }

      case "logout": {
        try {
          const decoded = jwt.verify(token, JWT_SECRET) as any
          
          await sql`
            INSERT INTO vendor_activity (
              vendor_id, activity_type, description
            ) VALUES (
              ${decoded.vendorId},
              'logout',
              'Logged out from portal'
            )
          `

          return NextResponse.json({ success: true })
        } catch (error) {
          return NextResponse.json({ success: true })
        }
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Vendor auth error:", error)
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    )
  }
}
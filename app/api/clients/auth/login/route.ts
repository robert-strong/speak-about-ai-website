import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import crypto from "crypto"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)

function verifyPassword(password: string, hash: string): boolean {
  const [salt, storedHash] = hash.split(':')
  const hashToVerify = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
  return storedHash === hashToVerify
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      )
    }

    // Find client by email
    const clients = await sql`
      SELECT
        id,
        name,
        email,
        company,
        phone,
        password_hash,
        portal_enabled,
        is_active,
        email_verified
      FROM clients
      WHERE LOWER(email) = ${email.toLowerCase()}
      LIMIT 1
    `

    if (clients.length === 0) {
      console.log('Client login failed: No account found for email:', email)
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    const client = clients[0]

    // Check if client has a password
    if (!client.password_hash) {
      console.log('Client login failed: No password set')
      return NextResponse.json(
        { error: "Password not set. Please use the forgot password link." },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = verifyPassword(password, client.password_hash)

    if (!isValidPassword) {
      console.log('Client login failed: Invalid password')
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Check if account is active
    if (!client.is_active) {
      return NextResponse.json(
        { error: "Account is not active. Please contact support." },
        { status: 403 }
      )
    }

    // Check if portal is enabled
    if (!client.portal_enabled) {
      return NextResponse.json(
        { error: "Portal access is not enabled for this account." },
        { status: 403 }
      )
    }

    // Update last login
    await sql`
      UPDATE clients
      SET last_login = CURRENT_TIMESTAMP
      WHERE id = ${client.id}
    `

    // Generate JWT token
    const token = jwt.sign(
      {
        id: client.id,
        clientId: client.id,
        email: client.email,
        name: client.name,
        company: client.company,
        type: 'client'
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    )

    return NextResponse.json({
      success: true,
      token,
      clientId: client.id,
      clientName: client.name,
      company: client.company,
      email: client.email
    })

  } catch (error) {
    console.error("Client login error:", error)
    return NextResponse.json(
      { error: "An error occurred during login" },
      { status: 500 }
    )
  }
}

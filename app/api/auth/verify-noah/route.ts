import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Update Noah's email verification status
    await sql`
      UPDATE speakers 
      SET email_verified = true 
      WHERE email = 'noah@speakabout.ai'
    `

    // Get updated speaker info
    const speakers = await sql`
      SELECT id, name, email, email_verified, password_hash IS NOT NULL as has_password 
      FROM speakers 
      WHERE email = 'noah@speakabout.ai'
    `

    return NextResponse.json({
      success: true,
      message: 'Email verified for noah@speakabout.ai',
      speaker: speakers[0]
    })
  } catch (error) {
    console.error('Verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify email' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import { hashPassword } from '@/lib/password-utils'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Check if Noah already has an account in speaker_accounts
    const existing = await sql`
      SELECT id FROM speaker_accounts 
      WHERE speaker_email = 'noah@speakabout.ai'
    `
    
    if (existing.length > 0) {
      // Update the existing account with a new password
      const passwordHash = hashPassword('Password123')
      
      await sql`
        UPDATE speaker_accounts
        SET 
          password_hash = ${passwordHash},
          email_verified = true,
          is_active = true,
          profile_status = 'approved'
        WHERE speaker_email = 'noah@speakabout.ai'
      `
      
      return NextResponse.json({
        success: true,
        message: 'Updated existing account for noah@speakabout.ai',
        accountId: existing[0].id
      })
    }
    
    // Get Noah's speaker ID from speakers table
    const speakers = await sql`
      SELECT id, name FROM speakers 
      WHERE email = 'noah@speakabout.ai'
    `
    
    if (speakers.length === 0) {
      return NextResponse.json(
        { error: 'Speaker not found in speakers table' },
        { status: 404 }
      )
    }
    
    const speaker = speakers[0]
    const passwordHash = hashPassword('Password123')
    
    // Create account in speaker_accounts table
    const result = await sql`
      INSERT INTO speaker_accounts (
        speaker_id,
        speaker_name,
        speaker_email,
        password_hash,
        is_active,
        email_verified,
        profile_status,
        created_at
      ) VALUES (
        ${speaker.id},
        ${speaker.name},
        'noah@speakabout.ai',
        ${passwordHash},
        true,
        true,
        'pending',
        CURRENT_TIMESTAMP
      )
      RETURNING id
    `
    
    return NextResponse.json({
      success: true,
      message: 'Created speaker account for noah@speakabout.ai',
      accountId: result[0].id,
      password: 'Password123'
    })
  } catch (error) {
    console.error('Account creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create account', details: String(error) },
      { status: 500 }
    )
  }
}
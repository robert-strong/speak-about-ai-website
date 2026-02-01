import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Fetch all speaker accounts with their associated speaker details
    const accounts = await sql`
      SELECT 
        sa.id,
        sa.speaker_id,
        sa.speaker_name,
        sa.speaker_email,
        sa.password_hash,
        sa.is_active,
        sa.email_verified,
        sa.profile_status,
        sa.created_at,
        sa.last_login,
        s.name as speaker_full_name,
        s.topics,
        s.industries,
        s.location,
        s.headshot_url,
        s.featured,
        s.active as speaker_active,
        s.listed as speaker_listed
      FROM speaker_accounts sa
      LEFT JOIN speakers s ON sa.speaker_id = s.id
      ORDER BY sa.created_at DESC
    `
    
    // Transform the data to match the expected format
    const speakerAccounts = accounts.map(account => ({
      id: account.id,
      speaker_id: account.speaker_id,
      speaker_name: account.speaker_name || account.speaker_full_name,
      speaker_email: account.speaker_email,
      is_active: account.is_active,
      profile_status: account.profile_status || 'pending',
      created_at: account.created_at,
      last_login: account.last_login,
      email_verified: account.email_verified,
      
      // Additional speaker info
      location: account.location,
      headshot_url: account.headshot_url,
      topics: account.topics,
      industries: account.industries,
      featured: account.featured,
      speaker_active: account.speaker_active,
      speaker_listed: account.speaker_listed,
      
      // Access token placeholder (you may want to generate actual tokens)
      access_token: `speaker_${account.id}_token`,
      
      // Associated projects (would need another query to get actual projects)
      projects: []
    }))
    
    return NextResponse.json(speakerAccounts)
  } catch (error) {
    console.error('Error fetching speaker accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch speaker accounts' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { speaker_id, speaker_email, speaker_name } = body
    
    if (!speaker_id || !speaker_email) {
      return NextResponse.json(
        { error: 'Speaker ID and email are required' },
        { status: 400 }
      )
    }
    
    // Check if account already exists
    const existing = await sql`
      SELECT id FROM speaker_accounts 
      WHERE speaker_email = ${speaker_email}
    `
    
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Speaker account already exists' },
        { status: 409 }
      )
    }
    
    // Create new speaker account
    const result = await sql`
      INSERT INTO speaker_accounts (
        speaker_id,
        speaker_name,
        speaker_email,
        is_active,
        email_verified,
        profile_status,
        created_at
      ) VALUES (
        ${speaker_id},
        ${speaker_name},
        ${speaker_email},
        true,
        false,
        'pending',
        CURRENT_TIMESTAMP
      )
      RETURNING id, speaker_email, created_at
    `
    
    return NextResponse.json({
      success: true,
      account: result[0]
    })
  } catch (error) {
    console.error('Error creating speaker account:', error)
    return NextResponse.json(
      { error: 'Failed to create speaker account' },
      { status: 500 }
    )
  }
}
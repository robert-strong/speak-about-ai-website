import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Check if columns already exist
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'speaker_accounts' 
        AND column_name IN ('reset_token', 'reset_token_expires')
    `
    
    if (columns.length === 2) {
      return NextResponse.json({
        success: true,
        message: 'Reset token columns already exist in speaker_accounts table'
      })
    }
    
    // Add reset_token column if it doesn't exist
    if (!columns.find(c => c.column_name === 'reset_token')) {
      await sql`
        ALTER TABLE speaker_accounts 
        ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255)
      `
    }
    
    // Add reset_token_expires column if it doesn't exist
    if (!columns.find(c => c.column_name === 'reset_token_expires')) {
      await sql`
        ALTER TABLE speaker_accounts 
        ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMP
      `
    }
    
    // Verify columns were added
    const verifyColumns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'speaker_accounts' 
        AND column_name IN ('reset_token', 'reset_token_expires')
    `
    
    return NextResponse.json({
      success: true,
      message: 'Successfully added reset token columns to speaker_accounts table',
      columns: verifyColumns
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Failed to add reset token columns', details: String(error) },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Check if column already exists
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'speaker_accounts' 
        AND column_name = 'updated_at'
    `
    
    if (columns.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'updated_at column already exists in speaker_accounts table'
      })
    }
    
    // Add updated_at column
    await sql`
      ALTER TABLE speaker_accounts 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `
    
    // Verify column was added
    const verifyColumn = await sql`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'speaker_accounts' 
        AND column_name = 'updated_at'
    `
    
    return NextResponse.json({
      success: true,
      message: 'Successfully added updated_at column to speaker_accounts table',
      column: verifyColumn[0]
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Failed to add updated_at column', details: String(error) },
      { status: 500 }
    )
  }
}
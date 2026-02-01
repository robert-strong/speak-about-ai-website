import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Create speaker_updates table
    await sql`
      CREATE TABLE IF NOT EXISTS speaker_updates (
        id SERIAL PRIMARY KEY,
        speaker_id INTEGER NOT NULL,
        speaker_name VARCHAR(255),
        speaker_email VARCHAR(255),
        field_name VARCHAR(100),
        old_value TEXT,
        new_value TEXT,
        changed_by VARCHAR(255),
        change_type VARCHAR(50), -- 'update', 'create', 'delete'
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (speaker_id) REFERENCES speakers(id) ON DELETE CASCADE
      )
    `
    
    // Create index for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_speaker_updates_speaker_id 
      ON speaker_updates(speaker_id)
    `
    
    await sql`
      CREATE INDEX IF NOT EXISTS idx_speaker_updates_created_at 
      ON speaker_updates(created_at DESC)
    `
    
    return NextResponse.json({
      success: true,
      message: 'Successfully created speaker_updates table'
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      { error: 'Failed to create speaker_updates table', details: String(error) },
      { status: 500 }
    )
  }
}
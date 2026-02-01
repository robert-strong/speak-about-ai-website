import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Add a sample video for Noah
    const testVideo = [{
      id: 'video-1',
      title: 'Speaking About AI at TechCrunch',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      source: 'YouTube',
      duration: '3:52'
    }]
    
    const result = await sql`
      UPDATE speakers 
      SET videos = ${JSON.stringify(testVideo)}::jsonb
      WHERE name = 'Noah Cheyer'
      RETURNING id, name, videos
    `
    
    // Also log this change
    await sql`
      INSERT INTO speaker_updates (
        speaker_id,
        speaker_name,
        speaker_email,
        field_name,
        old_value,
        new_value,
        changed_by,
        change_type,
        metadata
      ) VALUES (
        85,
        'Noah Cheyer',
        'noah@speakabout.ai',
        'videos',
        '[]',
        ${JSON.stringify(testVideo)},
        'admin_fix',
        'update',
        ${JSON.stringify({ source: 'manual_video_restore' })}
      )
    `
    
    return NextResponse.json({ 
      success: true,
      speaker: result[0]
    })
    
  } catch (error) {
    console.error('Error adding Noah video:', error)
    return NextResponse.json({ 
      error: 'Failed to add Noah video',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
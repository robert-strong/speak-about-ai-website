import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Update Adam Cheyer with programs
    const adam = await sql`
      UPDATE speakers 
      SET programs = '["ChatGPT and The Rise of Conversational AI", "The Future of AI and Businesses", "Hey SIRI: A Founding Story"]'::jsonb
      WHERE name = 'Adam Cheyer'
      RETURNING name, programs
    `
    
    // Update Peter Norvig with programs  
    const peter = await sql`
      UPDATE speakers
      SET programs = '["The Pursuit of Machine Learning", "The Crossroads Between AI and Space", "The Challenge & Promise of Artificial Intelligence"]'::jsonb
      WHERE name = 'Peter Norvig'
      RETURNING name, programs
    `
    
    // Update Gopi Kallayil with programs
    const gopi = await sql`
      UPDATE speakers
      SET programs = '["Conscious Business", "Happy at Work", "The Internet to the Inner-net"]'::jsonb
      WHERE name = 'Gopi Kallayil'
      RETURNING name, programs
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Programs updated successfully',
      updated: {
        adam: adam[0],
        peter: peter[0],
        gopi: gopi[0]
      }
    })
    
  } catch (error) {
    console.error('Error updating programs:', error)
    return NextResponse.json({ 
      error: 'Failed to update programs',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
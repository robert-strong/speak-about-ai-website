import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('test123', 10)
    
    // Update Noah's password
    const result = await sql`
      UPDATE speakers 
      SET password_hash = ${hashedPassword}
      WHERE email = 'noah@speakabout.ai'
      RETURNING id, name, email
    `
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Noah not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Password set to test123',
      speaker: result[0] 
    })
    
  } catch (error) {
    console.error('Error setting password:', error)
    return NextResponse.json({ 
      error: 'Failed to set password',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
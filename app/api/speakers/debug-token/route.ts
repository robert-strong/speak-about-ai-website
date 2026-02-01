import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 400 })
    }
    
    // Verify and decode token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key')
      return NextResponse.json({ 
        success: true,
        decoded,
        message: 'Token is valid'
      })
    } catch (error) {
      return NextResponse.json({ 
        error: 'Invalid token',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 401 })
    }
    
  } catch (error) {
    console.error('Error debugging token:', error)
    return NextResponse.json({ 
      error: 'Failed to debug token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
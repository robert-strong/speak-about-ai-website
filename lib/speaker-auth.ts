import { NextRequest, NextResponse } from 'next/server'
import { getSpeakerIdFromToken } from './auth-middleware'

/**
 * Enhanced speaker authentication that supports both legacy and new tokens
 */
export function authenticateSpeaker(request: NextRequest): { speakerId: number } | NextResponse {
  // Get session token from Authorization header
  const authHeader = request.headers.get('authorization')
  const sessionToken = authHeader?.replace('Bearer ', '')

  if (!sessionToken) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'NO_TOKEN' },
      { status: 401 }
    )
  }

  // Try new JWT token format first
  const newTokenSpeakerId = getSpeakerIdFromToken(sessionToken)
  if (newTokenSpeakerId) {
    return { speakerId: newTokenSpeakerId }
  }

  // Fallback to legacy token parsing for backwards compatibility
  try {
    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8')
    const [type, id, timestamp] = decoded.split(':')
    
    if (type !== 'speaker' || !id) {
      return NextResponse.json(
        { error: 'Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }
    
    const legacySpeakerId = parseInt(id)
    if (isNaN(legacySpeakerId)) {
      return NextResponse.json(
        { error: 'Invalid token format', code: 'INVALID_TOKEN' },
        { status: 401 }
      )
    }
    
    return { speakerId: legacySpeakerId }
  } catch (decodeError) {
    return NextResponse.json(
      { error: 'Invalid session token', code: 'INVALID_TOKEN' },
      { status: 401 }
    )
  }
}
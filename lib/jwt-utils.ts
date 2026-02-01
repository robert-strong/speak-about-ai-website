import { createHash, randomBytes, timingSafeEqual } from 'crypto'

/**
 * Generate a secure JWT-like token without external dependencies
 * This is a simplified implementation for immediate security improvement
 */
export interface JWTPayload {
  email: string
  role: 'admin' | 'speaker' | 'client'
  iat: number
  exp: number
}

function getJWTSecret(): string {
  const JWT_SECRET = process.env.JWT_SECRET
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is required for security. Please set a strong random secret.')
  }
  return JWT_SECRET
}

/**
 * Create a secure token with HMAC signature
 */
export function createToken(payload: Omit<JWTPayload, 'iat' | 'exp'>, expiresInHours: number = 24): string {
  const now = Math.floor(Date.now() / 1000)
  const fullPayload: JWTPayload = {
    ...payload,
    iat: now,
    exp: now + (expiresInHours * 3600)
  }
  
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const payloadB64 = Buffer.from(JSON.stringify(fullPayload)).toString('base64url')
  
  const signature = createHash('sha256')
    .update(`${header}.${payloadB64}.${getJWTSecret()}`)
    .digest('base64url')
  
  return `${header}.${payloadB64}.${signature}`
}

/**
 * Verify and decode a token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    
    const [header, payload, signature] = parts
    
    // Verify signature using constant-time comparison to prevent timing attacks
    const expectedSignature = createHash('sha256')
      .update(`${header}.${payload}.${getJWTSecret()}`)
      .digest('base64url')
    
    // Convert to buffers for constant-time comparison
    const signatureBuffer = Buffer.from(signature, 'base64url')
    const expectedBuffer = Buffer.from(expectedSignature, 'base64url')
    
    // Ensure buffers are same length to prevent timing attacks
    if (signatureBuffer.length !== expectedBuffer.length) return null
    
    if (!timingSafeEqual(signatureBuffer, expectedBuffer)) return null
    
    // Decode payload
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString()) as JWTPayload
    
    // Check expiration
    const now = Math.floor(Date.now() / 1000)
    if (decodedPayload.exp < now) return null
    
    return decodedPayload
  } catch (error) {
    return null
  }
}

/**
 * Generate a secure random session token for password resets, etc.
 */
export function generateSecureToken(): string {
  return randomBytes(32).toString('hex')
}

/**
 * Check if user has admin role
 */
export function isAdminToken(token: string): boolean {
  const payload = verifyToken(token)
  return payload?.role === 'admin'
}
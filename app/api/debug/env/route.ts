import { NextResponse } from 'next/server'

export async function GET() {
  // Check environment variables (safely, without exposing sensitive data)
  const hasDatabase = !!process.env.DATABASE_URL
  const dbUrlLength = process.env.DATABASE_URL?.length || 0
  const nodeEnv = process.env.NODE_ENV
  
  // Check if it starts with postgresql:// (expected for Neon)
  const isValidNeonUrl = process.env.DATABASE_URL?.startsWith('postgresql://') || false
  
  return NextResponse.json({
    environment: {
      NODE_ENV: nodeEnv,
      hasDatabase,
      dbUrlLength,
      isValidNeonUrl,
      // Show first few chars of DATABASE_URL to verify format (safe)
      dbUrlPrefix: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : null
    },
    timestamp: new Date().toISOString(),
    message: hasDatabase 
      ? 'DATABASE_URL is set' 
      : 'DATABASE_URL is NOT set - wishlist features will not work'
  })
}
import { NextResponse } from "next/server"

export async function GET() {
  // This endpoint helps verify environment variables are loaded
  // Only shows whether they exist, not their values
  
  const envStatus = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    vercelEnv: process.env.VERCEL_ENV || 'unknown',
    checks: {
      ADMIN_EMAIL: {
        exists: !!process.env.ADMIN_EMAIL,
        length: process.env.ADMIN_EMAIL?.length || 0,
        preview: process.env.ADMIN_EMAIL ? 
          process.env.ADMIN_EMAIL.substring(0, 5) + '***' : 
          'NOT SET'
      },
      ADMIN_PASSWORD_HASH: {
        exists: !!process.env.ADMIN_PASSWORD_HASH,
        length: process.env.ADMIN_PASSWORD_HASH?.length || 0,
        hasColon: process.env.ADMIN_PASSWORD_HASH?.includes(':') || false,
        format: process.env.ADMIN_PASSWORD_HASH ? 
          (process.env.ADMIN_PASSWORD_HASH.split(':').length === 2 ? 'Valid format' : 'Invalid format') : 
          'NOT SET'
      },
      JWT_SECRET: {
        exists: !!process.env.JWT_SECRET,
        length: process.env.JWT_SECRET?.length || 0
      },
      DATABASE_URL: {
        exists: !!process.env.DATABASE_URL,
        preview: process.env.DATABASE_URL ? 'postgresql://***' : 'NOT SET'
      }
    },
    readiness: {
      canAuthenticate: !!(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD_HASH && process.env.JWT_SECRET),
      missingVars: [
        !process.env.ADMIN_EMAIL && 'ADMIN_EMAIL',
        !process.env.ADMIN_PASSWORD_HASH && 'ADMIN_PASSWORD_HASH',
        !process.env.JWT_SECRET && 'JWT_SECRET'
      ].filter(Boolean)
    }
  }

  return NextResponse.json(envStatus)
}
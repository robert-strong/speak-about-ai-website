import { NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/auth-middleware"

export async function GET(request: Request) {
  // Only allow in development or with admin authentication
  if (process.env.NODE_ENV === 'production') {
    const authError = requireAdminAuth(request as any)
    if (authError) return authError
  }
  
  return NextResponse.json({
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    // Removed sensitive environment variables
    message: "Environment check endpoint - sensitive data removed for security"
  })
}

import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Log what we received
    console.log('[DEBUG] Form submission received:', body)
    
    // Check DATABASE_URL
    const hasDatabase = !!process.env.DATABASE_URL
    
    // Try to process like the server action would
    const debugInfo = {
      received: body,
      hasDatabase,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasResend: !!process.env.RESEND_API_KEY,
      timestamp: new Date().toISOString(),
      headers: {
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
      }
    }
    
    // Try a simple database query if available
    if (hasDatabase) {
      try {
        const { neon } = await import('@neondatabase/serverless')
        const sql = neon(process.env.DATABASE_URL!)
        const result = await sql`SELECT COUNT(*) as count FROM form_submissions`
        debugInfo['dbTest'] = { success: true, count: result[0].count }
      } catch (dbError: any) {
        debugInfo['dbTest'] = { success: false, error: dbError.message }
      }
    }
    
    return NextResponse.json({
      success: true,
      debug: debugInfo
    })
  } catch (error: any) {
    console.error('[DEBUG] Error:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'Debug endpoint ready',
    hasDatabase: !!process.env.DATABASE_URL,
    hasResend: !!process.env.RESEND_API_KEY,
    timestamp: new Date().toISOString()
  })
}
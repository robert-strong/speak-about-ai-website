import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdminAuth } from '@/lib/auth-middleware'

/**
 * Admin-only on-demand cache revalidation: GET /api/revalidate?path=/speakers/foo
 *
 * Accepts the admin session (Bearer token or adminSessionToken cookie), same as
 * /api/revalidate-speaker. This used to be open to anyone, which let any
 * visitor force page regeneration at will.
 */
export async function GET(request: NextRequest) {
  const authError = requireAdminAuth(request)
  if (authError) return authError

  const path = request.nextUrl.searchParams.get('path')

  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return NextResponse.json({ error: 'Missing or invalid path parameter (must be a site-relative path)' }, { status: 400 })
  }

  try {
    revalidatePath(path)
    return NextResponse.json({
      success: true,
      message: `Revalidated: ${path}`,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to revalidate',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { requireAdminAuth } from '@/lib/auth-middleware'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authError = requireAdminAuth(request)
    if (authError) {
      return authError
    }
    
    const body = await request.json()
    const { slug } = body
    
    if (!slug) {
      return NextResponse.json({
        error: 'Speaker slug is required'
      }, { status: 400 })
    }
    
    // Revalidate the specific speaker page
    revalidatePath(`/speakers/${slug}`)
    
    // Also revalidate the speakers list page
    revalidatePath('/speakers')
    
    console.log(`Revalidated speaker page: /speakers/${slug}`)
    
    return NextResponse.json({
      success: true,
      message: `Successfully revalidated /speakers/${slug}`,
      revalidated: [`/speakers/${slug}`, '/speakers']
    })
    
  } catch (error) {
    console.error('Revalidation error:', error)
    return NextResponse.json({
      error: 'Failed to revalidate speaker page',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
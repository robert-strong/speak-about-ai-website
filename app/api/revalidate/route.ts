import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')

  if (!path) {
    return NextResponse.json({ error: 'Missing path parameter' }, { status: 400 })
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

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const adminLoggedIn = cookieStore.get('adminLoggedIn')?.value
    const sessionToken = cookieStore.get('adminSessionToken')?.value

    if (adminLoggedIn === 'true' && sessionToken) {
      return NextResponse.json({ authenticated: true }, { status: 200 })
    } else {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
  } catch (error) {
    console.error('Error checking auth:', error)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}

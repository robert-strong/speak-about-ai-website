import { type NextRequest, NextResponse } from "next/server"
import { validateInvitationToken, acceptInvitation } from "@/lib/client-portal-auth"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ 
        error: "Missing invitation token" 
      }, { status: 400 })
    }

    // Validate the invitation token
    const validation = await validateInvitationToken(token)
    
    if (!validation.valid) {
      return NextResponse.json({ 
        error: "Invalid or expired invitation token" 
      }, { status: 401 })
    }

    return NextResponse.json({
      valid: true,
      project: validation.project,
      clientEmail: validation.clientEmail
    })

  } catch (error) {
    console.error("Error validating invitation:", error)
    return NextResponse.json(
      {
        error: "Failed to validate invitation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ 
        error: "Missing invitation token" 
      }, { status: 400 })
    }

    // Accept the invitation
    const result = await acceptInvitation(token)
    
    if (!result.success) {
      return NextResponse.json({ 
        error: "Failed to accept invitation" 
      }, { status: 400 })
    }

    // Set a cookie with the project token for future requests
    const response = NextResponse.json({
      success: true,
      projectId: result.projectId,
      projectToken: result.projectToken,
      message: "Invitation accepted successfully"
    })

    // Set secure HTTP-only cookie with project access token
    response.cookies.set({
      name: `project_${result.projectId}_token`,
      value: result.projectToken || '',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    })

    return response

  } catch (error) {
    console.error("Error accepting invitation:", error)
    return NextResponse.json(
      {
        error: "Failed to accept invitation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
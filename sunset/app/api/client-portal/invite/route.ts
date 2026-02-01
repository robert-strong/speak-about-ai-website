import { type NextRequest, NextResponse } from "next/server"
import { createClientInvitation } from "@/lib/client-portal-auth"
import { requireAdminAuth } from "@/lib/auth-middleware"
import { getProjectById } from "@/lib/projects-db"
import { sendClientPortalInvite } from "@/lib/email-service-unified"

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { projectId, clientEmail, adminEmail } = body

    if (!projectId || !clientEmail) {
      return NextResponse.json({ 
        error: "Missing required fields: projectId and clientEmail" 
      }, { status: 400 })
    }

    // Get project details
    const project = await getProjectById(projectId)
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Create invitation
    const { token, invitationId } = await createClientInvitation(
      projectId,
      clientEmail,
      adminEmail || 'admin@speakaboutai.com'
    )

    // Send invitation email
    const invitationData = {
      token,
      clientName: project.client_name || 'Valued Client',
      email: clientEmail
    }
    
    try {
      await sendClientPortalInvite(invitationData)
      console.log('✅ Client portal invitation sent to:', clientEmail)
    } catch (emailError) {
      console.error('Error sending invitation email:', emailError)
      // Don't fail the request if email fails
    }
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || `https://${request.headers.get('host')}`
    const invitationUrl = `${baseUrl}/portal/client/accept-invite?token=${token}`

    return NextResponse.json({
      success: true,
      invitationId,
      invitationUrl,
      message: "Invitation created and email sent successfully"
    })

  } catch (error) {
    console.error("Error creating client invitation:", error)
    return NextResponse.json(
      {
        error: "Failed to create invitation",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
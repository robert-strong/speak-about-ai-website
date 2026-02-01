import { NextRequest, NextResponse } from "next/server"
import { createHash } from "crypto"
import { getAllProjects } from "@/lib/projects-db"

// Generate a simple verification code based on email
function generateVerificationCode(email: string): string {
  const hash = createHash('sha256').update(email.toLowerCase() + 'client_salt_2025').digest('hex')
  return hash.substring(0, 6).toUpperCase()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, verificationCode } = body

    // Validate input
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // Get all projects to check if email exists
    const projects = await getAllProjects()
    const clientProjects = projects.filter(project => 
      project.client_email?.toLowerCase() === email.toLowerCase() ||
      project.contact_person?.toLowerCase().includes(email.toLowerCase())
    )

    if (clientProjects.length === 0) {
      return NextResponse.json(
        { error: "No projects found for this email address" },
        { status: 404 }
      )
    }

    // If verification code is provided, validate it
    if (verificationCode) {
      const expectedCode = generateVerificationCode(email)
      if (verificationCode.toUpperCase() !== expectedCode) {
        return NextResponse.json(
          { error: "Invalid verification code" },
          { status: 401 }
        )
      }

      // Generate client session token
      const sessionToken = Buffer.from(`client:${email}:${Date.now()}`).toString('base64')

      // Get client info from first project
      const clientInfo = {
        email: email.toLowerCase(),
        name: clientProjects[0].contact_person || clientProjects[0].client_name,
        company: clientProjects[0].company,
        projectCount: clientProjects.length
      }

      return NextResponse.json({
        success: true,
        user: clientInfo,
        sessionToken,
        projects: clientProjects.map(p => ({
          id: p.id,
          project_name: p.project_name,
          event_date: p.event_date,
          status: p.status,
          event_location: p.event_location
        }))
      })
    } else {
      // Just send verification code (in real app, this would be sent via email)
      const verificationCode = generateVerificationCode(email)
      
      return NextResponse.json({
        requiresVerification: true,
        message: "Verification code generated",
        // In development, return the code. In production, this would be sent via email
        verificationCode: process.env.NODE_ENV === 'development' ? verificationCode : undefined,
        clientInfo: {
          name: clientProjects[0].contact_person || clientProjects[0].client_name,
          company: clientProjects[0].company,
          projectCount: clientProjects.length
        }
      })
    }

  } catch (error) {
    console.error("Client login error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
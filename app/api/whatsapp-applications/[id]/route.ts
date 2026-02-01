import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

// Admin endpoint to update application status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check for admin auth
    const authHeader = request.headers.get('x-admin-request')
    if (authHeader !== 'true') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, admin_notes, rejection_reason, whatsapp_invite_link } = body

    const applicationId = parseInt(params.id)

    if (!action || !['approve', 'reject', 'invite'].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action" },
        { status: 400 }
      )
    }

    let status = 'pending'
    let updateData: any = {
      admin_notes: admin_notes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: 'Admin' // TODO: Get actual admin user
    }

    switch (action) {
      case 'approve':
        status = 'approved'
        break
      case 'reject':
        status = 'rejected'
        updateData.rejection_reason = rejection_reason || null
        break
      case 'invite':
        status = 'invited'
        updateData.whatsapp_invite_sent_at = new Date().toISOString()
        updateData.whatsapp_invite_link = whatsapp_invite_link || null
        break
    }

    updateData.status = status

    // Build UPDATE query dynamically
    const [updatedApplication] = await sql`
      UPDATE whatsapp_applications
      SET
        status = ${updateData.status},
        admin_notes = ${updateData.admin_notes},
        reviewed_at = ${updateData.reviewed_at},
        reviewed_by = ${updateData.reviewed_by},
        rejection_reason = ${updateData.rejection_reason || null},
        whatsapp_invite_sent_at = ${updateData.whatsapp_invite_sent_at || null},
        whatsapp_invite_link = ${updateData.whatsapp_invite_link || null},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${applicationId}
      RETURNING *
    `

    // TODO: Send email notification to applicant based on status

    return NextResponse.json({
      success: true,
      message: `Application ${action}ed successfully`,
      application: updatedApplication
    })

  } catch (error) {
    console.error("Error updating WhatsApp application:", error)
    return NextResponse.json(
      {
        error: "Failed to update application",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// Admin endpoint to get single application
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check for admin auth
    const authHeader = request.headers.get('x-admin-request')
    if (authHeader !== 'true') {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const applicationId = parseInt(params.id)

    const [application] = await sql`
      SELECT * FROM whatsapp_applications
      WHERE id = ${applicationId}
    `

    if (!application) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(application)

  } catch (error) {
    console.error("Error fetching WhatsApp application:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch application",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

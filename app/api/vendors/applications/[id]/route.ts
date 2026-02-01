import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if admin request
    const isAdmin = request.headers.get("x-admin-request") === "true"

    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const applicationId = params.id

    // Fetch the application
    const applications = await sql`
      SELECT
        *,
        (SELECT COUNT(*) FROM vendor_application_notes WHERE application_id = va.id) as notes_count
      FROM vendor_applications va
      WHERE id = ${applicationId}
    `

    if (applications.length === 0) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      application: applications[0]
    })
  } catch (error) {
    console.error("Error fetching application:", error)
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    )
  }
}

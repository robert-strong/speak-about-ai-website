import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    // Map old statuses to new ones
    const statusMapping = {
      "2plus_months": "invoicing",
      "1to2_months": "logistics_planning", 
      "less_than_month": "pre_event",
      "final_week": "event_week",
      "planning": "invoicing",
      "contracts_signed": "invoicing"
    }

    // Update all projects with old status values
    for (const [oldStatus, newStatus] of Object.entries(statusMapping)) {
      await sql`
        UPDATE projects 
        SET status = ${newStatus}
        WHERE status = ${oldStatus}
      `
    }

    // Get updated projects count
    const [result] = await sql`
      SELECT COUNT(*) as count 
      FROM projects 
      WHERE status IN ('invoicing', 'logistics_planning', 'pre_event', 'event_week', 'follow_up', 'completed', 'cancelled')
    `

    return NextResponse.json({ 
      success: true,
      message: "Project statuses migrated successfully",
      projectsUpdated: result.count
    })
  } catch (error) {
    console.error("Error migrating project statuses:", error)
    return NextResponse.json(
      { 
        error: "Failed to migrate project statuses",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
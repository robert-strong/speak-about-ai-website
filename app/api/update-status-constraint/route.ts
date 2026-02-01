import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    console.log("Updating status constraint...")

    // Drop the old constraint
    await sql`ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check`
    console.log("Dropped old constraint")

    // Add new constraint with both old and new status values
    await sql`
      ALTER TABLE projects 
      ADD CONSTRAINT projects_status_check 
      CHECK (status IN (
        -- Legacy statuses (for backward compatibility)
        '2plus_months', '1to2_months', 'less_than_month', 'final_week', 
        'planning', 'contracts_signed',
        -- New workflow statuses
        'invoicing', 'logistics_planning', 'pre_event', 'event_week', 'follow_up',
        -- Final statuses
        'completed', 'cancelled'
      ))
    `
    console.log("Added new constraint with all status values")

    return NextResponse.json({ 
      success: true, 
      message: "Successfully updated status constraint to support new workflow statuses"
    })

  } catch (error) {
    console.error("Constraint update error:", error)
    return NextResponse.json(
      { 
        error: "Failed to update constraint", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
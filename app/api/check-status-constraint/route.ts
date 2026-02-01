import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    // Check constraint definition
    const constraints = await sql`
      SELECT
        conname,
        pg_get_constraintdef(oid) as definition
      FROM pg_constraint
      WHERE conname = 'projects_status_check'
    `

    return NextResponse.json({ 
      constraints: constraints,
      message: "Constraint details fetched"
    })

  } catch (error) {
    console.error("Error checking constraints:", error)
    return NextResponse.json(
      { 
        error: "Failed to check constraints", 
        details: error instanceof Error ? error.message : "Unknown error" 
      },
      { status: 500 }
    )
  }
}
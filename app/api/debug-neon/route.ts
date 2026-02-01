import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

export async function GET(request: Request) {
  // Only allow in development or with admin authentication
  if (process.env.NODE_ENV === 'production') {
    const authError = requireAdminAuth(request as any)
    if (authError) return authError
  }
  try {
    // Check if DATABASE_URL exists
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        {
          success: false,
          error: "DATABASE_URL environment variable is not set",
          details: "The Neon integration may not be properly configured",
        },
        { status: 500 },
      )
    }

    const sql = neon(process.env.DATABASE_URL)

    // Test basic connection
    console.log("Testing database connection...")
    await sql`SELECT 1 as test`
    console.log("Database connection successful")

    // Check if deals table exists
    console.log("Checking if deals table exists...")
    const tableCheck = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'deals'
      ) as table_exists
    `

    const tableExists = tableCheck[0]?.table_exists || false
    console.log("Deals table exists:", tableExists)

    // If table exists, get row count
    let rowCount = 0
    if (tableExists) {
      const countResult = await sql`SELECT COUNT(*) as count FROM deals`
      rowCount = Number.parseInt(countResult[0]?.count || "0")
      console.log("Deals table row count:", rowCount)
    }

    // Get database info
    const dbInfo = await sql`
      SELECT 
        current_database() as database_name,
        current_user as user_name,
        version() as postgres_version
    `

    return NextResponse.json({
      success: true,
      connection: "Connected successfully",
      database: dbInfo[0]?.database_name,
      user: dbInfo[0]?.user_name,
      version: dbInfo[0]?.postgres_version,
      tableExists,
      rowCount,
      message: tableExists
        ? `Deals table exists with ${rowCount} rows`
        : "Deals table does not exist. Run the create-deals-table.sql script.",
    })
  } catch (error) {
    console.error("Database connection error:", error)

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown database error",
        details: "Check your DATABASE_URL and network connectivity",
      },
      { status: 500 },
    )
  }
}

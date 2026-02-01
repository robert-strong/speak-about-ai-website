import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const sql = neon(process.env.DATABASE_URL)
    
    // Check which columns exist in the deals table
    const result = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'deals'
      ORDER BY ordinal_position
    `
    
    // Check if the new columns exist
    const columns = result.map(r => r.column_name)
    const hasNewColumns = {
      lost_reason: columns.includes('lost_reason'),
      lost_details: columns.includes('lost_details'),
      worth_follow_up: columns.includes('worth_follow_up'),
      follow_up_date: columns.includes('follow_up_date'),
      lost_competitor: columns.includes('lost_competitor'),
      lost_next_steps: columns.includes('lost_next_steps'),
      lost_date: columns.includes('lost_date'),
      won_date: columns.includes('won_date'),
      closed_notes: columns.includes('closed_notes')
    }
    
    const allColumnsExist = Object.values(hasNewColumns).every(v => v === true)
    
    return NextResponse.json({
      success: true,
      allColumnsExist,
      columns: result,
      newColumnsStatus: hasNewColumns,
      message: allColumnsExist 
        ? "All new columns exist in the database" 
        : "Some columns are missing. Run the migration: sql/add-lost-deal-columns.sql"
    })
  } catch (error) {
    console.error("Error checking schema:", error)
    return NextResponse.json(
      {
        error: "Failed to check schema",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
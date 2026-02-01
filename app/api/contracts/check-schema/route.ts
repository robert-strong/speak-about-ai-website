import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      )
    }
    
    const sql = neon(process.env.DATABASE_URL)
    
    // Query to get column information about the contracts table
    const columns = await sql`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'contracts'
      ORDER BY ordinal_position
    `
    
    return NextResponse.json({ 
      columns,
      count: columns.length 
    })
  } catch (error: any) {
    console.error("Error checking schema:", error)
    return NextResponse.json(
      { 
        error: "Failed to check schema", 
        details: error.message 
      },
      { status: 500 }
    )
  }
}
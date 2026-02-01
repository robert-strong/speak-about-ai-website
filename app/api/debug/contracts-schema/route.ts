import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest) {
  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      )
    }
    
    const sql = neon(process.env.DATABASE_URL)
    
    // Get all columns in the contracts table
    const columns = await sql`
      SELECT 
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'contracts'
        AND table_schema = 'public'
      ORDER BY ordinal_position
    `
    
    // Get a sample contract to see actual data structure
    let sampleContract = null
    try {
      const sample = await sql`
        SELECT * FROM contracts 
        ORDER BY id DESC 
        LIMIT 1
      `
      if (sample.length > 0) {
        sampleContract = sample[0]
      }
    } catch (e) {
      console.log("No contracts found or error fetching sample")
    }
    
    // Check if the table exists at all
    const tableExists = await sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'contracts'
      )
    `
    
    // Get all tables in the database for context
    const allTables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    return NextResponse.json({ 
      tableExists: tableExists[0].exists,
      columns: columns,
      columnCount: columns.length,
      columnNames: columns.map(c => c.column_name),
      sampleContract: sampleContract,
      allTables: allTables.map(t => t.table_name),
      summary: {
        hasContractsTable: tableExists[0].exists,
        totalColumns: columns.length,
        requiredColumns: columns.filter(c => c.is_nullable === 'NO').map(c => c.column_name),
        optionalColumns: columns.filter(c => c.is_nullable === 'YES').map(c => c.column_name)
      }
    })
  } catch (error: any) {
    console.error("Error checking schema:", error)
    return NextResponse.json(
      { 
        error: "Failed to check schema", 
        details: error.message,
        hint: error.hint || null
      },
      { status: 500 }
    )
  }
}
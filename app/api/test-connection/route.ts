import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  const results = {
    database_url_exists: !!process.env.DATABASE_URL,
    database_connected: false,
    tables: [],
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
      BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
      PORT: process.env.PORT || '3002'
    }
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      ...results,
      error: "DATABASE_URL environment variable not set"
    }, { status: 503 })
  }

  try {
    const sql = neon(process.env.DATABASE_URL)
    
    // Test basic connection
    const testResult = await sql`SELECT 1 as test`
    if (testResult && testResult[0]?.test === 1) {
      results.database_connected = true
    }

    // Get list of tables
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `
    results.tables = tables.map(t => t.tablename)

    // Test specific tables
    const tableTests = {
      deals: false,
      contracts: false,
      projects: false,
      speakers: false,
      analytics_page_views: false
    }

    for (const table of Object.keys(tableTests)) {
      try {
        // Use dynamic query with proper table name handling
        const query = `SELECT COUNT(*) as count FROM "${table}"`
        const result = await sql(query)
        if (result && result[0]) {
          tableTests[table] = true
        }
      } catch (error) {
        console.error(`Table ${table} test failed:`, error)
      }
    }

    return NextResponse.json({
      ...results,
      tableTests,
      status: results.database_connected ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error("Database connection test failed:", error)
    return NextResponse.json({
      ...results,
      error: error instanceof Error ? error.message : "Unknown error",
      status: 'error'
    }, { status: 503 })
  }
}
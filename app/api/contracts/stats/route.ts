import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

export async function GET() {
  try {
    // Initialize database connection
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { 
          total: 0,
          draft: 0,
          sent: 0,
          partially_signed: 0,
          fully_executed: 0,
          total_value: 0
        }
      )
    }
    
    const sql = neon(process.env.DATABASE_URL)
    
    // Get contract statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft,
        COUNT(CASE WHEN status = 'sent' OR status = 'sent_for_signature' THEN 1 END) as sent,
        COUNT(CASE WHEN status = 'partially_signed' THEN 1 END) as partially_signed,
        COUNT(CASE WHEN status = 'fully_executed' THEN 1 END) as fully_executed,
        COALESCE(SUM(
          CASE 
            WHEN financial_terms IS NOT NULL AND financial_terms->>'fee' IS NOT NULL
            THEN (financial_terms->>'fee')::numeric 
            ELSE 0 
          END
        ), 0) as total_value
      FROM contracts
    `
    
    const result = stats[0] || {
      total: 0,
      draft: 0,
      sent: 0,
      partially_signed: 0,
      fully_executed: 0,
      total_value: 0
    }
    
    return NextResponse.json({
      total: parseInt(result.total) || 0,
      draft: parseInt(result.draft) || 0,
      sent: parseInt(result.sent) || 0,
      partially_signed: parseInt(result.partially_signed) || 0,
      fully_executed: parseInt(result.fully_executed) || 0,
      total_value: parseFloat(result.total_value) || 0
    })
  } catch (error) {
    console.error("Error fetching contract stats:", error)
    // Return default stats on error
    return NextResponse.json({
      total: 0,
      draft: 0,
      sent: 0,
      partially_signed: 0,
      fully_executed: 0,
      total_value: 0
    })
  }
}
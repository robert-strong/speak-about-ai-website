import { NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET() {
  try {
    // Get top 4 categories by vendor count
    const topCategories = await sql`
      SELECT 
        c.id,
        c.name,
        c.slug,
        c.icon,
        COUNT(v.id) as vendor_count
      FROM vendor_categories c
      LEFT JOIN vendors v ON v.category_id = c.id AND v.status = 'approved'
      GROUP BY c.id, c.name, c.slug, c.icon
      ORDER BY vendor_count DESC
      LIMIT 4
    `

    return NextResponse.json({ categories: topCategories })
  } catch (error) {
    console.error("Error fetching top categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch top categories" },
      { status: 500 }
    )
  }
}
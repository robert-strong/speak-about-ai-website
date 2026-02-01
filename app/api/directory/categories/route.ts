import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const isAdmin = request.headers.get("x-admin-request") === "true"
    
    // Get all categories (active only for non-admin)
    const categories = await sql`
      SELECT 
        c.*,
        COUNT(v.id) as vendor_count
      FROM vendor_categories c
      LEFT JOIN vendors v ON v.category_id = c.id
      ${!isAdmin ? sql`WHERE c.is_active = true` : sql``}
      GROUP BY c.id
      ORDER BY c.display_order, c.name
    `
    
    return NextResponse.json({
      categories,
      total: categories.length
    })
  } catch (error) {
    console.error("Error fetching categories:", error)
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = request.headers.get("x-admin-request") === "true"
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { name, slug, description, icon, display_order, is_active } = body
    
    if (!name || !slug) {
      return NextResponse.json(
        { error: "Name and slug are required" },
        { status: 400 }
      )
    }
    
    const result = await sql`
      INSERT INTO vendor_categories (
        name, slug, description, icon, display_order, is_active
      ) VALUES (
        ${name}, ${slug}, ${description || null}, ${icon || null}, 
        ${display_order || 0}, ${is_active !== false}
      )
      RETURNING *
    `
    
    return NextResponse.json({
      category: result[0],
      success: true
    })
  } catch (error) {
    console.error("Error creating category:", error)
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    )
  }
}
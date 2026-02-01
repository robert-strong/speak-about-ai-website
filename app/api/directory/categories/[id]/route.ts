import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    const result = await sql`
      UPDATE vendor_categories
      SET 
        name = ${name},
        slug = ${slug},
        description = ${description || null},
        icon = ${icon || null},
        display_order = ${display_order || 0},
        is_active = ${is_active},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${params.id}
      RETURNING *
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      category: result[0],
      success: true
    })
  } catch (error) {
    console.error("Error updating category:", error)
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const isAdmin = request.headers.get("x-admin-request") === "true"
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    // Check if category has vendors
    const vendorCheck = await sql`
      SELECT COUNT(*) as count FROM vendors WHERE category_id = ${params.id}
    `
    
    if (vendorCheck[0].count > 0) {
      return NextResponse.json(
        { error: "Cannot delete category with existing vendors" },
        { status: 400 }
      )
    }
    
    const result = await sql`
      DELETE FROM vendor_categories
      WHERE id = ${params.id}
      RETURNING id
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: "Category not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      deleted: true
    })
  } catch (error) {
    console.error("Error deleting category:", error)
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    )
  }
}
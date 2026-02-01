import { NextRequest, NextResponse } from "next/server"
import { getVendorCategories } from "@/lib/vendors-db"

export async function GET(request: NextRequest) {
  try {
    console.log("Testing vendor database connection...")
    
    // Test fetching categories
    const categories = await getVendorCategories()
    
    return NextResponse.json({
      success: true,
      categoriesCount: categories.length,
      categories: categories.map(c => ({ id: c.id, name: c.name, slug: c.slug })),
      message: "Database connection successful"
    })
  } catch (error) {
    console.error("Test failed:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        message: "Database connection failed"
      },
      { status: 500 }
    )
  }
}
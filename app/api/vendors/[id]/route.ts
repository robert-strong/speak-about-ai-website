import { NextRequest, NextResponse } from "next/server"
import { 
  getVendorById,
  updateVendor,
  deleteVendor
} from "@/lib/vendors-db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const vendor = await getVendorById(parseInt((await params).id))
    
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ vendor })
  } catch (error) {
    console.error("Error fetching vendor:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin authentication
    const isAdmin = request.headers.get("x-admin-request") === "true"
    if (!isAdmin) {
      console.error("Unauthorized PUT request to vendor:", (await params).id)
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    console.log("Updating vendor", (await params).id, "with data:", JSON.stringify(body, null, 2))
    
    // Generate slug if company name changed
    if (body.company_name && !body.slug) {
      body.slug = body.company_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }
    
    const vendor = await updateVendor(parseInt((await params).id), body)
    console.log("Vendor updated successfully:", vendor.id)
    
    return NextResponse.json({ vendor })
  } catch (error) {
    console.error("Error updating vendor:", (await params).id, error)
    console.error("Error details:", error instanceof Error ? error.message : error)
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update vendor" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check for admin authentication
    const isAdmin = request.headers.get("x-admin-request") === "true"
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    await deleteVendor(parseInt((await params).id))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting vendor:", error)
    return NextResponse.json(
      { error: "Failed to delete vendor" },
      { status: 500 }
    )
  }
}
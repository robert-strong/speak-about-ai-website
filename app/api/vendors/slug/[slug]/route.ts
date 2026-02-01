import { NextRequest, NextResponse } from "next/server"
import { getVendorBySlug } from "@/lib/vendors-db"

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const vendor = await getVendorBySlug(params.slug)
    
    if (!vendor) {
      return NextResponse.json(
        { error: "Vendor not found" },
        { status: 404 }
      )
    }
    
    // Only return approved vendors to public
    if (vendor.status !== "approved") {
      const isAdmin = request.headers.get("x-admin-request") === "true"
      if (!isAdmin) {
        return NextResponse.json(
          { error: "Vendor not found" },
          { status: 404 }
        )
      }
    }
    
    return NextResponse.json({ vendor })
  } catch (error) {
    console.error("Error fetching vendor by slug:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendor" },
      { status: 500 }
    )
  }
}
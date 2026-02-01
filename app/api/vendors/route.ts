import { NextRequest, NextResponse } from "next/server"
import { 
  getApprovedVendors, 
  getAllVendors, 
  createVendor,
  getVendorCategories 
} from "@/lib/vendors-db"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeAll = searchParams.get("all") === "true"
    const includeCategories = searchParams.get("categories") === "true"
    
    // Check if admin request
    const isAdmin = request.headers.get("x-admin-request") === "true"
    
    if (includeCategories) {
      const categories = await getVendorCategories()
      return NextResponse.json({ categories })
    }
    
    // Get vendors based on access level
    const vendors = (includeAll && isAdmin) ? await getAllVendors() : await getApprovedVendors()
    
    // Apply filters if provided
    const category = searchParams.get("category")
    const search = searchParams.get("search")
    const location = searchParams.get("location")
    const featured = searchParams.get("featured")
    const verified = searchParams.get("verified")
    
    let filteredVendors = vendors
    
    if (category) {
      filteredVendors = filteredVendors.filter(v => v.category?.slug === category)
    }
    
    if (search) {
      const searchLower = search.toLowerCase()
      filteredVendors = filteredVendors.filter(v => 
        v.company_name.toLowerCase().includes(searchLower) ||
        v.description?.toLowerCase().includes(searchLower) ||
        v.services?.some(s => s.toLowerCase().includes(searchLower)) ||
        v.tags?.some(t => t.toLowerCase().includes(searchLower))
      )
    }
    
    if (location) {
      const locationLower = location.toLowerCase()
      filteredVendors = filteredVendors.filter(v => 
        v.location?.toLowerCase().includes(locationLower)
      )
    }
    
    if (featured === "true") {
      filteredVendors = filteredVendors.filter(v => v.featured)
    }
    
    if (verified === "true") {
      filteredVendors = filteredVendors.filter(v => v.verified)
    }
    
    return NextResponse.json({ 
      vendors: filteredVendors,
      total: filteredVendors.length
    })
  } catch (error) {
    console.error("Error fetching vendors:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendors" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check for admin authentication
    const isAdmin = request.headers.get("x-admin-request") === "true"
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    
    // Generate slug from company name if not provided
    if (!body.slug && body.company_name) {
      body.slug = body.company_name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
    }
    
    const vendor = await createVendor(body)
    
    return NextResponse.json({ vendor })
  } catch (error) {
    console.error("Error creating vendor:", error)
    return NextResponse.json(
      { error: "Failed to create vendor" },
      { status: 500 }
    )
  }
}
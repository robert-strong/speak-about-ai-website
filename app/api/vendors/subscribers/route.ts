import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    // Check if admin request
    const isAdmin = request.headers.get("x-admin-request") === "true"
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search") || ""

    // Build query with proper template literals
    let subscribers
    
    if (status !== "all" && search) {
      subscribers = await sql`
        SELECT 
          id,
          email,
          name,
          company,
          phone,
          access_level,
          subscription_status,
          last_login,
          login_count,
          created_at,
          updated_at
        FROM directory_subscribers
        WHERE subscription_status = ${status}
        AND (
          email ILIKE '%' || ${search} || '%' OR
          name ILIKE '%' || ${search} || '%' OR
          company ILIKE '%' || ${search} || '%'
        )
        ORDER BY created_at DESC
      `
    } else if (status !== "all") {
      subscribers = await sql`
        SELECT 
          id,
          email,
          name,
          company,
          phone,
          access_level,
          subscription_status,
          last_login,
          login_count,
          created_at,
          updated_at
        FROM directory_subscribers
        WHERE subscription_status = ${status}
        ORDER BY created_at DESC
      `
    } else if (search) {
      subscribers = await sql`
        SELECT 
          id,
          email,
          name,
          company,
          phone,
          access_level,
          subscription_status,
          last_login,
          login_count,
          created_at,
          updated_at
        FROM directory_subscribers
        WHERE (
          email ILIKE '%' || ${search} || '%' OR
          name ILIKE '%' || ${search} || '%' OR
          company ILIKE '%' || ${search} || '%'
        )
        ORDER BY created_at DESC
      `
    } else {
      subscribers = await sql`
        SELECT 
          id,
          email,
          name,
          company,
          phone,
          access_level,
          subscription_status,
          last_login,
          login_count,
          created_at,
          updated_at
        FROM directory_subscribers
        ORDER BY created_at DESC
      `
    }

    // Get statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE subscription_status = 'active') as active,
        COUNT(*) FILTER (WHERE subscription_status = 'inactive') as inactive,
        COUNT(*) FILTER (WHERE last_login IS NOT NULL) as has_logged_in,
        COUNT(*) FILTER (WHERE access_level = 'premium') as premium,
        COUNT(*) FILTER (WHERE access_level = 'vendor') as vendor_level
      FROM directory_subscribers
    `

    return NextResponse.json({
      subscribers,
      stats: stats[0],
      total: subscribers.length
    })
  } catch (error) {
    console.error("Error fetching subscribers:", error)
    return NextResponse.json(
      { error: "Failed to fetch subscribers" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const isAdmin = request.headers.get("x-admin-request") === "true"
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id, updates } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "Subscriber ID is required" },
        { status: 400 }
      )
    }

    const allowedFields = [
      'name', 'company', 'phone', 'access_level', 
      'subscription_status', 'preferences'
    ]

    // Build update object
    const updateData: any = {}
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field]
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update" },
        { status: 400 }
      )
    }

    // Use template literal for update
    const result = await sql`
      UPDATE directory_subscribers
      SET 
        name = COALESCE(${updateData.name}, name),
        company = COALESCE(${updateData.company}, company),
        phone = COALESCE(${updateData.phone}, phone),
        access_level = COALESCE(${updateData.access_level}, access_level),
        subscription_status = COALESCE(${updateData.subscription_status}, subscription_status),
        preferences = COALESCE(${updateData.preferences}, preferences),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      subscriber: result[0]
    })
  } catch (error) {
    console.error("Error updating subscriber:", error)
    return NextResponse.json(
      { error: "Failed to update subscriber" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isAdmin = request.headers.get("x-admin-request") === "true"
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { error: "Subscriber ID is required" },
        { status: 400 }
      )
    }

    await sql`
      DELETE FROM directory_subscribers
      WHERE id = ${id}
    `

    return NextResponse.json({
      success: true,
      message: "Subscriber deleted successfully"
    })
  } catch (error) {
    console.error("Error deleting subscriber:", error)
    return NextResponse.json(
      { error: "Failed to delete subscriber" },
      { status: 500 }
    )
  }
}
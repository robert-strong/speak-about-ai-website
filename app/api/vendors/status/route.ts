import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const getSQL = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL not set")
  }
  return neon(process.env.DATABASE_URL)
}

export async function GET(request: NextRequest) {
  try {
    const sql = getSQL()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "pending"
    const limit = parseInt(searchParams.get("limit") || "20")
    const offset = parseInt(searchParams.get("offset") || "0")
    
    const vendors = await sql`
      SELECT 
        v.id,
        v.company_name,
        v.slug,
        v.contact_name,
        v.contact_email,
        v.contact_phone,
        v.website,
        v.description,
        v.location,
        v.status,
        v.created_at,
        v.updated_at,
        v.approved_at,
        v.approved_by,
        vc.name as category_name,
        (
          SELECT COUNT(*) 
          FROM vendors 
          WHERE status = ${status}
        ) as total_count
      FROM vendors v
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      WHERE v.status = ${status}
      ORDER BY v.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `
    
    const stats = await sql`
      SELECT 
        status,
        COUNT(*) as count,
        MIN(created_at) as oldest_submission,
        MAX(created_at) as newest_submission
      FROM vendors
      GROUP BY status
    `
    
    const statsMap = stats.reduce((acc: any, stat: any) => {
      acc[stat.status] = {
        count: parseInt(stat.count),
        oldest: stat.oldest_submission,
        newest: stat.newest_submission
      }
      return acc
    }, {})
    
    return NextResponse.json({
      vendors,
      total: vendors[0]?.total_count || 0,
      stats: statsMap,
      pagination: {
        limit,
        offset,
        hasMore: (vendors[0]?.total_count || 0) > offset + limit
      }
    })
  } catch (error) {
    console.error("Error fetching vendor statuses:", error)
    return NextResponse.json(
      { error: "Failed to fetch vendor statuses" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const sql = getSQL()
    const body = await request.json()
    const { vendorIds, status, reviewNote, reviewerEmail } = body
    
    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid vendor IDs" },
        { status: 400 }
      )
    }
    
    if (!["pending", "approved", "rejected", "suspended"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }
    
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }
    
    if (status === "approved") {
      updateData.approved_at = new Date().toISOString()
      updateData.approved_by = reviewerEmail || "system"
    }
    
    const updated = await sql`
      UPDATE vendors
      SET 
        status = ${status},
        updated_at = CURRENT_TIMESTAMP,
        approved_at = ${status === "approved" ? sql`CURRENT_TIMESTAMP` : sql`approved_at`},
        approved_by = ${status === "approved" ? (reviewerEmail || "system") : sql`approved_by`}
      WHERE id = ANY(${vendorIds})
      RETURNING id, company_name, status
    `
    
    if (reviewNote && reviewerEmail) {
      for (const vendorId of vendorIds) {
        await sql`
          INSERT INTO audit_log (
            entity_type,
            entity_id,
            action,
            details,
            user_email,
            created_at
          ) VALUES (
            'vendor',
            ${vendorId},
            'status_change',
            ${JSON.stringify({ 
              new_status: status, 
              note: reviewNote,
              bulk_update: vendorIds.length > 1
            })},
            ${reviewerEmail},
            CURRENT_TIMESTAMP
          )
        `
      }
    }
    
    return NextResponse.json({
      success: true,
      updated: updated.length,
      vendors: updated
    })
  } catch (error) {
    console.error("Error updating vendor statuses:", error)
    return NextResponse.json(
      { error: "Failed to update vendor statuses" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const sql = getSQL()
    const body = await request.json()
    const { vendorId, action, data } = body
    
    if (!vendorId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    switch (action) {
      case "request_info":
        const emailSent = await sql`
          INSERT INTO email_notifications (
            recipient_email,
            recipient_name,
            subject,
            template_id,
            template_data,
            status,
            created_at
          )
          SELECT 
            contact_email,
            contact_name,
            'Additional Information Required for Vendor Application',
            'vendor_info_request',
            ${JSON.stringify({
              company_name: data.company_name,
              missing_fields: data.missing_fields,
              message: data.message
            })},
            'pending',
            CURRENT_TIMESTAMP
          FROM vendors
          WHERE id = ${vendorId}
          RETURNING id
        `
        
        await sql`
          UPDATE vendors
          SET 
            status = 'pending',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${vendorId}
        `
        
        return NextResponse.json({
          success: true,
          message: "Information request sent"
        })
        
      case "quick_approve":
        const approved = await sql`
          UPDATE vendors
          SET 
            status = 'approved',
            approved_at = CURRENT_TIMESTAMP,
            approved_by = ${data.reviewer || 'quick_review'},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${vendorId}
          RETURNING id, company_name
        `
        
        return NextResponse.json({
          success: true,
          vendor: approved[0]
        })
        
      case "quick_reject":
        const rejected = await sql`
          UPDATE vendors
          SET 
            status = 'rejected',
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${vendorId}
          RETURNING id, company_name
        `
        
        if (data.reason) {
          await sql`
            INSERT INTO audit_log (
              entity_type,
              entity_id,
              action,
              details,
              user_email,
              created_at
            ) VALUES (
              'vendor',
              ${vendorId},
              'rejected',
              ${JSON.stringify({ reason: data.reason })},
              ${data.reviewer || 'system'},
              CURRENT_TIMESTAMP
            )
          `
        }
        
        return NextResponse.json({
          success: true,
          vendor: rejected[0]
        })
        
      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Error processing vendor action:", error)
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 }
    )
  }
}
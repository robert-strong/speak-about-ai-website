import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import jwt from "jsonwebtoken"

const sql = neon(process.env.DATABASE_URL!)
const JWT_SECRET = process.env.JWT_SECRET || "vendor-secret-key-change-in-production"

// Verify vendor authentication
async function verifyVendor(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null
  }

  const token = authHeader.substring(7)
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any
    return decoded
  } catch {
    return null
  }
}

// Track changes for changelog
async function trackChange(vendorId: number, field: string, oldValue: any, newValue: any, changedBy: string) {
  await sql`
    INSERT INTO vendor_changelog (
      vendor_id,
      field_name,
      old_value,
      new_value,
      changed_by,
      changed_at
    ) VALUES (
      ${vendorId},
      ${field},
      ${JSON.stringify(oldValue)},
      ${JSON.stringify(newValue)},
      ${changedBy},
      CURRENT_TIMESTAMP
    )
  `
}

export async function GET(request: NextRequest) {
  try {
    const vendor = await verifyVendor(request)
    if (!vendor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get full vendor profile with related data
    const profile = await sql`
      SELECT 
        v.*,
        vc.name as category_name,
        vcomp.compliance_score,
        vcomp.insurance_verified,
        vcomp.license_verified,
        vcomp.insurance_expiry,
        vcomp.license_expiry,
        vperf.average_rating,
        vperf.total_reviews,
        vperf.total_events,
        vperf.performance_tier,
        vonb.completion_percentage as onboarding_progress,
        vonb.current_status as onboarding_status,
        (
          SELECT COUNT(*) 
          FROM vendor_documents 
          WHERE vendor_id = v.id 
          AND status = 'pending'
        ) as pending_documents,
        (
          SELECT json_agg(
            json_build_object(
              'id', id,
              'type', document_type,
              'name', document_name,
              'status', status,
              'uploaded_at', uploaded_at
            )
          )
          FROM vendor_documents
          WHERE vendor_id = v.id
          ORDER BY uploaded_at DESC
          LIMIT 10
        ) as recent_documents
      FROM vendors v
      LEFT JOIN vendor_categories vc ON v.category_id = vc.id
      LEFT JOIN vendor_compliance vcomp ON vcomp.vendor_id = v.id
      LEFT JOIN vendor_performance vperf ON vperf.vendor_id = v.id
      LEFT JOIN vendor_onboarding vonb ON vonb.vendor_id = v.id
      WHERE v.id = ${vendor.vendorId}
    `

    if (profile.length === 0) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    // Get recent activity
    const recentActivity = await sql`
      SELECT * FROM vendor_activity
      WHERE vendor_id = ${vendor.vendorId}
      ORDER BY created_at DESC
      LIMIT 20
    `

    // Get changelog
    const changelog = await sql`
      SELECT * FROM vendor_changelog
      WHERE vendor_id = ${vendor.vendorId}
      ORDER BY changed_at DESC
      LIMIT 50
    `

    return NextResponse.json({
      profile: profile[0],
      activity: recentActivity,
      changelog
    })
  } catch (error) {
    console.error("Error fetching vendor profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const vendor = await verifyVendor(request)
    if (!vendor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const updates = await request.json()
    
    // Get current vendor data for changelog
    const current = await sql`
      SELECT * FROM vendors
      WHERE id = ${vendor.vendorId}
    `

    if (current.length === 0) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 })
    }

    const currentData = current[0]
    const allowedFields = [
      'company_name', 'contact_name', 'contact_phone', 'website',
      'description', 'services', 'specialties', 'location',
      'pricing_range', 'minimum_budget', 'team_size',
      'years_in_business', 'social_media', 'tags'
    ]

    // Track changes
    const changes: any[] = []
    for (const field of allowedFields) {
      if (updates[field] !== undefined && updates[field] !== currentData[field]) {
        changes.push({
          field,
          oldValue: currentData[field],
          newValue: updates[field]
        })
      }
    }

    if (changes.length === 0) {
      return NextResponse.json({
        message: "No changes detected",
        vendor: currentData
      })
    }

    // Update vendor profile
    const updateQuery = `
      UPDATE vendors SET
        ${changes.map((c, i) => `${c.field} = $${i + 2}`).join(', ')},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `

    const values = [vendor.vendorId, ...changes.map(c => c.newValue)]
    const updated = await sql(updateQuery, values)

    // Log all changes to changelog
    for (const change of changes) {
      await trackChange(
        vendor.vendorId,
        change.field,
        change.oldValue,
        change.newValue,
        vendor.email
      )
    }

    // Log activity
    await sql`
      INSERT INTO vendor_activity (
        vendor_id, activity_type, description, metadata, created_by
      ) VALUES (
        ${vendor.vendorId},
        'profile_updated',
        'Profile information updated',
        ${JSON.stringify({ fields: changes.map(c => c.field) })},
        ${vendor.email}
      )
    `

    return NextResponse.json({
      success: true,
      vendor: updated[0],
      changes: changes.length
    })
  } catch (error) {
    console.error("Error updating vendor profile:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const vendor = await verifyVendor(request)
    if (!vendor) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { action, data } = await request.json()

    switch (action) {
      case "upload_document": {
        const result = await sql`
          INSERT INTO vendor_documents (
            vendor_id, document_type, document_name,
            file_url, file_size, mime_type, status
          ) VALUES (
            ${vendor.vendorId},
            ${data.document_type},
            ${data.document_name},
            ${data.file_url},
            ${data.file_size},
            ${data.mime_type},
            'pending'
          )
          RETURNING *
        `

        await sql`
          INSERT INTO vendor_activity (
            vendor_id, activity_type, description, created_by
          ) VALUES (
            ${vendor.vendorId},
            'document_uploaded',
            ${`Uploaded ${data.document_type}: ${data.document_name}`},
            ${vendor.email}
          )
        `

        return NextResponse.json({
          success: true,
          document: result[0]
        })
      }

      case "update_compliance": {
        const complianceFields = [
          'insurance_verified', 'insurance_expiry', 'license_verified',
          'license_number', 'license_expiry', 'tax_id_verified'
        ]

        // Get current compliance data
        const current = await sql`
          SELECT * FROM vendor_compliance
          WHERE vendor_id = ${vendor.vendorId}
        `

        const currentData = current[0] || {}

        // Track compliance changes
        for (const field of complianceFields) {
          if (data[field] !== undefined && data[field] !== currentData[field]) {
            await trackChange(
              vendor.vendorId,
              `compliance.${field}`,
              currentData[field],
              data[field],
              vendor.email
            )
          }
        }

        // Update compliance
        await sql`
          INSERT INTO vendor_compliance (
            vendor_id, insurance_verified, insurance_expiry,
            license_verified, license_number, license_expiry,
            tax_id_verified, last_review_date
          ) VALUES (
            ${vendor.vendorId},
            ${data.insurance_verified || false},
            ${data.insurance_expiry},
            ${data.license_verified || false},
            ${data.license_number},
            ${data.license_expiry},
            ${data.tax_id_verified || false},
            CURRENT_DATE
          )
          ON CONFLICT (vendor_id) DO UPDATE SET
            insurance_verified = EXCLUDED.insurance_verified,
            insurance_expiry = EXCLUDED.insurance_expiry,
            license_verified = EXCLUDED.license_verified,
            license_number = EXCLUDED.license_number,
            license_expiry = EXCLUDED.license_expiry,
            tax_id_verified = EXCLUDED.tax_id_verified,
            last_review_date = EXCLUDED.last_review_date
        `

        return NextResponse.json({
          success: true,
          message: "Compliance information updated"
        })
      }

      case "request_support": {
        await sql`
          INSERT INTO vendor_communications (
            vendor_id, communication_type, subject, content, status
          ) VALUES (
            ${vendor.vendorId},
            'support_request',
            ${data.subject},
            ${data.message},
            'pending'
          )
        `

        await sql`
          INSERT INTO vendor_activity (
            vendor_id, activity_type, description, created_by
          ) VALUES (
            ${vendor.vendorId},
            'support_requested',
            ${`Support request: ${data.subject}`},
            ${vendor.email}
          )
        `

        return NextResponse.json({
          success: true,
          message: "Support request submitted"
        })
      }

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error("Error processing vendor request:", error)
    return NextResponse.json(
      { error: "Request failed" },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Check if admin request
    const isAdmin = request.headers.get("x-admin-request") === "true"
    if (!isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Starting migration of approved applications to vendors...")

    // Find all approved applications that haven't been converted yet
    const approvedApplications = await sql`
      SELECT *
      FROM vendor_applications
      WHERE application_status = 'approved'
        AND (
          application_metadata->>'vendor_id' IS NULL
          OR application_metadata = '{}'::jsonb
          OR application_metadata IS NULL
        )
    `

    console.log(`Found ${approvedApplications.length} approved applications to convert`)

    const results = {
      total: approvedApplications.length,
      succeeded: 0,
      failed: 0,
      errors: [] as any[]
    }

    // Convert each application to a vendor
    for (const application of approvedApplications) {
      try {
        console.log(`Converting application ${application.id}: ${application.company_name}`)

        // Generate slug from company name
        const slug = application.company_name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '')

        // Determine pricing range from budget
        let pricingRange = '$'
        if (application.budget_minimum >= 75000) pricingRange = '$$$$'
        else if (application.budget_minimum >= 25000) pricingRange = '$$$'
        else if (application.budget_minimum >= 5000) pricingRange = '$$'

        // Check if vendor with this slug already exists
        const existingVendor = await sql`
          SELECT id FROM vendors WHERE slug = ${slug}
        `

        let finalSlug = slug
        if (existingVendor.length > 0) {
          // Add application ID to make it unique
          finalSlug = `${slug}-${application.id}`
          console.log(`Slug ${slug} already exists, using ${finalSlug}`)
        }

        // Ensure proper types
        const yearsInBusiness = typeof application.years_in_business === 'string'
          ? parseInt(application.years_in_business)
          : application.years_in_business

        const minimumBudget = typeof application.budget_minimum === 'string'
          ? parseFloat(application.budget_minimum)
          : application.budget_minimum

        // Insert into vendors table
        const vendorResult = await sql`
          INSERT INTO vendors (
            company_name,
            contact_name,
            contact_email,
            contact_phone,
            website,
            description,
            location,
            services,
            pricing_range,
            minimum_budget,
            years_in_business,
            tags,
            logo_url,
            status,
            approved_at,
            approved_by,
            slug
          ) VALUES (
            ${application.company_name},
            ${application.primary_contact_name},
            ${application.business_email},
            ${application.business_phone},
            ${application.company_website},
            ${application.business_description},
            ${application.headquarters_location},
            ${sql.array(application.secondary_services || [])},
            ${pricingRange},
            ${minimumBudget},
            ${yearsInBusiness},
            ${sql.array(application.languages || [])},
            ${application.logo_url || null},
            'approved',
            NOW(),
            ${application.reviewed_by || 'admin'},
            ${finalSlug}
          )
          RETURNING id
        `

        const newVendorId = vendorResult[0].id
        console.log(`✓ Created vendor with ID: ${newVendorId}`)

        // Update application metadata with vendor ID
        await sql`
          UPDATE vendor_applications
          SET application_metadata =
            COALESCE(application_metadata, '{}'::jsonb) ||
            jsonb_build_object(
              'vendor_id', ${newVendorId},
              'converted_at', NOW(),
              'migrated', true
            )
          WHERE id = ${application.id}
        `

        results.succeeded++
      } catch (error: any) {
        console.error(`✗ Failed to convert application ${application.id}:`, error)
        results.failed++
        results.errors.push({
          applicationId: application.id,
          companyName: application.company_name,
          error: error.message
        })
      }
    }

    console.log("Migration complete!")
    console.log(`Succeeded: ${results.succeeded}, Failed: ${results.failed}`)

    return NextResponse.json({
      success: true,
      message: "Migration completed",
      results
    })
  } catch (error: any) {
    console.error("Error during migration:", error)
    return NextResponse.json(
      { error: "Migration failed", details: error.message },
      { status: 500 }
    )
  }
}

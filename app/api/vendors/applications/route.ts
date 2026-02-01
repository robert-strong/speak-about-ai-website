import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { Resend } from "resend"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

// Lazy initialize Resend to avoid build-time errors
let resend: Resend | null = null
function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY)
  }
  return resend
}

export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    const authError = requireAdminAuth(request)
    if (authError) {
      return authError
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "all"
    const search = searchParams.get("search") || ""

    let applications
    
    if (status !== "all" && search) {
      applications = await sql`
        SELECT 
          *,
          (SELECT COUNT(*) FROM vendor_application_notes WHERE application_id = va.id) as notes_count
        FROM vendor_applications va
        WHERE application_status = ${status}
        AND (
          company_name ILIKE '%' || ${search} || '%' OR
          primary_contact_name ILIKE '%' || ${search} || '%' OR
          business_email ILIKE '%' || ${search} || '%'
        )
        ORDER BY created_at DESC
      `
    } else if (status !== "all") {
      applications = await sql`
        SELECT 
          *,
          (SELECT COUNT(*) FROM vendor_application_notes WHERE application_id = va.id) as notes_count
        FROM vendor_applications va
        WHERE application_status = ${status}
        ORDER BY created_at DESC
      `
    } else if (search) {
      applications = await sql`
        SELECT 
          *,
          (SELECT COUNT(*) FROM vendor_application_notes WHERE application_id = va.id) as notes_count
        FROM vendor_applications va
        WHERE 
          company_name ILIKE '%' || ${search} || '%' OR
          primary_contact_name ILIKE '%' || ${search} || '%' OR
          business_email ILIKE '%' || ${search} || '%'
        ORDER BY created_at DESC
      `
    } else {
      applications = await sql`
        SELECT 
          *,
          (SELECT COUNT(*) FROM vendor_application_notes WHERE application_id = va.id) as notes_count
        FROM vendor_applications va
        ORDER BY created_at DESC
      `
    }

    // Get statistics
    const stats = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE application_status = 'pending') as pending,
        COUNT(*) FILTER (WHERE application_status = 'under_review') as under_review,
        COUNT(*) FILTER (WHERE application_status = 'approved') as approved,
        COUNT(*) FILTER (WHERE application_status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE application_status = 'needs_info') as needs_info,
        AVG(CASE 
          WHEN application_status = 'approved' AND reviewed_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (reviewed_at - created_at)) / 86400
          ELSE NULL
        END) as avg_review_time_days
      FROM vendor_applications
    `

    return NextResponse.json({
      applications,
      stats: stats[0],
      total: applications.length
    })
  } catch (error) {
    console.error("Error fetching applications:", error)
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = [
      'email', 'company_name', 'primary_contact_name', 'primary_contact_role',
      'business_email', 'business_phone', 'company_website', 'years_in_business',
      'business_description', 'primary_category', 'headquarters_location',
      'specific_regions', 'budget_minimum', 'budget_maximum', 'portfolio_link'
    ]
    
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }
    
    // Get IP and user agent
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip")
    const userAgent = request.headers.get("user-agent")
    
    // Insert application
    const result = await sql`
      INSERT INTO vendor_applications (
        email,
        company_name,
        primary_contact_name,
        primary_contact_role,
        primary_contact_linkedin,
        business_email,
        business_phone,
        company_website,
        years_in_business,
        business_description,
        primary_category,
        secondary_services,
        specialty_capabilities,
        event_types,
        average_event_size,
        headquarters_location,
        service_areas,
        specific_regions,
        travel_fees_applicable,
        travel_fee_policy,
        budget_minimum,
        budget_maximum,
        pricing_structure,
        payment_terms,
        portfolio_link,
        awards_recognition,
        review_links,
        typical_lead_time,
        works_with_vendors,
        preferred_partners,
        languages,
        accessibility_accommodations,
        pricing_range,
        team_size,
        why_join,
        certifications,
        testimonials,
        logo_url,
        submission_ip,
        user_agent
      ) VALUES (
        ${body.email},
        ${body.company_name},
        ${body.primary_contact_name},
        ${body.primary_contact_role},
        ${body.primary_contact_linkedin || null},
        ${body.business_email},
        ${body.business_phone},
        ${body.company_website},
        ${body.years_in_business},
        ${body.business_description},
        ${body.primary_category},
        ${body.secondary_services || []},
        ${body.specialty_capabilities || null},
        ${body.event_types || []},
        ${body.average_event_size || null},
        ${body.headquarters_location},
        ${body.service_areas || []},
        ${body.specific_regions},
        ${body.travel_fees_applicable || false},
        ${body.travel_fee_policy || null},
        ${body.budget_minimum},
        ${body.budget_maximum},
        ${body.pricing_structure || []},
        ${body.payment_terms || null},
        ${body.portfolio_link},
        ${body.awards_recognition || null},
        ${body.review_links || null},
        ${body.typical_lead_time || null},
        ${body.works_with_vendors || false},
        ${body.preferred_partners || null},
        ${body.languages || []},
        ${body.accessibility_accommodations || null},
        ${body.pricing_range || null},
        ${body.team_size || null},
        ${body.why_join || null},
        ${body.certifications || null},
        ${body.testimonials || null},
        ${body.logo_url || null},
        ${ip},
        ${userAgent}
      )
      RETURNING id, company_name, business_email
    `
    
    // Send confirmation email to applicant
    try {
      await getResend().emails.send({
        from: 'Vendor Applications <vendors@speakaboutai.com>',
        to: body.business_email,
        subject: 'Application Received - Vendor Directory',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Thank You for Your Application!</h2>
            <p>Dear ${body.primary_contact_name},</p>
            <p>We have received your vendor directory application for <strong>${body.company_name}</strong>.</p>
            <p>Our team will review your application within 2-3 business days. You will receive an email notification once a decision has been made.</p>
            <h3>Application Summary:</h3>
            <ul>
              <li><strong>Company:</strong> ${body.company_name}</li>
              <li><strong>Category:</strong> ${body.primary_category}</li>
              <li><strong>Location:</strong> ${body.headquarters_location}</li>
              <li><strong>Application ID:</strong> #${result[0].id}</li>
            </ul>
            <p>If you have any questions in the meantime, please don't hesitate to contact us.</p>
            <p>Best regards,<br>The Vendor Directory Team</p>
          </div>
        `
      })
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError)
    }
    
    // Send notification to admin
    try {
      await getResend().emails.send({
        from: 'Vendor Applications <vendors@speakaboutai.com>',
        to: 'admin@speakaboutai.com',
        subject: `New Vendor Application: ${body.company_name}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>New Vendor Application Received</h2>
            <h3>Company Information:</h3>
            <ul>
              <li><strong>Company:</strong> ${body.company_name}</li>
              <li><strong>Contact:</strong> ${body.primary_contact_name} (${body.primary_contact_role})</li>
              <li><strong>Email:</strong> ${body.business_email}</li>
              <li><strong>Phone:</strong> ${body.business_phone}</li>
              <li><strong>Website:</strong> ${body.company_website}</li>
              <li><strong>Category:</strong> ${body.primary_category}</li>
              <li><strong>Location:</strong> ${body.headquarters_location}</li>
              <li><strong>Budget Range:</strong> $${body.budget_minimum} - $${body.budget_maximum}</li>
            </ul>
            <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/admin/vendors/applications/${result[0].id}" style="background: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Review Application</a></p>
          </div>
        `
      })
    } catch (emailError) {
      console.error("Failed to send admin notification:", emailError)
    }
    
    return NextResponse.json({
      success: true,
      applicationId: result[0].id,
      message: "Application submitted successfully"
    })
  } catch (error) {
    console.error("Error submitting application:", error)
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Check for admin authentication
    const authError = requireAdminAuth(request)
    if (authError) {
      return authError
    }
    
    const { id, status, notes, reviewerEmail } = await request.json()
    
    if (!id || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }
    
    // Update application status
    const result = await sql`
      UPDATE vendor_applications
      SET 
        application_status = ${status},
        review_notes = ${notes || null},
        reviewed_by = ${reviewerEmail || 'admin'},
        reviewed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *
    `
    
    if (result.length === 0) {
      return NextResponse.json(
        { error: "Application not found" },
        { status: 404 }
      )
    }
    
    const application = result[0]
    
    // Add review note
    if (notes) {
      await sql`
        INSERT INTO vendor_application_notes (
          application_id,
          note_type,
          note_text,
          created_by
        ) VALUES (
          ${id},
          'review',
          ${notes},
          ${reviewerEmail || 'admin'}
        )
      `
    }
    
    // Send status email to applicant
    let emailSubject = ""
    let emailContent = ""
    
    switch (status) {
      case "approved":
        emailSubject = "Your Vendor Application Has Been Approved!"
        emailContent = `
          <p>Congratulations! Your application for ${application.company_name} has been approved.</p>
          <p>You will receive your login credentials in a separate email shortly.</p>
        `
        
        // Convert to vendor - use SQL approach to handle arrays properly
        try {
          console.log(`Converting application ${id} to vendor...`)

          // Use raw SQL to insert vendor directly from application data
          // This avoids JavaScript array conversion issues with Neon client
          const vendorResult = await sql`
            WITH new_vendor AS (
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
              )
              SELECT
                company_name,
                primary_contact_name,
                business_email,
                business_phone,
                company_website,
                business_description,
                headquarters_location,
                COALESCE(secondary_services, ARRAY[]::text[]),
                CASE
                  WHEN budget_minimum < 5000 THEN '$'
                  WHEN budget_minimum < 25000 THEN '$$'
                  WHEN budget_minimum < 75000 THEN '$$$'
                  ELSE '$$$$'
                END,
                budget_minimum,
                years_in_business,
                COALESCE(languages, ARRAY[]::text[]),
                logo_url,
                'approved',
                NOW(),
                ${reviewerEmail || 'admin'},
                CASE
                  WHEN EXISTS (
                    SELECT 1 FROM vendors v2
                    WHERE v2.slug = LOWER(REGEXP_REPLACE(va.company_name, '[^a-zA-Z0-9]+', '-', 'g'))
                  )
                  THEN LOWER(REGEXP_REPLACE(va.company_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || va.id::text
                  ELSE LOWER(REGEXP_REPLACE(va.company_name, '[^a-zA-Z0-9]+', '-', 'g'))
                END
              FROM vendor_applications va
              WHERE va.id = ${id}
              RETURNING id, company_name
            )
            SELECT id FROM new_vendor
          `

          const newVendorId = vendorResult[0].id
          console.log(`Successfully created vendor with ID: ${newVendorId}`)

          // Update application metadata with vendor ID
          await sql`
            UPDATE vendor_applications
            SET application_metadata =
              COALESCE(application_metadata, '{}'::jsonb) ||
              jsonb_build_object(
                'vendor_id', ${newVendorId},
                'converted_at', NOW()
              )
            WHERE id = ${id}
          `

        } catch (conversionError) {
          console.error("Failed to convert application to vendor:", conversionError)
          // Don't fail the entire request, but log the error
          // The application is still marked as approved
        }
        break
        
      case "rejected":
        emailSubject = "Update on Your Vendor Application"
        emailContent = `
          <p>Thank you for your interest in joining our vendor directory.</p>
          <p>After careful review, we have decided not to proceed with your application at this time.</p>
          ${notes ? `<p><strong>Feedback:</strong> ${notes}</p>` : ''}
        `
        break
        
      case "needs_info":
        emailSubject = "Additional Information Required for Your Application"
        emailContent = `
          <p>We're reviewing your application for ${application.company_name}.</p>
          <p>We need some additional information to proceed:</p>
          ${notes ? `<p><strong>Required Information:</strong> ${notes}</p>` : ''}
          <p>Please reply to this email with the requested information.</p>
        `
        break
    }
    
    if (emailSubject && ["approved", "rejected", "needs_info"].includes(status)) {
      try {
        await getResend().emails.send({
          from: 'Vendor Applications <vendors@speakaboutai.com>',
          to: application.business_email,
          subject: emailSubject,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>${emailSubject}</h2>
              <p>Dear ${application.primary_contact_name},</p>
              ${emailContent}
              <p>Best regards,<br>The Vendor Directory Team</p>
            </div>
          `
        })
      } catch (emailError) {
        console.error("Failed to send status email:", emailError)
      }
    }
    
    return NextResponse.json({
      success: true,
      application: result[0]
    })
  } catch (error) {
    console.error("Error updating application:", error)
    return NextResponse.json(
      { error: "Failed to update application" },
      { status: 500 }
    )
  }
}
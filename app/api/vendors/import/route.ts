import { NextRequest, NextResponse } from "next/server"
import { createVendor, getVendorCategories } from "@/lib/vendors-db"
import { neon } from "@neondatabase/serverless"

interface VendorSpreadsheetRow {
  "Email Address": string
  "Company Name": string
  "Primary Contact Name": string
  "Primary Contact Role": string
  "Primary Contact LinkedIn Profile": string
  "Business Email (must be a company domain)": string
  "Business Phone Number": string
  "Company Website URL": string
  "Years in Business": string
  "Describe your business in 1-2 sentences.": string
  "Primary Vendor Category": string
  "Secondary Services Offered": string
  "Specialty Capabilities or Certifications (e.g., sustainable practices, minority-owned, specific equipment)": string
  "Typical Event Types Served": string
  "Average Event Size You Handle (number of attendees)": string
  "Headquarters Location (City, State/Province, Country)": string
  "Service Areas": string
  "Specific Cities/Regions Covered": string
  "Are travel fees applicable?": string
  "Travel Fee General Policy (if applicable)": string
  "Typical Project Budget Range (Minimum)": string
  "Typical Project Budget Range (Maximum)": string
  "Pricing Structure": string
  "Payment Terms (Deposit requirements, net terms)": string
  "Link to Portfolio or Case Studies": string
  "Awards or Industry Recognition": string
  "Links to Google Reviews or other platform ratings (e.g., Yelp, WeddingWire)": string
  "Typical Lead Time Required for Your Services": string
  "Do you work with other vendors? (e.g., preferred partner list, collaborations)": string
  "Preferred Partner List (if applicable)": string
  "Languages Spoken by Your Team": string
  "Accessibility Accommodations Offered (e.g., accessible venues, sign language interpreters, sensory-friendly options)": string
}

function parseCSVRow(row: any): VendorSpreadsheetRow {
  return row
}

function determinePricingRange(min: string, max: string): string {
  const minBudget = parseInt(min?.replace(/[^0-9]/g, '') || '0')
  const maxBudget = parseInt(max?.replace(/[^0-9]/g, '') || '0')
  
  if (maxBudget < 5000) return "$"
  if (maxBudget < 25000) return "$$"
  if (maxBudget < 100000) return "$$$"
  return "$$$$"
}

function determineTeamSize(yearsInBusiness: string): string {
  // This is a placeholder - you might want to add a team size field to your spreadsheet
  const years = parseInt(yearsInBusiness || '0')
  if (years < 2) return "1-10"
  if (years < 5) return "11-50"
  if (years < 10) return "51-200"
  return "200+"
}

function mapCategoryName(categoryName: string, categories: any[]): number | null {
  // Map spreadsheet category names to database categories
  const categoryMap: { [key: string]: string } = {
    "Event Technology": "event-technology",
    "AV": "event-technology",
    "Audio Visual": "event-technology",
    "Production": "event-production",
    "Event Production": "event-production",
    "Venues": "venues-spaces",
    "Venue": "venues-spaces",
    "Spaces": "venues-spaces",
    "Catering": "catering-fb",
    "Food & Beverage": "catering-fb",
    "F&B": "catering-fb",
    "Marketing": "marketing-pr",
    "PR": "marketing-pr",
    "Public Relations": "marketing-pr",
    "Staffing": "staffing-talent",
    "Talent": "staffing-talent",
    "Design": "design-creative",
    "Creative": "design-creative",
    "Transportation": "transportation",
    "Transport": "transportation",
    "Logistics": "transportation",
    "Photography": "photography-video",
    "Video": "photography-video",
    "Videography": "photography-video",
    "Swag": "swag-printing",
    "Printing": "swag-printing",
    "Promotional": "swag-printing"
  }
  
  const normalizedCategory = categoryName?.trim()
  for (const [key, value] of Object.entries(categoryMap)) {
    if (normalizedCategory?.toLowerCase().includes(key.toLowerCase())) {
      const category = categories.find(c => c.slug === value)
      if (category) return category.id
    }
  }
  
  // Default to first category if no match
  return categories[0]?.id || null
}

export async function POST(request: NextRequest) {
  try {
    console.log("Vendor import API called")
    
    // Get database connection
    const sql = neon(process.env.DATABASE_URL!)
    
    // Check for admin authentication
    const isAdmin = request.headers.get("x-admin-request") === "true"
    if (!isAdmin) {
      console.log("Unauthorized import attempt")
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const { data, autoApprove = false } = body
    
    console.log(`Processing import with ${data?.length || 0} rows, autoApprove: ${autoApprove}`)
    
    if (!data || !Array.isArray(data)) {
      return NextResponse.json(
        { error: "Invalid data format. Expected array of vendor records." },
        { status: 400 }
      )
    }
    
    // Get categories for mapping
    console.log("Fetching vendor categories...")
    let categories = []
    try {
      categories = await getVendorCategories()
      console.log(`Found ${categories.length} categories`)
    } catch (catError) {
      console.error("Error fetching categories:", catError)
      return NextResponse.json(
        { error: "Failed to fetch vendor categories. Please ensure database tables are created." },
        { status: 500 }
      )
    }
    
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as any[],
      skippedRows: [] as any[]
    }
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      let vendorData: any = null // Define vendorData in outer scope
      
      try {
        // Skip empty rows - check both possible email field names (form might have different format)
        const businessEmail = row["Business Email (must be a company domain)"] || 
                            row["Business Email"] || 
                            row["Email"] || 
                            row["Email Address"]
        const companyName = row["Company Name"] || row["Company"]
        
        if (!companyName || !businessEmail) {
          console.log(`Skipping row ${i + 1}: Missing company name (${companyName}) or email (${businessEmail})`)
          results.skipped++
          results.skippedRows.push({
            row: i + 1,
            reason: !companyName ? "Missing company name" : "Missing business email",
            data: { companyName, businessEmail }
          })
          continue
        }
        
        console.log(`Processing row ${i + 1}: ${companyName}`)
        
        // Check if vendor already exists
        const existingCheck = await sql`
          SELECT id FROM vendors 
          WHERE LOWER(company_name) = LOWER(${companyName})
          LIMIT 1
        `
        
        if (existingCheck.length > 0) {
          console.log(`Skipping row ${i + 1}: ${companyName} already exists`)
          results.skipped++
          results.skippedRows.push({
            row: i + 1,
            reason: "Company already exists in database",
            data: { companyName, existingId: existingCheck[0].id }
          })
          continue
        }
        
        // Parse services from secondary services field
        const services: string[] = []
        if (row["Primary Vendor Category"]) {
          services.push(row["Primary Vendor Category"])
        }
        if (row["Secondary Services Offered"]) {
          services.push(...row["Secondary Services Offered"].split(/[,;]/).map((s: string) => s.trim()).filter(Boolean))
        }
        
        // Parse specialties and certifications
        const specialties = row["Specialty Capabilities or Certifications (e.g., sustainable practices, minority-owned, specific equipment)"]
          ?.split(/[,;]/)
          .map((s: string) => s.trim())
          .filter(Boolean) || []
        
        // Parse tags from various fields
        const tags: string[] = []
        if (row["Typical Event Types Served"]) {
          tags.push(...row["Typical Event Types Served"].split(/[,;]/).map((s: string) => s.trim()).filter(Boolean))
        }
        if (row["Languages Spoken by Your Team"]) {
          tags.push(...row["Languages Spoken by Your Team"].split(/[,;]/).map((s: string) => s.trim()).filter(Boolean))
        }
        
        // Build social media object - ensure it's valid JSON
        const socialMedia: any = {}
        if (row["Primary Contact LinkedIn Profile"] && row["Primary Contact LinkedIn Profile"].trim()) {
          socialMedia.linkedin = row["Primary Contact LinkedIn Profile"].trim()
        }
        
        // Build portfolio items - ensure valid JSON array
        const portfolioItems: any[] = []
        if (row["Link to Portfolio or Case Studies"] && row["Link to Portfolio or Case Studies"].trim()) {
          portfolioItems.push({
            title: "Portfolio",
            link: row["Link to Portfolio or Case Studies"].trim()
          })
        }
        if (row["Links to Google Reviews or other platform ratings (e.g., Yelp, WeddingWire)"] && 
            row["Links to Google Reviews or other platform ratings (e.g., Yelp, WeddingWire)"].trim()) {
          portfolioItems.push({
            title: "Reviews",
            link: row["Links to Google Reviews or other platform ratings (e.g., Yelp, WeddingWire)"].trim()
          })
        }
        
        // Build additional info for JSONB fields - filter out undefined/null values
        const additionalInfo: any = {}
        const fields = {
          contactRole: row["Primary Contact Role"],
          eventSize: row["Average Event Size You Handle (number of attendees)"],
          serviceAreas: row["Service Areas"],
          citiesRegions: row["Specific Cities/Regions Covered"],
          travelFees: row["Are travel fees applicable?"],
          travelPolicy: row["Travel Fee General Policy (if applicable)"],
          budgetMin: row["Typical Project Budget Range (Minimum)"],
          budgetMax: row["Typical Project Budget Range (Maximum)"],
          pricingStructure: row["Pricing Structure"],
          paymentTerms: row["Payment Terms (Deposit requirements, net terms)"],
          awards: row["Awards or Industry Recognition"],
          leadTime: row["Typical Lead Time Required for Your Services"],
          vendorCollaborations: row["Do you work with other vendors? (e.g., preferred partner list, collaborations)"],
          preferredPartners: row["Preferred Partner List (if applicable)"],
          accessibility: row["Accessibility Accommodations Offered (e.g., accessible venues, sign language interpreters, sensory-friendly options)"]
        }
        
        // Only add non-empty values to avoid JSON parsing issues
        for (const [key, value] of Object.entries(fields)) {
          if (value && value.toString().trim()) {
            additionalInfo[key] = value.toString().trim()
          }
        }
        
        // Generate slug from company name
        const baseSlug = companyName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
        
        // Check if slug exists and make it unique
        let uniqueSlug = baseSlug
        let slugCounter = 1
        while (true) {
          const slugCheck = await sql`
            SELECT id FROM vendors WHERE slug = ${uniqueSlug} LIMIT 1
          `
          if (slugCheck.length === 0) break
          uniqueSlug = `${baseSlug}-${slugCounter}`
          slugCounter++
        }
        
        // Create vendor object with proper JSON serialization
        vendorData = {
          company_name: companyName,
          slug: uniqueSlug,
          category_id: mapCategoryName(row["Primary Vendor Category"], categories),
          contact_name: row["Primary Contact Name"] || null,
          contact_email: businessEmail,
          contact_phone: row["Business Phone Number"] || null,
          website: row["Company Website URL"] || null,
          description: row["Describe your business in 1-2 sentences."] || null,
          services: services.length > 0 ? services : [],
          specialties: specialties.length > 0 ? specialties : [],
          pricing_range: determinePricingRange(
            row["Typical Project Budget Range (Minimum)"],
            row["Typical Project Budget Range (Maximum)"]
          ),
          minimum_budget: parseInt(row["Typical Project Budget Range (Minimum)"]?.replace(/[^0-9]/g, '') || '0') || null,
          location: row["Headquarters Location (City, State/Province, Country)"] || null,
          years_in_business: parseInt(row["Years in Business"] || '0') || null,
          team_size: determineTeamSize(row["Years in Business"]),
          certifications: specialties.length > 0 ? specialties : [],
          featured: false,
          verified: false,
          status: autoApprove ? "approved" : "pending",
          tags: tags.length > 0 ? tags : [],
          social_media: Object.keys(socialMedia).length > 0 ? socialMedia : {},
          portfolio_items: portfolioItems.length > 0 ? portfolioItems : [],
          client_references: Object.keys(additionalInfo).length > 0 ? additionalInfo : {}
        }
        
        // Create vendor
        await createVendor(vendorData)
        results.success++
        
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error)
        console.error(`Vendor data:`, JSON.stringify(vendorData, null, 2))
        results.failed++
        
        // Provide more specific error messages
        let errorMessage = "Unknown error"
        if (error instanceof Error) {
          if (error.message.includes('invalid input syntax for type json')) {
            errorMessage = "Invalid JSON data in one of the fields. Check special characters."
          } else if (error.message.includes('duplicate key')) {
            errorMessage = "A vendor with similar details already exists"
          } else {
            errorMessage = error.message
          }
        }
        
        results.errors.push({
          row: i + 1,
          company: row["Company Name"] || row["Company"] || `Row ${i + 1}`,
          error: errorMessage
        })
      }
    }
    
    console.log("Import summary:", {
      total: data.length,
      success: results.success,
      failed: results.failed,
      skipped: results.skipped
    })
    
    return NextResponse.json({
      message: `Import completed. Success: ${results.success}, Failed: ${results.failed}, Skipped: ${results.skipped}`,
      results
    })
    
  } catch (error) {
    console.error("Error importing vendors:", error)
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred"
    console.error("Full error details:", errorMessage)
    
    return NextResponse.json(
      { 
        error: "Failed to import vendors",
        details: errorMessage
      },
      { status: 500 }
    )
  }
}
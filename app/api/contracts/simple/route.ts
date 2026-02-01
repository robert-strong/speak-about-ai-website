import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"

// Generate contract number
function generateContractNumber(): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `CTR-${date}-${random}`
}

// Generate secure token
function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log("Simple contract creation - body:", JSON.stringify(body, null, 2))
    
    // Check database availability
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database not configured" },
        { status: 503 }
      )
    }
    
    const sql = neon(process.env.DATABASE_URL)
    
    // Extract values from the template data
    const values = body.values || {}
    const contractNumber = generateContractNumber()
    
    console.log("Inserting contract with number:", contractNumber)
    
    try {
      // Based on the errors, we know these columns DON'T exist in production:
      // - category, template_version, terms, total_amount
      // - access_token, client_signing_token, speaker_signing_token
      
      // Start with the absolute minimum that should work
      let result
      
      try {
        // Insert with the actual database structure including required type field
        result = await sql`
          INSERT INTO contracts (
            contract_number,
            title,
            type,
            status,
            event_title,
            event_date,
            event_location,
            client_name,
            client_email,
            client_company,
            speaker_name,
            speaker_email,
            speaker_fee,
            fee_amount,
            payment_terms,
            description,
            contract_data,
            generated_at
          ) VALUES (
            ${contractNumber},
            ${values.event_title ? `Contract - ${values.event_title}` : 'Contract Draft'},
            ${body.type || 'client_speaker'},
            'draft',
            ${values.event_title || 'Event'},
            ${values.event_date || new Date().toISOString().split('T')[0]},
            ${values.event_location || 'TBD'},
            ${values.client_signer_name || values.client_contact_name || values.client_company || 'Client'},
            ${values.client_email || 'client@example.com'},
            ${values.client_company || null},
            ${values.speaker_name || null},
            ${values.speaker_email || null},
            ${parseFloat(values.speaker_fee) || null},
            ${parseFloat(values.speaker_fee) || null},
            ${values.payment_terms || 'Net 30 days'},
            ${values.event_description || null},
            ${JSON.stringify(values)}::jsonb,
            NOW()
          )
          RETURNING *
        `
        console.log("Successfully inserted contract with full data")
      } catch (firstError: any) {
        console.error("Insert failed:", firstError.message)
        throw firstError
      }
      
      console.log("Contract created successfully:", result[0])
      
      // Store the contract data in a separate JSON field or related table if needed
      // This ensures we don't lose any form data even if columns don't exist
      
      return NextResponse.json({
        ...result[0],
        contract_data: values  // Include the full form data in response
      }, { status: 201 })
    } catch (dbError: any) {
      console.error("Database error:", dbError)
      return NextResponse.json(
        { 
          error: "Database error", 
          details: dbError.message,
          code: dbError.code,
          hint: dbError.hint
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error("Error in simple contract creation:", error)
    return NextResponse.json(
      { 
        error: "Failed to create contract", 
        details: error.message 
      },
      { status: 500 }
    )
  }
}
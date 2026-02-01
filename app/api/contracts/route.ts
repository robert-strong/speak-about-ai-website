import { type NextRequest, NextResponse } from "next/server"
import { getAllContracts, createContractFromDeal, updateContractStatus } from "@/lib/contracts-db"
import { getDealById, type Deal } from "@/lib/deals-db"
import { requireAdminAuth } from "@/lib/auth-middleware"
import { generateContractContent } from "@/lib/contract-template"
import { sendSpeakerContractEmail, sendClientContractEmail } from "@/lib/email-service"

export async function GET(request: NextRequest) {
  try {
    // Skip auth for now to match the simple localStorage pattern used elsewhere
    // TODO: Implement proper JWT auth across all admin APIs
    // const authError = requireAdminAuth(request)
    // if (authError) return authError

    const contracts = await getAllContracts()
    return NextResponse.json(contracts)
  } catch (error) {
    console.error("Error in GET /api/contracts:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch contracts",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Skip auth for now to match the simple localStorage pattern used elsewhere
    // TODO: Implement proper JWT auth across all admin APIs
    // const authError = requireAdminAuth(request)
    // if (authError) {
    //   console.log("Auth error in contracts POST:", authError)
    //   return authError
    // }
    
    const body = await request.json()
    console.log("Contract POST request body:", JSON.stringify(body, null, 2))
    
    // Check if this is a preview request
    const { searchParams } = new URL(request.url)
    const isPreview = searchParams.get("preview") === "true"
    
    if (isPreview) {
      // Handle preview request
      if (!body.deal_id) {
        return NextResponse.json({ error: "deal_id is required" }, { status: 400 })
      }

      const deal = await getDealById(body.deal_id)
      if (!deal) {
        return NextResponse.json({ error: "Deal not found" }, { status: 404 })
      }

      // Build contract data with all required fields
      const contractData = {
        ...deal,
        contract_number: `CNT-${new Date().getFullYear()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
        speaker_name: body.speaker_info?.name || deal.speaker_requested || 'To be determined',
        speaker_email: body.speaker_info?.email || '',
        speaker_fee: parseFloat(body.speaker_info?.fee) || (typeof deal.deal_value === 'string' ? parseFloat(deal.deal_value) : deal.deal_value) || 0,
        payment_terms: body.payment_terms || "Net 30 days after event completion",
        additional_terms: body.additional_terms || '',
        deal_value: typeof deal.deal_value === 'string' ? parseFloat(deal.deal_value) || 0 : deal.deal_value
      }

      // Generate contract content
      let contractContent
      try {
        contractContent = generateContractContent(contractData)
      } catch (genError) {
        console.error("Error generating contract content:", genError)
        return NextResponse.json(
          {
            error: "Failed to generate contract content",
            details: genError instanceof Error ? genError.message : "Unknown error",
          },
          { status: 500 }
        )
      }

      const formattedContent = contractContent + `
---

**Contract Status:** DRAFT - Not yet sent for signatures`

      return NextResponse.json({ 
        content: formattedContent,
        metadata: {
          template: deal.event_type === "virtual" ? "virtual" : "in-person",
          deal_value: contractData.speaker_fee || contractData.deal_value,
          event_date: deal.event_date,
          speaker_name: contractData.speaker_name
        }
      })
    }

    // Handle template-based contract creation
    if (body.template_id && body.values) {
      console.log("Processing template-based contract creation")
      console.log("Template ID:", body.template_id)
      console.log("Values:", body.values)
      
      // This is a contract created from a template
      const contractData = {
        ...body.values,
        template_id: body.template_id,
        type: body.type || 'client_speaker',
        category: body.category || 'external',
        title: body.title || `Contract - ${body.values.event_title || 'Draft'}`,
        status: body.status || 'draft'
      }

      // Create a deal-like object from the template data with proper defaults
      const dealData: Deal = {
        id: body.deal_id || 0,
        client_name: contractData.client_contact_name || contractData.client_signer_name || 'Client Name',
        client_email: contractData.client_email || 'client@example.com',
        client_phone: contractData.client_phone || '',
        company: contractData.client_company || 'Client Company',
        event_title: contractData.event_title || 'Event',
        event_date: contractData.event_date || new Date().toISOString().split('T')[0],
        event_location: contractData.event_location || 'TBD',
        event_type: contractData.event_type || 'conference',
        speaker_requested: contractData.speaker_name || 'TBD',
        attendee_count: parseInt(contractData.attendee_count) || 0,
        budget_range: '$10,000-$25,000',
        deal_value: parseFloat(contractData.speaker_fee) || 0,
        status: 'won' as const,
        priority: 'medium' as const,
        source: 'manual',
        notes: contractData.additional_requirements || '',
        created_at: new Date().toISOString(),
        last_contact: new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
        travel_required: contractData.travel_required || false,
        flight_required: contractData.flight_required || false,
        hotel_required: contractData.hotel_required || false,
        travel_stipend: parseFloat(contractData.travel_stipend) || 0,
        travel_notes: contractData.travel_notes || ''
      }

      console.log("Created dealData:", dealData)

      const speakerInfo = contractData.speaker_name ? {
        name: contractData.speaker_name,
        email: contractData.speaker_email || '',
        fee: parseFloat(contractData.speaker_fee) || 0
      } : undefined

      const clientSignerInfo = {
        name: contractData.client_signer_name || contractData.client_contact_name || dealData.client_name,
        email: contractData.client_email || dealData.client_email
      }

      console.log("Speaker info:", speakerInfo)
      console.log("Client signer info:", clientSignerInfo)

      const contract = await createContractFromDeal(
        dealData,
        speakerInfo,
        contractData.additional_terms || contractData.additional_requirements,
        body.created_by || 'admin',
        clientSignerInfo
      )

      if (!contract) {
        return NextResponse.json({ error: "Failed to create contract" }, { status: 500 })
      }

      // Send for signature if requested
      if (body.send_for_signature) {
        await updateContractStatus(contract.id, 'sent')
      }

      return NextResponse.json(contract, { status: 201 })
    }

    // Original deal-based contract creation
    if (!body.deal_id) {
      return NextResponse.json({ error: "deal_id is required for deal-based contracts" }, { status: 400 })
    }

    // Get the deal information
    const deal = await getDealById(body.deal_id)
    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    // Check if deal is in won status
    if (deal.status !== 'won') {
      return NextResponse.json(
        { error: "Can only create contracts for won deals" }, 
        { status: 400 }
      )
    }

    // Extract speaker information and additional terms from body
    const speakerInfo = body.speaker_info ? {
      name: body.speaker_info.name,
      email: body.speaker_info.email,
      fee: body.speaker_info.fee
    } : undefined
    
    // Extract client signer information
    const clientSignerInfo = body.client_signer_info ? {
      name: body.client_signer_info.name,
      email: body.client_signer_info.email
    } : {
      name: deal.client_name,
      email: deal.client_email
    }

    const contract = await createContractFromDeal(
      deal,
      speakerInfo,
      body.additional_terms,
      body.created_by || 'admin',
      clientSignerInfo
    )

    if (!contract) {
      return NextResponse.json({ error: "Failed to create contract" }, { status: 500 })
    }
    
    // Send contract emails to both parties
    try {
      // Send to speaker
      if (contract.speaker_email && contract.speaker_signing_token) {
        await sendSpeakerContractEmail({
          speakerEmail: contract.speaker_email,
          speakerName: contract.speaker_name || 'Speaker',
          contractNumber: contract.contract_number,
          eventTitle: contract.event_title,
          eventDate: contract.event_date,
          eventLocation: contract.event_location,
          speakerFee: contract.speaker_fee || contract.total_amount,
          contractId: contract.id,
          signingToken: contract.speaker_signing_token
        })
      }
      
      // Send to client
      if (contract.client_signer_email && contract.client_signing_token) {
        const ccEmails = contract.client_signer_email !== contract.client_email ? [contract.client_email] : []
        
        await sendClientContractEmail({
          signerEmail: contract.client_signer_email,
          signerName: contract.client_signer_name || contract.client_name,
          clientCompany: contract.client_company || '',
          speakerName: contract.speaker_name || 'Speaker',
          contractNumber: contract.contract_number,
          eventTitle: contract.event_title,
          eventDate: contract.event_date,
          eventLocation: contract.event_location,
          totalAmount: contract.total_amount,
          contractId: contract.id,
          signingToken: contract.client_signing_token,
          ccEmails
        })
      }
      
      // Update contract status to 'sent'
      await updateContractStatus(contract.id, 'sent')
    } catch (emailError) {
      console.error("Failed to send contract emails:", emailError)
      // Don't fail the contract creation, but log the error
    }

    return NextResponse.json(contract, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/contracts:", error)
    return NextResponse.json(
      {
        error: "Failed to create contract",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { ProposalView } from "../[token]/proposal-view"

function ProposalPreviewContent() {
  const searchParams = useSearchParams()
  const dataParam = searchParams.get("data")
  
  if (!dataParam) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">No proposal data provided</p>
      </div>
    )
  }
  
  try {
    // Try to decode the URI component, but handle malformed URIs gracefully
    let decodedData: string
    try {
      decodedData = decodeURIComponent(dataParam)
    } catch (decodeError) {
      // If decoding fails, try using the raw parameter
      console.warn("Failed to decode URI, using raw data:", decodeError)
      decodedData = dataParam
    }
    
    const proposalData = JSON.parse(decodedData)
    
    // Transform the preview data to match the expected format
    const proposal = {
      id: 0,
      proposal_number: "PREVIEW",
      title: proposalData.title || "Proposal Preview",
      client_name: proposalData.client_name,
      client_email: proposalData.client_email,
      client_company: proposalData.client_company,
      client_title: proposalData.client_title,
      executive_summary: proposalData.executive_summary,
      event_title: proposalData.event_title,
      event_date: proposalData.event_date,
      event_location: proposalData.event_location,
      event_type: proposalData.event_type,
      event_format: proposalData.event_format,
      attendee_count: proposalData.attendee_count,
      event_description: proposalData.event_description,
      speakers: proposalData.speakers || [],
      services: proposalData.services || [],
      deliverables: proposalData.deliverables || [],
      subtotal: proposalData.total_investment || 0,
      total_investment: proposalData.total_investment || 0,
      payment_schedule: proposalData.payment_schedule || [],
      payment_terms: proposalData.payment_terms,
      why_us: proposalData.why_us,
      testimonials: proposalData.testimonials || [],
      case_studies: proposalData.case_studies || [],
      terms_conditions: proposalData.terms_conditions,
      valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: "preview",
      views: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    return <ProposalView proposal={proposal} isPreview={true} />
  } catch (error) {
    console.error("Error parsing proposal data:", error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Error loading proposal preview</p>
      </div>
    )
  }
}

export default function ProposalPreviewPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading proposal...</p>
      </div>
    }>
      <ProposalPreviewContent />
    </Suspense>
  )
}
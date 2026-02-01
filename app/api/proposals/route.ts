import { NextResponse } from "next/server"
import { getAllProposals, createProposal } from "@/lib/proposals-db"

export async function GET() {
  try {
    const proposals = await getAllProposals()
    return NextResponse.json(proposals)
  } catch (error) {
    console.error("Error fetching proposals:", error)
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    console.log("Received proposal data:", {
      client_name: data.client_name,
      client_email: data.client_email,
      total_investment: data.total_investment,
      hasServices: !!data.services,
      servicesCount: data.services?.length || 0
    })
    
    // Validate required fields
    if (!data.client_name || !data.client_email) {
      return NextResponse.json(
        { error: "Missing required fields: client_name and client_email are required" },
        { status: 400 }
      )
    }
    
    // Ensure total_investment is set (it can be 0)
    if (data.total_investment === undefined || data.total_investment === null) {
      return NextResponse.json(
        { error: "Missing required field: total_investment" },
        { status: 400 }
      )
    }

    // Create proposal
    const proposal = await createProposal(data)
    
    if (!proposal) {
      console.error("CreateProposal returned null - likely database connection issue")
      return NextResponse.json(
        { error: "Failed to create proposal - database unavailable" },
        { status: 500 }
      )
    }

    // TODO: If status is "sent", send email to client with proposal link

    return NextResponse.json(proposal)
  } catch (error) {
    console.error("Error creating proposal:", error)
    console.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace')
    
    // Return more detailed error information
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = {
      error: `Internal server error: ${errorMessage}`,
      type: error?.constructor?.name || 'UnknownError',
      details: process.env.NODE_ENV === 'development' ? error : undefined
    }
    
    return NextResponse.json(errorDetails, { status: 500 })
  }
}
import { NextResponse } from "next/server"
import { getProposalByToken, updateProposalStatus } from "@/lib/proposals-db"

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  try {
    const data = await request.json()
    
    // Get proposal by token
    const proposal = await getProposalByToken(params.token)
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      )
    }
    
    // Check if proposal can be accepted
    if (proposal.status === "accepted") {
      return NextResponse.json(
        { error: "Proposal has already been accepted" },
        { status: 400 }
      )
    }
    
    if (proposal.status === "rejected") {
      return NextResponse.json(
        { error: "Proposal has been rejected" },
        { status: 400 }
      )
    }
    
    // Check if proposal is expired
    if (proposal.valid_until && new Date(proposal.valid_until) < new Date()) {
      return NextResponse.json(
        { error: "Proposal has expired" },
        { status: 400 }
      )
    }
    
    // Update proposal status
    const success = await updateProposalStatus(proposal.id, "accepted", {
      accepted_by: data.accepted_by,
      acceptance_notes: data.acceptance_notes
    })
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to accept proposal" },
        { status: 500 }
      )
    }
    
    // Send notification email to admin about acceptance
    try {
      const { sendProposalAcceptedEmail } = await import("@/lib/email-service-unified")
      
      const proposalData = {
        ...proposal,
        speakerFee: proposal.total_investment
      }
      
      await sendProposalAcceptedEmail(proposalData)
    } catch (emailError) {
      console.error("Failed to send acceptance notification:", emailError)
    }
    
    // Create project from accepted proposal
    try {
      const { createProjectFromProposal } = await import("@/lib/create-project-from-proposal")
      const projectId = await createProjectFromProposal(proposal)
      
      if (projectId) {
        console.log("Created project", projectId, "from accepted proposal")
      } else {
        console.error("Failed to create project from proposal")
      }
    } catch (projectError) {
      console.error("Error creating project from proposal:", projectError)
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Proposal accepted successfully"
    })
  } catch (error) {
    console.error("Error accepting proposal:", error)
    return NextResponse.json(
      { error: "Failed to accept proposal" },
      { status: 500 }
    )
  }
}
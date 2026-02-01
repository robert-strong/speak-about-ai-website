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
    
    // Check if proposal can be rejected
    if (proposal.status === "accepted") {
      return NextResponse.json(
        { error: "Proposal has already been accepted" },
        { status: 400 }
      )
    }
    
    if (proposal.status === "rejected") {
      return NextResponse.json(
        { error: "Proposal has already been rejected" },
        { status: 400 }
      )
    }
    
    // Update proposal status
    const success = await updateProposalStatus(proposal.id, "rejected", {
      rejected_by: data.rejected_by,
      rejection_reason: data.rejection_reason
    })
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to update proposal status" },
        { status: 500 }
      )
    }
    
    // Send notification email to admin about rejection
    try {
      const { sendProposalRejectedEmail } = await import("@/lib/email-service-unified")
      
      await sendProposalRejectedEmail(proposal, data.rejection_reason)
    } catch (emailError) {
      console.error("Failed to send rejection notification:", emailError)
    }
    
    return NextResponse.json({ 
      success: true,
      message: "Feedback sent successfully"
    })
  } catch (error) {
    console.error("Error rejecting proposal:", error)
    return NextResponse.json(
      { error: "Failed to send feedback" },
      { status: 500 }
    )
  }
}
import { NextResponse } from "next/server"
import { getProposalById, updateProposal, deleteProposal } from "@/lib/proposals-db"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = parseInt(params.id)
    const proposal = await getProposalById(proposalId)
    
    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json(proposal)
  } catch (error) {
    console.error("Error fetching proposal:", error)
    return NextResponse.json(
      { error: "Failed to fetch proposal" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = parseInt(params.id)
    const data = await request.json()
    
    const proposal = await updateProposal(proposalId, data)
    
    if (!proposal) {
      return NextResponse.json(
        { error: "Failed to update proposal" },
        { status: 500 }
      )
    }
    
    return NextResponse.json(proposal)
  } catch (error) {
    console.error("Error updating proposal:", error)
    return NextResponse.json(
      { error: "Failed to update proposal" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const proposalId = parseInt(params.id)
    const success = await deleteProposal(proposalId)
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete proposal" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting proposal:", error)
    return NextResponse.json(
      { error: "Failed to delete proposal" },
      { status: 500 }
    )
  }
}
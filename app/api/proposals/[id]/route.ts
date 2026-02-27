import { type NextRequest, NextResponse } from "next/server"
import { getProposalById, updateProposal, deleteProposal } from "@/lib/proposals-db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const proposalId = parseInt(id)
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const proposalId = parseInt(id)
    const data = await request.json()

    // Fetch original for change detection
    const originalProposal = await getProposalById(proposalId)

    const proposal = await updateProposal(proposalId, data)

    if (!proposal) {
      return NextResponse.json(
        { error: "Failed to update proposal" },
        { status: 500 }
      )
    }

    // Propagate syncable field changes to linked entities
    try {
      const { propagateChanges, extractSyncableFields } = await import("@/lib/entity-sync")
      const changedFields = extractSyncableFields('proposal', data, originalProposal)
      if (Object.keys(changedFields).length > 0) {
        await propagateChanges({ sourceEntity: 'proposal', sourceId: proposalId, changedFields })
      }
    } catch (syncError) {
      console.error("Entity sync failed (non-blocking):", syncError)
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
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const proposalId = parseInt(id)
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

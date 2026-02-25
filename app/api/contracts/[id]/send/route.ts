import { type NextRequest, NextResponse } from "next/server"
import { getContractById, updateContractStatus } from "@/lib/contracts-db"
import { requireAdminAuth } from "@/lib/auth-middleware"

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id } = await params
    const contractId = parseInt(id)
    if (isNaN(contractId)) {
      return NextResponse.json({ error: "Invalid contract ID" }, { status: 400 })
    }

    const contract = await getContractById(contractId)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Check if contract is in draft status
    if (contract.status !== 'draft') {
      return NextResponse.json({
        error: "Contract must be in draft status to send"
      }, { status: 400 })
    }

    // Update contract status to 'sent' (no email is sent - manual process)
    const updatedContract = await updateContractStatus(contractId, 'sent', 'admin')
    if (!updatedContract) {
      return NextResponse.json({
        error: "Failed to update contract status"
      }, { status: 500 })
    }

    return NextResponse.json({
      message: "Contract marked as sent",
      contract: updatedContract
    })
  } catch (error) {
    console.error("Error in POST /api/contracts/[id]/send:", error)
    return NextResponse.json(
      {
        error: "Failed to update contract status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
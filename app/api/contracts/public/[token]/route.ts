import { type NextRequest, NextResponse } from "next/server"
import { getContractByToken } from "@/lib/contracts-db"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 })
    }

    const contract = await getContractByToken(token)
    
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Return contract data for viewing (remove sensitive tokens)
    const publicContract = {
      ...contract,
      client_signing_token: undefined,
      speaker_signing_token: undefined,
      access_token: undefined
    }

    return NextResponse.json(publicContract)
  } catch (error) {
    console.error("Error in GET /api/contracts/public/[token]:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch contract",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
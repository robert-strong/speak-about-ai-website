import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { getContractByToken, getContractSignatures } from "@/lib/contracts-db"
import { INITIAL_REQUIRED_SECTIONS } from "@/lib/contract-signing-utils"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    const contract = await getContractByToken(token)
    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 })
    }

    // Determine signer type
    let signerType: "client" | "speaker" | "admin" = "client"
    if (token === (contract as any).speaker_signing_token) {
      signerType = "speaker"
    } else if (token === (contract as any).access_token) {
      signerType = "admin"
    }

    // Get initials for this signer
    const initials = await sql`
      SELECT section_id
      FROM contract_initials
      WHERE contract_id = ${contract.id} AND signer_type = ${signerType}
    `
    const initialedSections = new Set(initials.map((i: any) => i.section_id))

    // Build section progress
    const sections = INITIAL_REQUIRED_SECTIONS.map((section) => ({
      ...section,
      requires_initial: true,
      is_initialed: initialedSections.has(section.id),
    }))

    // Check signature
    const signatures = await getContractSignatures(contract.id)
    const signatureComplete = signatures.some((s) => s.signer_type === signerType)
    const allInitialsComplete = INITIAL_REQUIRED_SECTIONS.every((s) =>
      initialedSections.has(s.id)
    )

    return NextResponse.json({
      sections,
      signature_complete: signatureComplete,
      all_initials_complete: allInitialsComplete,
      can_submit_final_signature: allInitialsComplete && !signatureComplete,
      initials_completed: initials.length,
      initials_total: INITIAL_REQUIRED_SECTIONS.length,
    })
  } catch (error) {
    console.error("Error fetching signing progress:", error)
    return NextResponse.json(
      { error: "Failed to fetch progress" },
      { status: 500 }
    )
  }
}

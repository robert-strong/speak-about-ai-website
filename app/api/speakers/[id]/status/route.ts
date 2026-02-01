import { NextResponse } from "next/server"
import { updateSpeakerStatus, getSpeakerById } from "@/lib/speakers-db"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const speakerId = parseInt(params.id)
    const data = await request.json()
    
    // Validate required fields
    if (!data.status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      )
    }
    
    // Validate status value
    const validStatuses = ["pending", "approved", "rejected", "suspended"]
    if (!validStatuses.includes(data.status)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      )
    }
    
    // Check if speaker exists
    const existingSpeaker = await getSpeakerById(speakerId)
    if (!existingSpeaker) {
      return NextResponse.json(
        { error: "Speaker not found" },
        { status: 404 }
      )
    }
    
    // Update speaker status
    const updatedSpeaker = await updateSpeakerStatus(
      speakerId,
      data.status,
      data.approval_notes,
      "Admin" // TODO: Get actual admin user from auth
    )
    
    if (!updatedSpeaker) {
      return NextResponse.json(
        { error: "Failed to update speaker status" },
        { status: 500 }
      )
    }
    
    // If there are internal notes or rating, update those separately
    if (data.internal_notes !== undefined || data.internal_rating !== undefined) {
      const { updateSpeaker } = await import("@/lib/speakers-db")
      await updateSpeaker(speakerId, {
        internal_notes: data.internal_notes,
        internal_rating: data.internal_rating
      })
    }
    
    // TODO: Send notification email to speaker about status change
    if (data.status === "approved") {
      // Send approval email with login instructions
      console.log("TODO: Send approval email to", existingSpeaker.email)
    } else if (data.status === "rejected") {
      // Send rejection email with feedback if provided
      console.log("TODO: Send rejection email to", existingSpeaker.email)
    }
    
    return NextResponse.json({
      success: true,
      speaker: updatedSpeaker
    })
  } catch (error) {
    console.error("Error updating speaker status:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
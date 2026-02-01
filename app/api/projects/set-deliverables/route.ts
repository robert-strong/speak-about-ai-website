import { NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

const sql = neon(process.env.DATABASE_URL!)

// Default deliverables based on event type
const DEFAULT_DELIVERABLES = {
  keynote: [
    "Pre-event consultation call (30 minutes)",
    "60-minute keynote presentation",
    "15-minute Q&A session",
    "Presentation slides (PDF)"
  ],
  workshop: [
    "Pre-event consultation call (30 minutes)",
    "Workshop facilitation (3 hours)",
    "Interactive exercises",
    "Workshop materials",
    "Presentation slides (PDF)"
  ],
  panel: [
    "Pre-event consultation call (30 minutes)",
    "Panel participation",
    "Q&A participation"
  ],
  virtual: [
    "Pre-event consultation call (30 minutes)",
    "Technical test session",
    "60-minute virtual presentation", 
    "15-minute Q&A session",
    "Recording permission",
    "Presentation slides (PDF)"
  ]
}

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { projectId, deliverables, useDefaults, eventType } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    let finalDeliverables = deliverables

    // If useDefaults is true, get default deliverables based on event type
    if (useDefaults && eventType) {
      const typeKey = eventType.toLowerCase()
      finalDeliverables = DEFAULT_DELIVERABLES[typeKey as keyof typeof DEFAULT_DELIVERABLES] || DEFAULT_DELIVERABLES.keynote
    }

    // Convert array to string if needed
    if (Array.isArray(finalDeliverables)) {
      finalDeliverables = finalDeliverables.join('\n')
    }

    // Update project with deliverables
    const [updatedProject] = await sql`
      UPDATE projects 
      SET 
        deliverables = ${finalDeliverables},
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${projectId}
      RETURNING id, deliverables
    `

    if (!updatedProject) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: "Deliverables updated successfully",
      deliverables: updatedProject.deliverables
    })

  } catch (error) {
    console.error("Error updating deliverables:", error)
    return NextResponse.json(
      { 
        error: "Failed to update deliverables",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return default deliverables templates
    return NextResponse.json({
      templates: DEFAULT_DELIVERABLES,
      message: "Use these templates as a starting point for project deliverables"
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to get deliverables templates" },
      { status: 500 }
    )
  }
}
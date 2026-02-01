import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { requireAdminAuth } from "@/lib/auth-middleware"

export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const body = await request.json()
    const { dealId, projectId, newBudget, source } = body

    if (!newBudget || (!dealId && !projectId)) {
      return NextResponse.json(
        { error: "Missing required fields: newBudget and either dealId or projectId" },
        { status: 400 }
      )
    }

    // Initialize database connection
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      )
    }

    const sql = neon(process.env.DATABASE_URL)
    let updatedDeal = null
    let updatedProject = null

    // If updating from deals/finances, sync to projects
    if (dealId) {
      // Update the deal
      const deals = await sql`
        UPDATE deals 
        SET deal_value = ${newBudget}, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${dealId}
        RETURNING *
      `
      updatedDeal = deals[0]

      // Find and update related project(s)
      if (updatedDeal) {
        const projects = await sql`
          UPDATE projects 
          SET budget = ${newBudget},
              speaker_fee = ${newBudget},
              updated_at = CURRENT_TIMESTAMP
          WHERE company = ${updatedDeal.company}
            AND client_name = ${updatedDeal.client_name}
            AND (event_date = ${updatedDeal.event_date} 
                 OR project_name = ${updatedDeal.event_title})
          RETURNING *
        `
        updatedProject = projects[0]
      }
    }

    // If updating from projects, sync to deals
    if (projectId) {
      // Update the project
      const projects = await sql`
        UPDATE projects 
        SET budget = ${newBudget},
            speaker_fee = ${newBudget},
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ${projectId}
        RETURNING *
      `
      updatedProject = projects[0]

      // Find and update related deal(s)
      if (updatedProject) {
        const deals = await sql`
          UPDATE deals 
          SET deal_value = ${newBudget},
              updated_at = CURRENT_TIMESTAMP
          WHERE company = ${updatedProject.company}
            AND client_name = ${updatedProject.client_name}
            AND (event_date = ${updatedProject.event_date}
                 OR event_title = ${updatedProject.project_name})
          RETURNING *
        `
        updatedDeal = deals[0]
      }
    }

    return NextResponse.json({
      success: true,
      message: "Budget synchronized successfully",
      updatedDeal,
      updatedProject,
      syncedFrom: source || "unknown"
    })

  } catch (error) {
    console.error("Error syncing budget:", error)
    return NextResponse.json(
      {
        error: "Failed to sync budget",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { searchParams } = new URL(request.url)
    const company = searchParams.get("company")

    if (!company) {
      return NextResponse.json(
        { error: "Company parameter required" },
        { status: 400 }
      )
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "Database configuration missing" },
        { status: 500 }
      )
    }

    const sql = neon(process.env.DATABASE_URL)

    // Get all deals and projects for the company
    const deals = await sql`
      SELECT id, client_name, company, event_title, event_date, 
             deal_value, status, commission_percentage, commission_amount
      FROM deals 
      WHERE company = ${company}
      ORDER BY event_date DESC
    `

    const projects = await sql`
      SELECT id, project_name, client_name, company, event_date,
             budget, speaker_fee, status, commission_percentage, commission_amount
      FROM projects
      WHERE company = ${company}
      ORDER BY event_date DESC
    `

    // Check for budget mismatches
    const mismatches = []
    for (const deal of deals) {
      const matchingProject = projects.find(p => 
        p.client_name === deal.client_name &&
        (p.event_date === deal.event_date || p.project_name === deal.event_title)
      )
      
      if (matchingProject && matchingProject.budget !== deal.deal_value) {
        mismatches.push({
          dealId: deal.id,
          projectId: matchingProject.id,
          dealValue: deal.deal_value,
          projectBudget: matchingProject.budget,
          difference: Math.abs(Number(deal.deal_value) - Number(matchingProject.budget))
        })
      }
    }

    return NextResponse.json({
      company,
      deals: deals.length,
      projects: projects.length,
      mismatches: mismatches.length,
      details: {
        deals,
        projects,
        mismatches
      }
    })

  } catch (error) {
    console.error("Error checking sync status:", error)
    return NextResponse.json(
      {
        error: "Failed to check sync status",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
  }
}
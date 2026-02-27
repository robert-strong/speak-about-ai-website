import { type NextRequest, NextResponse } from "next/server"
import { deleteProject, updateProject, getProjectById } from "@/lib/projects-db"
import { requireAdminAuth } from "@/lib/auth-middleware"
import { sendSlackWebhook, buildProjectStatusUpdateMessage, buildProjectCompletedMessage } from "@/lib/slack"
import { neon } from "@neondatabase/serverless"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id: idString } = await params
    console.log('GET /api/projects/[id] - Raw ID string:', idString, 'Type:', typeof idString)

    const id = parseInt(idString)
    console.log('GET /api/projects/[id] - Parsed ID:', id, 'isNaN:', isNaN(id))

    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid project ID", receivedId: idString }, { status: 400 })
    }

    const project = await getProjectById(id)
    console.log('GET /api/projects/[id] - Project found:', project ? `Yes (ID: ${project.id})` : 'No')

    if (!project) {
      return NextResponse.json({ error: "Project not found", requestedId: id }, { status: 404 })
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error fetching project:", error)
    return NextResponse.json(
      { error: "Failed to fetch project", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const { id: idString } = await params
    const id = parseInt(idString)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    // Get original project to check if status is changing
    const originalProject = await getProjectById(id)

    const body = await request.json()
    const project = await updateProject(id, body)

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Send Slack notification for status changes
    if (originalProject && originalProject.status !== project.status) {
      try {
        if (project.status === 'completed') {
          await sendSlackWebhook(buildProjectCompletedMessage({
            id: project.id,
            project_name: project.project_name,
            client_name: project.client_name,
            company: project.company,
            speaker_fee: project.speaker_fee,
            speaker_name: project.requested_speaker_name,
            event_date: project.event_date
          }))
        } else {
          await sendSlackWebhook(buildProjectStatusUpdateMessage({
            id: project.id,
            project_name: project.project_name,
            client_name: project.client_name,
            old_status: originalProject.status,
            new_status: project.status,
            speaker_fee: project.speaker_fee,
            event_date: project.event_date
          }))
        }
      } catch (slackError) {
        console.error('Slack notification failed:', slackError)
      }

      // Sync project stage changes to linked deal and proposal
      const dbSql = neon(process.env.DATABASE_URL!)
      const dealId = project.deal_id

      // --- Sync deal status from project stage ---
      if (dealId) {
        try {
          // Map project status to deal status
          const projectToDealStatus: Record<string, string> = {
            qualified: 'qualified',
            proposal: 'proposal',
            contracts_signed: 'won',
            logistics_planning: 'won',
            pre_event: 'won',
            event_week: 'won',
            follow_up: 'won',
            completed: 'won',
            cancelled: 'lost',
          }
          const newDealStatus = projectToDealStatus[project.status]
          if (newDealStatus) {
            const currentDeal = await dbSql`SELECT status FROM deals WHERE id = ${dealId}`
            if (currentDeal.length > 0 && currentDeal[0].status !== newDealStatus) {
              // Don't downgrade a "won" deal back to earlier stages
              const dealRank: Record<string, number> = { lead: 0, qualified: 1, proposal: 2, negotiation: 3, won: 4, lost: 5 }
              const currentRank = dealRank[currentDeal[0].status] ?? 0
              const newRank = dealRank[newDealStatus] ?? 0
              if (newRank >= currentRank || newDealStatus === 'lost') {
                await dbSql`UPDATE deals SET status = ${newDealStatus}, updated_at = CURRENT_TIMESTAMP WHERE id = ${dealId}`
                console.log(`Synced deal #${dealId} status to "${newDealStatus}" from project #${project.id} stage "${project.status}"`)
              }
            }
          }
        } catch (dealSyncError) {
          console.error(`Failed to sync deal status for project #${project.id}:`, dealSyncError)
        }
      }

      // --- Sync proposal status from project stage ---
      if (dealId) {
        try {
          // Map project status to proposal status
          let newProposalStatus: string | null = null
          if (project.status === 'proposal') newProposalStatus = 'sent'
          else if (['contracts_signed', 'logistics_planning', 'pre_event', 'event_week', 'follow_up', 'completed'].includes(project.status)) {
            newProposalStatus = 'accepted'
          } else if (project.status === 'cancelled') {
            newProposalStatus = 'rejected'
          }

          if (newProposalStatus) {
            await dbSql`
              UPDATE proposals SET status = ${newProposalStatus}, updated_at = CURRENT_TIMESTAMP
              WHERE deal_id = ${dealId} AND status NOT IN ('accepted', 'rejected')
            `
            console.log(`Synced proposal for deal #${dealId} to status "${newProposalStatus}"`)
          }
        } catch (proposalSyncError) {
          console.error(`Failed to sync proposal status for project #${project.id}:`, proposalSyncError)
        }
      }

      // --- Auto-create proposal when project moves to proposal stage ---
      if (project.status === 'proposal') {
        try {
          let hasProposal = false
          if (dealId) {
            const existing = await dbSql`SELECT id FROM proposals WHERE deal_id = ${dealId}`
            hasProposal = existing.length > 0
          }
          if (!hasProposal) {
            const proposalCount = await dbSql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM proposals`
            const count = Number(proposalCount[0].next_id)
            const year = new Date().getFullYear()
            const proposalNumber = `PROP-${year}-${String(count).padStart(4, '0')}`
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
            let accessToken = ''
            for (let i = 0; i < 40; i++) accessToken += chars.charAt(Math.floor(Math.random() * chars.length))
            const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            const dealValue = Number(project.budget) || 0
            const speakerName = project.requested_speaker_name || null
            const speakers = speakerName ? JSON.stringify([{ name: speakerName, bio: '', topics: [], fee: dealValue, fee_status: 'estimated' }]) : '[]'
            await dbSql`
              INSERT INTO proposals (deal_id, proposal_number, title, status, version, client_name, client_email, client_company, executive_summary, speakers, event_title, event_date, event_location, event_type, attendee_count, services, deliverables, total_investment, payment_terms, payment_schedule, testimonials, case_studies, valid_until, access_token)
              VALUES (${dealId || null}, ${proposalNumber}, ${`Speaking Engagement Proposal for ${project.company || project.client_name}`}, 'draft', 1, ${project.client_name}, ${project.client_email}, ${project.company || null}, ${`We are pleased to present this proposal for ${project.project_name}. Our speaker will deliver an engaging and impactful presentation tailored to your audience.`}, ${speakers}::jsonb, ${project.event_name || project.project_name}, ${project.event_date || null}, ${project.event_location || null}, ${project.event_type || null}, ${project.attendee_count || null}, '[]'::jsonb, '[]'::jsonb, ${dealValue}, ${'50% due upon contract signing, 50% due before event date'}, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, ${validUntil}, ${accessToken})
            `
            console.log(`Auto-created draft proposal ${proposalNumber} for project #${project.id}`)
          }
        } catch (proposalError) {
          console.error(`Failed to auto-create proposal for project #${project.id}:`, proposalError)
        }
      }

      // --- Auto-create contract when project moves to contracts_signed stage ---
      if (project.status === 'contracts_signed') {
        try {
          let hasContract = false
          if (dealId) {
            const existing = await dbSql`SELECT id FROM contracts WHERE deal_id = ${dealId}`
            hasContract = existing.length > 0
          }
          if (!hasContract) {
            const contractDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
            const contractRandom = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
            const contractNumber = `CTR-${contractDate}-${contractRandom}`
            const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
            const dealValue = Number(project.budget) || 0
            const speakerFee = Number(project.speaker_fee) || 0
            const speakerName = project.requested_speaker_name || null

            await dbSql`
              INSERT INTO contracts (deal_id, contract_number, title, type, status, fee_amount, payment_terms, event_title, event_date, event_location, event_type, client_name, client_email, client_company, speaker_name, speaker_fee, expires_at, created_by)
              VALUES (${dealId || null}, ${contractNumber}, ${`Speaker Engagement Agreement - ${project.project_name}`}, 'client_speaker', 'draft', ${dealValue}, ${'Payment due within 30 days of event completion'}, ${project.event_name || project.project_name}, ${project.event_date || null}, ${project.event_location || null}, ${project.event_type || null}, ${project.client_name}, ${project.client_email}, ${project.company || null}, ${speakerName}, ${speakerFee}, ${expiresAt}, ${'system-auto'})
            `
            console.log(`Auto-created draft contract ${contractNumber} for project #${project.id}`)
          }
        } catch (contractError) {
          console.error(`Failed to auto-create contract for project #${project.id}:`, contractError)
        }
      }
    }

    return NextResponse.json(project)
  } catch (error) {
    console.error("Error updating project:", error)
    return NextResponse.json(
      { error: "Failed to update project", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Require admin authentication
    const authError = requireAdminAuth(request)
    if (authError) return authError

    const resolvedParams = await params
    const idString = resolvedParams.id

    const id = parseInt(idString)
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid project ID" }, { status: 400 })
    }

    const success = await deleteProject(id)

    if (!success) {
      return NextResponse.json({ error: "Project not found or could not be deleted" }, { status: 404 })
    }

    return NextResponse.json({ message: "Project deleted successfully", id })
  } catch (error) {
    console.error("Error in DELETE /api/projects/[id]:", {
      error: error instanceof Error ? error.message : error,
      stack: error instanceof Error ? error.stack : undefined,
      params: await params
    })
    return NextResponse.json(
      { 
        error: "Failed to delete project", 
        details: error instanceof Error ? error.message : "Unknown error",
        type: error instanceof Error ? error.constructor.name : typeof error
      },
      { status: 500 }
    )
  }
}

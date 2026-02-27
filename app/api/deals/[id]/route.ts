import { type NextRequest, NextResponse } from "next/server"
import { updateDeal, deleteDeal, getAllDeals } from "@/lib/deals-db"
import { createProject, updateProject } from "@/lib/projects-db"
import { getAutomaticProjectStatus } from "@/lib/project-status-utils"
import { requireAdminAuth } from "@/lib/auth-middleware"
import { sendSlackWebhook, buildDealStatusUpdateMessage, buildDealWonMessage } from "@/lib/slack"
import { neon } from "@neondatabase/serverless"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: idString } = await params
    const id = Number.parseInt(idString)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 })
    }

    const deals = await getAllDeals()
    const deal = deals.find(d => d.id === id)

    if (!deal) {
      return NextResponse.json({ error: "Deal not found" }, { status: 404 })
    }

    return NextResponse.json(deal)
  } catch (error) {
    console.error("Error fetching deal:", error)
    return NextResponse.json({ error: "Failed to fetch deal" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Skip auth for now to match the simple localStorage pattern used in GET/POST
    // TODO: Implement proper JWT auth across all admin APIs
    // const devBypass = request.headers.get('x-dev-admin-bypass')
    // if (devBypass !== 'dev-admin-access') {
    //   const authError = requireAdminAuth(request)
    //   if (authError) return authError
    // }

    const { id: idString } = await params
    const id = Number.parseInt(idString)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 })
    }

    const body = await request.json()
    
    // Get the original deal to check if status is changing
    const { getAllDeals } = await import("@/lib/deals-db")
    const deals = await getAllDeals()
    const originalDeal = deals.find(d => d.id === id)

    const deal = await updateDeal(id, body)

    if (!deal) {
      return NextResponse.json({ error: "Deal not found or failed to update" }, { status: 404 })
    }

    // Propagate syncable field changes to linked entities
    try {
      const { propagateChanges, extractSyncableFields } = await import("@/lib/entity-sync")
      const changedFields = extractSyncableFields('deal', body, originalDeal)
      if (Object.keys(changedFields).length > 0) {
        await propagateChanges({ sourceEntity: 'deal', sourceId: id, changedFields })
      }
    } catch (syncError) {
      console.error("Entity sync failed (non-blocking):", syncError)
    }

    // Send Slack notification for status changes
    if (originalDeal && originalDeal.status !== deal.status) {
      try {
        if (deal.status === 'won') {
          await sendSlackWebhook(buildDealWonMessage({
            id: deal.id,
            event_title: deal.event_title,
            client_name: deal.client_name,
            company: deal.company,
            deal_value: deal.deal_value,
            speaker_name: deal.speaker_requested,
            event_date: deal.event_date
          }))
        } else {
          await sendSlackWebhook(buildDealStatusUpdateMessage({
            id: deal.id,
            event_title: deal.event_title,
            client_name: deal.client_name,
            old_status: originalDeal.status,
            new_status: deal.status,
            deal_value: deal.deal_value
          }))
        }
      } catch (slackError) {
        console.error('Slack notification failed:', slackError)
      }
    }

    // Handle project creation/advancement based on deal status transitions
    if (originalDeal && originalDeal.status !== deal.status) {
      const dbSql = neon(process.env.DATABASE_URL!)

      try {
        // Lead → Qualified: Create project with minimal data
        if (deal.status === "qualified" && originalDeal.status === "lead") {
          // Check if project already exists for this deal
          const existing = await dbSql`SELECT id FROM projects WHERE deal_id = ${deal.id}`
          if (existing.length === 0) {
            const projectData = {
              project_name: deal.event_title,
              client_name: deal.client_name,
              client_email: deal.client_email,
              client_phone: deal.client_phone,
              company: deal.company,
              project_type: deal.event_type === "Workshop" ? "Workshop" :
                           deal.event_type === "Keynote" ? "Speaking" :
                           deal.event_type === "Consulting" ? "Consulting" : "Other",
              description: `Event: ${deal.event_title}\nLocation: ${deal.event_location || 'TBD'}`,
              status: "qualified" as const,
              priority: deal.priority,
              start_date: new Date().toISOString().split('T')[0],
              deadline: deal.event_date,
              budget: 0,
              spent: 0,
              completion_percentage: 0,
              event_name: deal.event_title,
              event_date: deal.event_date,
              event_location: deal.event_location,
              event_type: deal.event_type,
              requested_speaker_name: deal.speaker_requested,
              attendee_count: deal.attendee_count,
              contact_person: deal.client_name,
              notes: `Deal ID: ${deal.id}\nSource: ${deal.source}\nBudget Range: ${deal.budget_range}`,
              tags: [deal.event_type, deal.source].filter(Boolean),
              deal_id: deal.id,
              event_classification: deal.event_type?.toLowerCase().includes('virtual') || deal.event_type?.toLowerCase().includes('webinar') ? 'virtual' as const :
                                  deal.event_location?.toLowerCase().includes('remote') ? 'virtual' as const : 'local' as const
            }
            const project = await createProject(projectData)
            if (project) {
              console.log(`Created project "${project.project_name}" at qualified stage from deal #${deal.id}`)
              return NextResponse.json({
                ...deal,
                projectCreated: true,
                projectId: project.id,
                message: `Deal moved to Qualified — project "${project.project_name}" created`
              })
            }
          }
        }

        // Qualified → Proposal: Advance existing project and auto-create proposal
        if (deal.status === "proposal" && (originalDeal.status === "qualified" || originalDeal.status === "lead")) {
          const existing = await dbSql`SELECT id, stage_completion FROM projects WHERE deal_id = ${deal.id}`
          if (existing.length > 0) {
            const stageCompletion = existing[0].stage_completion || {}
            // Mark qualified tasks as done, seed proposal tasks
            stageCompletion.qualified = { prioritized_reach_outs: true, correspondence_follow_ups: true }
            stageCompletion.proposal = {
              proposal_discussed: false,
              proposal_created: false,
              proposal_finished: false,
              proposal_sent: false,
              proposal_agreed: false
            }
            await dbSql`UPDATE projects SET status = 'proposal', stage_completion = ${JSON.stringify(stageCompletion)}, updated_at = CURRENT_TIMESTAMP WHERE deal_id = ${deal.id}`
            console.log(`Advanced project to proposal stage for deal #${deal.id}`)

            // Auto-create draft proposal for this deal
            try {
              const existingProposal = await dbSql`SELECT id FROM proposals WHERE deal_id = ${deal.id}`
              if (existingProposal.length === 0) {
                const proposalCount = await dbSql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM proposals`
                const count = Number(proposalCount[0].next_id)
                const year = new Date().getFullYear()
                const proposalNumber = `PROP-${year}-${String(count).padStart(4, '0')}`
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
                let accessToken = ''
                for (let i = 0; i < 40; i++) accessToken += chars.charAt(Math.floor(Math.random() * chars.length))
                const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                const dealValue = Number(deal.deal_value) || 0
                const speakerName = deal.speaker_requested || null
                const speakers = speakerName ? JSON.stringify([{ name: speakerName, bio: '', topics: [], fee: dealValue, fee_status: 'estimated' }]) : '[]'
                const services = JSON.stringify([{ name: 'Keynote Presentation', description: '60-minute keynote address', price: dealValue, included: true }])
                await dbSql`
                  INSERT INTO proposals (deal_id, proposal_number, title, status, version, client_name, client_email, client_company, executive_summary, speakers, event_title, event_date, event_location, event_type, attendee_count, services, deliverables, total_investment, payment_terms, payment_schedule, testimonials, case_studies, valid_until, access_token)
                  VALUES (${deal.id}, ${proposalNumber}, ${`Speaking Engagement Proposal for ${deal.company || deal.client_name}`}, 'draft', 1, ${deal.client_name}, ${deal.client_email}, ${deal.company || null}, ${`We are pleased to present this proposal for ${deal.event_title}. Our speaker will deliver an engaging and impactful presentation tailored to your audience.`}, ${speakers}::jsonb, ${deal.event_title}, ${deal.event_date || null}, ${deal.event_location || null}, ${deal.event_type || null}, ${deal.attendee_count || null}, ${services}::jsonb, '[]'::jsonb, ${dealValue}, ${'50% due upon contract signing, 50% due before event date'}, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, ${validUntil}, ${accessToken})
                `
                console.log(`Auto-created draft proposal ${proposalNumber} for deal #${deal.id}`)
              }
            } catch (proposalError) {
              console.error(`Failed to auto-create proposal for deal #${deal.id}:`, proposalError)
            }
          } else {
            // No existing project — create at proposal stage
            const projectData = {
              project_name: deal.event_title,
              client_name: deal.client_name,
              client_email: deal.client_email,
              client_phone: deal.client_phone,
              company: deal.company,
              project_type: deal.event_type === "Workshop" ? "Workshop" :
                           deal.event_type === "Keynote" ? "Speaking" :
                           deal.event_type === "Consulting" ? "Consulting" : "Other",
              description: `Event: ${deal.event_title}\nLocation: ${deal.event_location || 'TBD'}`,
              status: "proposal" as const,
              priority: deal.priority,
              start_date: new Date().toISOString().split('T')[0],
              deadline: deal.event_date,
              budget: 0,
              spent: 0,
              completion_percentage: 0,
              event_name: deal.event_title,
              event_date: deal.event_date,
              event_location: deal.event_location,
              event_type: deal.event_type,
              requested_speaker_name: deal.speaker_requested,
              attendee_count: deal.attendee_count,
              contact_person: deal.client_name,
              notes: `Deal ID: ${deal.id}\nSource: ${deal.source}\nBudget Range: ${deal.budget_range}`,
              tags: [deal.event_type, deal.source].filter(Boolean),
              deal_id: deal.id,
              event_classification: deal.event_type?.toLowerCase().includes('virtual') || deal.event_type?.toLowerCase().includes('webinar') ? 'virtual' as const :
                                  deal.event_location?.toLowerCase().includes('remote') ? 'virtual' as const : 'local' as const
            }
            await createProject(projectData)
          }
        }

        // Any → Won: Update existing project with financial data, or create at contracts_signed
        if (deal.status === "won" && originalDeal.status !== "won") {
          const dealValue = body.deal_value || deal.deal_value || 0
          const commissionPercentage = body.commission_percentage ?? 20
          const commissionAmount = body.commission_amount ?? (dealValue * commissionPercentage / 100)
          const speakerFee = body.speaker_fee ?? (dealValue - commissionAmount)

          const existing = await dbSql`SELECT id, stage_completion FROM projects WHERE deal_id = ${deal.id}`

          if (existing.length > 0) {
            // Update existing project with financial data and advance to contracts_signed
            const stageCompletion = existing[0].stage_completion || {}
            stageCompletion.qualified = { prioritized_reach_outs: true, correspondence_follow_ups: true }
            stageCompletion.proposal = {
              proposal_discussed: true,
              proposal_created: true,
              proposal_finished: true,
              proposal_sent: true,
              proposal_agreed: true
            }
            stageCompletion.contracts_signed = stageCompletion.contracts_signed || {
              prepare_client_contract: false,
              send_contract_to_client: false,
              client_contract_signed: false,
              prepare_speaker_agreement: false,
              obtain_speaker_signature: false,
              file_all_signed_contracts: false
            }
            stageCompletion.invoicing_track = stageCompletion.invoicing_track || {
              send_internal_contract: false,
              initial_invoice_sent: false,
              final_invoice_sent: false,
              kickoff_meeting_planned: false,
              event_details_confirmed: false
            }

            await dbSql`UPDATE projects SET
              status = 'contracts_signed',
              budget = ${dealValue},
              speaker_fee = ${speakerFee},
              commission_percentage = ${commissionPercentage},
              commission_amount = ${commissionAmount},
              requested_speaker_name = COALESCE(${body.speaker_name || deal.speaker_requested || null}, requested_speaker_name),
              billing_contact_name = COALESCE(${deal.client_name}, billing_contact_name),
              billing_contact_email = COALESCE(${deal.client_email}, billing_contact_email),
              billing_contact_phone = COALESCE(${deal.client_phone}, billing_contact_phone),
              stage_completion = ${JSON.stringify(stageCompletion)},
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ${existing[0].id}`

            console.log(`Updated existing project #${existing[0].id} with financial data and advanced to contracts_signed`)

            // Auto-create draft contract for this deal
            try {
              const existingContract = await dbSql`SELECT id FROM contracts WHERE deal_id = ${deal.id}`
              if (existingContract.length === 0) {
                const contractDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
                const contractRandom = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
                const contractNumber = `CTR-${contractDate}-${contractRandom}`
                const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
                const speakerName = body.speaker_name || deal.speaker_requested || null

                await dbSql`
                  INSERT INTO contracts (deal_id, contract_number, title, type, status, fee_amount, payment_terms, event_title, event_date, event_location, event_type, client_name, client_email, client_company, speaker_name, speaker_fee, expires_at, created_by)
                  VALUES (${deal.id}, ${contractNumber}, ${`Speaker Engagement Agreement - ${deal.event_title}`}, 'client_speaker', 'draft', ${dealValue}, ${'Payment due within 30 days of event completion'}, ${deal.event_title}, ${deal.event_date || null}, ${deal.event_location || null}, ${deal.event_type || null}, ${deal.client_name}, ${deal.client_email}, ${deal.company || null}, ${speakerName}, ${speakerFee}, ${expiresAt}, ${'system-auto'})
                `
                console.log(`Auto-created draft contract ${contractNumber} for deal #${deal.id}`)
              }
            } catch (contractError) {
              console.error(`Failed to auto-create contract for deal #${deal.id}:`, contractError)
            }

            return NextResponse.json({
              ...deal,
              projectCreated: false,
              projectUpdated: true,
              projectId: existing[0].id,
              message: `Deal won — project updated with financial data and advanced to Contracting`
            })
          } else {
            // Fallback: create project at contracts_signed (backward compat)
            const projectData = {
              project_name: deal.event_title,
              client_name: deal.client_name,
              client_email: deal.client_email,
              client_phone: deal.client_phone,
              company: deal.company,
              project_type: deal.event_type === "Workshop" ? "Workshop" :
                           deal.event_type === "Keynote" ? "Speaking" :
                           deal.event_type === "Consulting" ? "Consulting" : "Other",
              description: `Event: ${deal.event_title}\nLocation: ${deal.event_location}\nAttendees: ${deal.attendee_count}\n\n${deal.notes}`,
              status: "contracts_signed" as const,
              priority: deal.priority,
              start_date: new Date().toISOString().split('T')[0],
              deadline: deal.event_date,
              budget: dealValue,
              spent: 0,
              completion_percentage: 0,
              billing_contact_name: deal.client_name,
              billing_contact_email: deal.client_email,
              billing_contact_phone: deal.client_phone,
              logistics_contact_name: deal.client_name,
              logistics_contact_email: deal.client_email,
              logistics_contact_phone: deal.client_phone,
              end_client_name: deal.company,
              event_name: deal.event_title,
              event_date: deal.event_date,
              event_location: deal.event_location,
              event_type: deal.event_type,
              requested_speaker_name: body.speaker_name || deal.speaker_requested,
              program_topic: `${deal.event_title} - ${deal.event_type}`,
              program_type: deal.event_type,
              audience_size: deal.attendee_count,
              audience_demographics: "To be determined during planning",
              speaker_fee: speakerFee,
              commission_percentage: commissionPercentage,
              commission_amount: commissionAmount,
              attendee_count: deal.attendee_count,
              contact_person: deal.client_name,
              notes: `Deal ID: ${deal.id}\nSource: ${deal.source}\nBudget Range: ${deal.budget_range}\nOriginal notes: ${deal.notes}`,
              tags: [deal.event_type, deal.source],
              deal_id: deal.id,
              contract_signed: body.contract_signed || false,
              invoice_sent: false,
              payment_received: false,
              presentation_ready: false,
              materials_sent: false,
              event_classification: deal.event_type?.toLowerCase().includes('virtual') || deal.event_type?.toLowerCase().includes('webinar') ? 'virtual' as const :
                                  deal.event_location?.toLowerCase().includes('remote') ? 'virtual' as const : 'local' as const
            }

            const project = await createProject(projectData)
            if (project) {
              console.log(`Created project "${project.project_name}" at contracts_signed from won deal #${deal.id}`)

              // Auto-create draft contract for fallback path too
              try {
                const contractDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
                const contractRandom = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
                const contractNumber = `CTR-${contractDate}-${contractRandom}`
                const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
                const speakerName = body.speaker_name || deal.speaker_requested || null

                await dbSql`
                  INSERT INTO contracts (deal_id, contract_number, title, type, status, fee_amount, payment_terms, event_title, event_date, event_location, event_type, client_name, client_email, client_company, speaker_name, speaker_fee, expires_at, created_by)
                  VALUES (${deal.id}, ${contractNumber}, ${`Speaker Engagement Agreement - ${deal.event_title}`}, 'client_speaker', 'draft', ${dealValue}, ${'Payment due within 30 days of event completion'}, ${deal.event_title}, ${deal.event_date || null}, ${deal.event_location || null}, ${deal.event_type || null}, ${deal.client_name}, ${deal.client_email}, ${deal.company || null}, ${speakerName}, ${speakerFee}, ${expiresAt}, ${'system-auto'})
                `
                console.log(`Auto-created draft contract ${contractNumber} for deal #${deal.id}`)
              } catch (contractError) {
                console.error(`Failed to auto-create contract for deal #${deal.id}:`, contractError)
              }

              return NextResponse.json({
                ...deal,
                projectCreated: true,
                projectId: project.id,
                message: `Deal updated to Won and project "${project.project_name}" was automatically created`
              })
            }
          }
        }
      } catch (error) {
        console.error("Error handling project sync for deal status change:", error)
        // Don't fail the deal update if project creation/update fails
      }
    }

    return NextResponse.json(deal)
  } catch (error) {
    console.error("Error in PUT /api/deals/[id]:", error)
    return NextResponse.json(
      {
        error: "Failed to update deal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Skip auth for now to match the simple localStorage pattern used in GET/POST
    // TODO: Implement proper JWT auth across all admin APIs
    // const devBypass = request.headers.get('x-dev-admin-bypass')
    // if (devBypass !== 'dev-admin-access') {
    //   const authError = requireAdminAuth(request)
    //   if (authError) return authError
    // }

    const { id: idString } = await params
    const id = Number.parseInt(idString)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 })
    }

    const body = await request.json()
    
    // Get the original deal to check if status is changing
    const { getAllDeals } = await import("@/lib/deals-db")
    const deals = await getAllDeals()
    const originalDeal = deals.find(d => d.id === id)
    
    const deal = await updateDeal(id, body)

    if (!deal) {
      return NextResponse.json({ error: "Deal not found or failed to update" }, { status: 404 })
    }

    // Propagate syncable field changes to linked entities
    try {
      const { propagateChanges, extractSyncableFields } = await import("@/lib/entity-sync")
      const changedFields = extractSyncableFields('deal', body, originalDeal)
      if (Object.keys(changedFields).length > 0) {
        await propagateChanges({ sourceEntity: 'deal', sourceId: id, changedFields })
      }
    } catch (syncError) {
      console.error("Entity sync failed (non-blocking):", syncError)
    }

    // Handle project creation/advancement based on deal status transitions (mirrors PUT logic)
    if (originalDeal && originalDeal.status !== deal.status) {
      const dbSql = neon(process.env.DATABASE_URL!)

      try {
        // Lead → Qualified: Create project with minimal data
        if (deal.status === "qualified" && originalDeal.status === "lead") {
          const existing = await dbSql`SELECT id FROM projects WHERE deal_id = ${deal.id}`
          if (existing.length === 0) {
            const projectData = {
              project_name: deal.event_title,
              client_name: deal.client_name,
              client_email: deal.client_email,
              client_phone: deal.client_phone,
              company: deal.company,
              project_type: deal.event_type === "Workshop" ? "Workshop" :
                           deal.event_type === "Keynote" ? "Speaking" :
                           deal.event_type === "Consulting" ? "Consulting" : "Other",
              description: `Event: ${deal.event_title}\nLocation: ${deal.event_location || 'TBD'}`,
              status: "qualified" as const,
              priority: deal.priority,
              start_date: new Date().toISOString().split('T')[0],
              deadline: deal.event_date,
              budget: 0,
              spent: 0,
              completion_percentage: 0,
              event_name: deal.event_title,
              event_date: deal.event_date,
              event_location: deal.event_location,
              event_type: deal.event_type,
              requested_speaker_name: deal.speaker_requested,
              attendee_count: deal.attendee_count,
              contact_person: deal.client_name,
              notes: `Deal ID: ${deal.id}\nSource: ${deal.source}\nBudget Range: ${deal.budget_range}`,
              tags: [deal.event_type, deal.source].filter(Boolean),
              deal_id: deal.id,
              event_classification: deal.event_type?.toLowerCase().includes('virtual') || deal.event_type?.toLowerCase().includes('webinar') ? 'virtual' as const :
                                  deal.event_location?.toLowerCase().includes('remote') ? 'virtual' as const : 'local' as const
            }
            const project = await createProject(projectData)
            if (project) {
              console.log(`Created project "${project.project_name}" at qualified stage from deal #${deal.id}`)
              return NextResponse.json({
                ...deal,
                projectCreated: true,
                projectId: project.id,
                message: `Deal moved to Qualified — project created`
              })
            }
          }
        }

        // Qualified → Proposal: Advance existing project
        if (deal.status === "proposal" && (originalDeal.status === "qualified" || originalDeal.status === "lead")) {
          const existing = await dbSql`SELECT id, stage_completion FROM projects WHERE deal_id = ${deal.id}`
          if (existing.length > 0) {
            const stageCompletion = existing[0].stage_completion || {}
            stageCompletion.qualified = { prioritized_reach_outs: true, correspondence_follow_ups: true }
            stageCompletion.proposal = {
              proposal_discussed: false,
              proposal_created: false,
              proposal_finished: false,
              proposal_sent: false,
              proposal_agreed: false
            }
            await dbSql`UPDATE projects SET status = 'proposal', stage_completion = ${JSON.stringify(stageCompletion)}, updated_at = CURRENT_TIMESTAMP WHERE deal_id = ${deal.id}`

            // Auto-create draft proposal for this deal
            try {
              const existingProposal = await dbSql`SELECT id FROM proposals WHERE deal_id = ${deal.id}`
              if (existingProposal.length === 0) {
                const proposalCount = await dbSql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM proposals`
                const count = Number(proposalCount[0].next_id)
                const year = new Date().getFullYear()
                const proposalNumber = `PROP-${year}-${String(count).padStart(4, '0')}`
                const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
                let accessToken = ''
                for (let i = 0; i < 40; i++) accessToken += chars.charAt(Math.floor(Math.random() * chars.length))
                const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
                const dealValue = Number(deal.deal_value) || 0
                const speakerName = deal.speaker_requested || null
                const speakers = speakerName ? JSON.stringify([{ name: speakerName, bio: '', topics: [], fee: dealValue, fee_status: 'estimated' }]) : '[]'
                const services = JSON.stringify([{ name: 'Keynote Presentation', description: '60-minute keynote address', price: dealValue, included: true }])
                await dbSql`
                  INSERT INTO proposals (deal_id, proposal_number, title, status, version, client_name, client_email, client_company, executive_summary, speakers, event_title, event_date, event_location, event_type, attendee_count, services, deliverables, total_investment, payment_terms, payment_schedule, testimonials, case_studies, valid_until, access_token)
                  VALUES (${deal.id}, ${proposalNumber}, ${`Speaking Engagement Proposal for ${deal.company || deal.client_name}`}, 'draft', 1, ${deal.client_name}, ${deal.client_email}, ${deal.company || null}, ${`We are pleased to present this proposal for ${deal.event_title}. Our speaker will deliver an engaging and impactful presentation tailored to your audience.`}, ${speakers}::jsonb, ${deal.event_title}, ${deal.event_date || null}, ${deal.event_location || null}, ${deal.event_type || null}, ${deal.attendee_count || null}, ${services}::jsonb, '[]'::jsonb, ${dealValue}, ${'50% due upon contract signing, 50% due before event date'}, '[]'::jsonb, '[]'::jsonb, '[]'::jsonb, ${validUntil}, ${accessToken})
                `
                console.log(`Auto-created draft proposal ${proposalNumber} for deal #${deal.id}`)
              }
            } catch (proposalError) {
              console.error(`Failed to auto-create proposal for deal #${deal.id}:`, proposalError)
            }
          } else {
            const projectData = {
              project_name: deal.event_title,
              client_name: deal.client_name,
              client_email: deal.client_email,
              client_phone: deal.client_phone,
              company: deal.company,
              project_type: deal.event_type === "Workshop" ? "Workshop" :
                           deal.event_type === "Keynote" ? "Speaking" :
                           deal.event_type === "Consulting" ? "Consulting" : "Other",
              description: `Event: ${deal.event_title}\nLocation: ${deal.event_location || 'TBD'}`,
              status: "proposal" as const,
              priority: deal.priority,
              start_date: new Date().toISOString().split('T')[0],
              deadline: deal.event_date,
              budget: 0,
              spent: 0,
              completion_percentage: 0,
              event_name: deal.event_title,
              event_date: deal.event_date,
              event_location: deal.event_location,
              event_type: deal.event_type,
              requested_speaker_name: deal.speaker_requested,
              attendee_count: deal.attendee_count,
              contact_person: deal.client_name,
              notes: `Deal ID: ${deal.id}\nSource: ${deal.source}\nBudget Range: ${deal.budget_range}`,
              tags: [deal.event_type, deal.source].filter(Boolean),
              deal_id: deal.id,
              event_classification: deal.event_type?.toLowerCase().includes('virtual') || deal.event_type?.toLowerCase().includes('webinar') ? 'virtual' as const :
                                  deal.event_location?.toLowerCase().includes('remote') ? 'virtual' as const : 'local' as const
            }
            await createProject(projectData)
          }
        }

        // Any → Won: Update existing project or create at contracts_signed
        if (deal.status === "won" && originalDeal.status !== "won") {
          const dealValue = body.deal_value || deal.deal_value || 0
          const commissionPercentage = body.commission_percentage ?? 20
          const commissionAmount = body.commission_amount ?? (dealValue * commissionPercentage / 100)
          const speakerFee = body.speaker_fee ?? (dealValue - commissionAmount)

          const existing = await dbSql`SELECT id, stage_completion FROM projects WHERE deal_id = ${deal.id}`
          if (existing.length > 0) {
            const stageCompletion = existing[0].stage_completion || {}
            stageCompletion.qualified = { prioritized_reach_outs: true, correspondence_follow_ups: true }
            stageCompletion.proposal = { proposal_discussed: true, proposal_created: true, proposal_finished: true, proposal_sent: true, proposal_agreed: true }
            stageCompletion.contracts_signed = stageCompletion.contracts_signed || {
              prepare_client_contract: false, send_contract_to_client: false, client_contract_signed: false,
              prepare_speaker_agreement: false, obtain_speaker_signature: false, file_all_signed_contracts: false
            }
            stageCompletion.invoicing_track = stageCompletion.invoicing_track || {
              send_internal_contract: false, initial_invoice_sent: false, final_invoice_sent: false,
              kickoff_meeting_planned: false, event_details_confirmed: false
            }

            await dbSql`UPDATE projects SET
              status = 'contracts_signed',
              budget = ${dealValue},
              speaker_fee = ${speakerFee},
              commission_percentage = ${commissionPercentage},
              commission_amount = ${commissionAmount},
              requested_speaker_name = COALESCE(${body.speaker_name || deal.speaker_requested || null}, requested_speaker_name),
              billing_contact_name = COALESCE(${deal.client_name}, billing_contact_name),
              billing_contact_email = COALESCE(${deal.client_email}, billing_contact_email),
              billing_contact_phone = COALESCE(${deal.client_phone}, billing_contact_phone),
              stage_completion = ${JSON.stringify(stageCompletion)},
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ${existing[0].id}`

            // Auto-create draft contract for this deal
            try {
              const existingContract = await dbSql`SELECT id FROM contracts WHERE deal_id = ${deal.id}`
              if (existingContract.length === 0) {
                const contractDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
                const contractRandom = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
                const contractNumber = `CTR-${contractDate}-${contractRandom}`
                const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
                const speakerName = body.speaker_name || deal.speaker_requested || null

                await dbSql`
                  INSERT INTO contracts (deal_id, contract_number, title, type, status, fee_amount, payment_terms, event_title, event_date, event_location, event_type, client_name, client_email, client_company, speaker_name, speaker_fee, expires_at, created_by)
                  VALUES (${deal.id}, ${contractNumber}, ${`Speaker Engagement Agreement - ${deal.event_title}`}, 'client_speaker', 'draft', ${dealValue}, ${'Payment due within 30 days of event completion'}, ${deal.event_title}, ${deal.event_date || null}, ${deal.event_location || null}, ${deal.event_type || null}, ${deal.client_name}, ${deal.client_email}, ${deal.company || null}, ${speakerName}, ${speakerFee}, ${expiresAt}, ${'system-auto'})
                `
                console.log(`Auto-created draft contract ${contractNumber} for deal #${deal.id}`)
              }
            } catch (contractError) {
              console.error(`Failed to auto-create contract for deal #${deal.id}:`, contractError)
            }

            return NextResponse.json({
              ...deal,
              projectUpdated: true,
              projectId: existing[0].id,
              message: `Deal won — project updated with financial data`
            })
          } else {
            // Fallback: create at contracts_signed
            const projectData = {
              project_name: deal.event_title,
              client_name: deal.client_name,
              client_email: deal.client_email,
              client_phone: deal.client_phone,
              company: deal.company,
              project_type: deal.event_type === "Workshop" ? "Workshop" :
                           deal.event_type === "Keynote" ? "Speaking" :
                           deal.event_type === "Consulting" ? "Consulting" : "Other",
              description: `Event: ${deal.event_title}\nLocation: ${deal.event_location}\nAttendees: ${deal.attendee_count}\n\n${deal.notes}`,
              status: "contracts_signed" as const,
              priority: deal.priority,
              start_date: new Date().toISOString().split('T')[0],
              deadline: deal.event_date,
              budget: dealValue,
              spent: 0,
              completion_percentage: 0,
              billing_contact_name: deal.client_name,
              billing_contact_email: deal.client_email,
              billing_contact_phone: deal.client_phone,
              end_client_name: deal.company,
              event_name: deal.event_title,
              event_date: deal.event_date,
              event_location: deal.event_location,
              event_type: deal.event_type,
              requested_speaker_name: body.speaker_name || deal.speaker_requested,
              speaker_fee: speakerFee,
              commission_percentage: commissionPercentage,
              commission_amount: commissionAmount,
              attendee_count: deal.attendee_count,
              contact_person: deal.client_name,
              notes: `Deal ID: ${deal.id}\nSource: ${deal.source}\nBudget Range: ${deal.budget_range}\nOriginal notes: ${deal.notes}`,
              tags: [deal.event_type, deal.source],
              deal_id: deal.id,
              contract_signed: body.contract_signed || false,
              invoice_sent: false,
              payment_received: false,
              presentation_ready: false,
              materials_sent: false,
              event_classification: deal.event_type?.toLowerCase().includes('virtual') || deal.event_type?.toLowerCase().includes('webinar') ? 'virtual' as const :
                                  deal.event_location?.toLowerCase().includes('remote') ? 'virtual' as const : 'local' as const
            }

            const project = await createProject(projectData)
            if (project) {
              // Auto-create draft contract for fallback path too
              try {
                const contractDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
                const contractRandom = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
                const contractNumber = `CTR-${contractDate}-${contractRandom}`
                const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
                const speakerName = body.speaker_name || deal.speaker_requested || null

                await dbSql`
                  INSERT INTO contracts (deal_id, contract_number, title, type, status, fee_amount, payment_terms, event_title, event_date, event_location, event_type, client_name, client_email, client_company, speaker_name, speaker_fee, expires_at, created_by)
                  VALUES (${deal.id}, ${contractNumber}, ${`Speaker Engagement Agreement - ${deal.event_title}`}, 'client_speaker', 'draft', ${dealValue}, ${'Payment due within 30 days of event completion'}, ${deal.event_title}, ${deal.event_date || null}, ${deal.event_location || null}, ${deal.event_type || null}, ${deal.client_name}, ${deal.client_email}, ${deal.company || null}, ${speakerName}, ${speakerFee}, ${expiresAt}, ${'system-auto'})
                `
                console.log(`Auto-created draft contract ${contractNumber} for deal #${deal.id}`)
              } catch (contractError) {
                console.error(`Failed to auto-create contract for deal #${deal.id}:`, contractError)
              }

              return NextResponse.json({
                ...deal,
                projectCreated: true,
                projectId: project.id,
                message: `Deal won — project "${project.project_name}" created`
              })
            }
          }
        }
      } catch (error) {
        console.error("Error handling project sync for deal status change:", error)
      }
    }

    return NextResponse.json(deal)
  } catch (error) {
    console.error("Error in PATCH /api/deals/[id]:", error)
    return NextResponse.json(
      {
        error: "Failed to update deal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Skip auth for now to match the simple localStorage pattern used in GET/POST
    // TODO: Implement proper JWT auth across all admin APIs
    // const devBypass = request.headers.get('x-dev-admin-bypass')
    // if (devBypass !== 'dev-admin-access') {
    //   const authError = requireAdminAuth(request)
    //   if (authError) return authError
    // }

    const { id: idString } = await params
    const id = Number.parseInt(idString)
    if (Number.isNaN(id)) {
      return NextResponse.json({ error: "Invalid deal ID" }, { status: 400 })
    }

    // Unlink any projects that reference this deal so they aren't orphaned
    const dbSql = neon(process.env.DATABASE_URL!)
    await dbSql`UPDATE projects SET deal_id = NULL WHERE deal_id = ${id}`

    const success = await deleteDeal(id)

    if (!success) {
      return NextResponse.json({ error: "Deal not found or failed to delete" }, { status: 404 })
    }

    return NextResponse.json({ message: "Deal deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/deals/[id]:", error)
    return NextResponse.json(
      {
        error: "Failed to delete deal",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

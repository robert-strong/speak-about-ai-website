import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

// Stages that require a proposal
const PROPOSAL_STAGES = [
  'proposal', 'contracts_signed', 'logistics_planning',
  'pre_event', 'event_week', 'follow_up', 'completed',
  '2plus_months', '1to2_months', 'less_than_month', 'final_week'
]

// Stages that require contract + invoices
const CONTRACT_STAGES = [
  'contracts_signed', 'logistics_planning',
  'pre_event', 'event_week', 'follow_up', 'completed',
  '2plus_months', '1to2_months', 'less_than_month', 'final_week'
]

export async function POST(request: NextRequest) {
  try {
    const sql = neon(process.env.DATABASE_URL!)

    const details: any[] = []
    const summary = {
      projectsProcessed: 0,
      fkReconciliation: {
        dealsLinkedToProjects: 0,
        contractsLinkedToProjects: 0,
        invoicesLinkedToDeals: 0
      },
      entitiesCreated: {
        proposals: 0,
        contracts: 0,
        invoicePairs: 0
      },
      errors: 0
    }

    // =========================================
    // PHASE 1: FK RECONCILIATION
    // =========================================

    // Step 1.1 — Link orphaned projects to deals (fuzzy match)
    const orphanedProjects = await sql`
      SELECT p.id, p.client_name, p.company, p.event_name, p.event_date
      FROM projects p
      WHERE p.deal_id IS NULL
      AND p.client_name IS NOT NULL
    `

    for (const project of orphanedProjects) {
      try {
        // Require BOTH client_name AND company to match (strict).
        // Generic event names like "AI Keynote Speaking Engagement" caused
        // false matches when only OR conditions were used.
        const matchedDeals = await sql`
          SELECT id FROM deals
          WHERE client_name ILIKE ${project.client_name}
          AND company ILIKE ${project.company || '___NOMATCH___'}
          AND NOT EXISTS (
            SELECT 1 FROM projects p2 WHERE p2.deal_id = deals.id
          )
          LIMIT 1
        `
        if (matchedDeals.length > 0) {
          await sql`
            UPDATE projects SET deal_id = ${matchedDeals[0].id}, updated_at = NOW()
            WHERE id = ${project.id}
          `
          summary.fkReconciliation.dealsLinkedToProjects++
          details.push({ action: 'link_project_to_deal', projectId: project.id, dealId: matchedDeals[0].id })
        }
      } catch (err) {
        console.error(`Error linking project ${project.id} to deal:`, err)
        summary.errors++
      }
    }

    // Step 1.2 — Set project_id on orphaned contracts
    try {
      const contractResult = await sql`
        UPDATE contracts c SET project_id = p.id, updated_at = NOW()
        FROM projects p
        WHERE c.deal_id = p.deal_id
        AND c.deal_id IS NOT NULL
        AND c.project_id IS NULL
        RETURNING c.id as contract_id, p.id as project_id
      `
      summary.fkReconciliation.contractsLinkedToProjects = contractResult.length
      for (const row of contractResult) {
        details.push({ action: 'link_contract_to_project', contractId: row.contract_id, projectId: row.project_id })
      }
    } catch (err) {
      console.error('Error linking contracts to projects:', err)
      summary.errors++
    }

    // Step 1.3 — Set deal_id on orphaned invoices
    try {
      const invoiceResult = await sql`
        UPDATE invoices i SET deal_id = p.deal_id, updated_at = NOW()
        FROM projects p
        WHERE i.project_id = p.id
        AND i.deal_id IS NULL
        AND p.deal_id IS NOT NULL
        RETURNING i.id as invoice_id, p.deal_id as deal_id
      `
      summary.fkReconciliation.invoicesLinkedToDeals = invoiceResult.length
      for (const row of invoiceResult) {
        details.push({ action: 'link_invoice_to_deal', invoiceId: row.invoice_id, dealId: row.deal_id })
      }
    } catch (err) {
      console.error('Error linking invoices to deals:', err)
      summary.errors++
    }

    // =========================================
    // PHASE 2: CREATE MISSING ENTITIES
    // =========================================

    // Fetch all non-cancelled projects with related data
    const projects = await sql`
      SELECT p.id, p.project_name, p.client_name, p.client_email, p.company,
             p.event_name, p.event_date, p.event_location, p.event_type,
             p.budget, p.speaker_fee, p.status, p.deal_id, p.attendee_count,
             p.requested_speaker_name, p.description, p.notes,
             p.travel_buyout,
             d.deal_value, d.budget_range, d.speaker_requested,
             d.event_title as deal_event_title, d.client_email as deal_client_email,
             CASE WHEN p.deal_id IS NOT NULL THEN
               EXISTS(SELECT 1 FROM proposals prop WHERE prop.deal_id = p.deal_id)
             ELSE false END as has_proposal,
             EXISTS(SELECT 1 FROM contracts c WHERE c.project_id = p.id) as has_contract,
             EXISTS(SELECT 1 FROM invoices i WHERE i.project_id = p.id) as has_invoices
      FROM projects p
      LEFT JOIN deals d ON p.deal_id = d.id
      WHERE p.status NOT IN ('cancelled')
      ORDER BY p.id
    `

    summary.projectsProcessed = projects.length

    for (const project of projects) {
      const stage = project.status
      const needsProposal = PROPOSAL_STAGES.includes(stage) && !project.has_proposal && project.deal_id
      const needsContract = CONTRACT_STAGES.includes(stage) && !project.has_contract
      const needsInvoices = CONTRACT_STAGES.includes(stage) && !project.has_invoices

      // --- Create Proposal ---
      if (needsProposal && project.client_name && project.client_email) {
        try {
          const countResult = await sql`SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM proposals`
          const count = Number(countResult[0].next_id) + summary.entitiesCreated.proposals
          const year = new Date().getFullYear()
          const proposalNumber = `PROP-${year}-${String(count).padStart(4, '0')}`

          // Generate 40-char random access token
          const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
          let accessToken = ''
          for (let i = 0; i < 40; i++) {
            accessToken += chars.charAt(Math.floor(Math.random() * chars.length))
          }

          const totalInvestment = Number(project.budget) || Number(project.deal_value) || 0
          const speakerFee = Number(project.speaker_fee) || 0
          const eventTitle = project.event_name || project.deal_event_title || project.project_name
          const speakerName = project.requested_speaker_name || project.speaker_requested || null

          const speakers = speakerName ? JSON.stringify([{
            name: speakerName,
            bio: '',
            topics: [],
            fee: speakerFee,
            fee_status: 'estimated'
          }]) : '[]'

          // Status: draft if at proposal stage, accepted if at contracts_signed+
          const proposalStatus = CONTRACT_STAGES.includes(stage) ? 'accepted' : 'draft'
          const validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

          await sql`
            INSERT INTO proposals (
              deal_id, proposal_number, title, status, version,
              client_name, client_email, client_company,
              executive_summary, speakers,
              event_title, event_date, event_location, event_type,
              attendee_count,
              services, deliverables, total_investment,
              payment_terms, payment_schedule,
              testimonials, case_studies,
              valid_until, access_token
            ) VALUES (
              ${project.deal_id},
              ${proposalNumber},
              ${`Speaking Engagement Proposal for ${project.company || project.client_name}`},
              ${proposalStatus},
              1,
              ${project.client_name},
              ${project.client_email},
              ${project.company || null},
              ${`We are pleased to present this proposal for ${eventTitle}. Our speaker will deliver an engaging and impactful presentation tailored to your audience.`},
              ${speakers}::jsonb,
              ${eventTitle},
              ${project.event_date || null},
              ${project.event_location || null},
              ${project.event_type || null},
              ${project.attendee_count || null},
              '[]'::jsonb,
              '[]'::jsonb,
              ${totalInvestment},
              ${'50% due upon contract signing, 50% due before event date'},
              '[]'::jsonb,
              '[]'::jsonb,
              '[]'::jsonb,
              ${validUntil},
              ${accessToken}
            )
          `

          summary.entitiesCreated.proposals++
          details.push({
            action: 'create_proposal', projectId: project.id,
            proposalNumber, status: proposalStatus, amount: totalInvestment
          })
        } catch (err) {
          console.error(`Error creating proposal for project ${project.id}:`, err)
          summary.errors++
        }
      }

      // --- Create Contract ---
      if (needsContract && project.client_name) {
        try {
          const contractDate = new Date().toISOString().slice(0, 10).replace(/-/g, '')
          const contractRandom = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
          const contractNumber = `CTR-${contractDate}-${contractRandom}`
          const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
          const dealValue = Number(project.budget) || Number(project.deal_value) || 0
          const speakerName = project.requested_speaker_name || project.speaker_requested || null
          const speakerFee = Number(project.speaker_fee) || dealValue
          const eventTitle = project.event_name || project.deal_event_title || project.project_name

          await sql`
            INSERT INTO contracts (
              deal_id, project_id, contract_number, title, type, status,
              fee_amount, payment_terms,
              event_title, event_date, event_location, event_type,
              client_name, client_email, client_company,
              speaker_name, speaker_fee,
              expires_at, created_by
            ) VALUES (
              ${project.deal_id || null},
              ${project.id},
              ${contractNumber},
              ${`Speaker Engagement Agreement - ${eventTitle}`},
              'client_speaker',
              'draft',
              ${dealValue},
              ${'Payment due within 30 days of event completion'},
              ${eventTitle},
              ${project.event_date || null},
              ${project.event_location || null},
              ${project.event_type || null},
              ${project.client_name},
              ${project.client_email || project.deal_client_email || null},
              ${project.company || null},
              ${speakerName},
              ${speakerFee},
              ${expiresAt},
              ${'system-connect-entities'}
            )
          `

          summary.entitiesCreated.contracts++
          details.push({
            action: 'create_contract', projectId: project.id,
            contractNumber, amount: dealValue
          })
        } catch (err) {
          console.error(`Error creating contract for project ${project.id}:`, err)
          summary.errors++
        }
      }

      // --- Create Invoice Pair ---
      if (needsInvoices && project.client_name) {
        try {
          // Total to Collect = Deal Value + Travel Buyout
          const dealValue = Number(project.budget) || Number(project.deal_value) || 0
          const travelBuyout = Number(project.travel_buyout) || 0
          const effectiveTotal = dealValue + travelBuyout

          if (effectiveTotal === 0) {
            details.push({
              action: 'skip_invoices', projectId: project.id,
              reason: 'Total amount is 0'
            })
            continue
          }

          const clientEmail = project.client_email || project.deal_client_email ||
            `${project.client_name.toLowerCase().replace(/\s+/g, '.')}@pending.info`

          const depositAmount = effectiveTotal * 0.5
          const finalAmount = effectiveTotal - depositAmount

          const now = new Date()
          const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
          const depositInvoiceNumber = `INV-DEP-${yearMonth}-${project.id}`
          const finalInvoiceNumber = `INV-FIN-${yearMonth}-${project.id}`

          const eventDate = project.event_date ||
            new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString()

          const [depositInvoice] = await sql`
            INSERT INTO invoices (
              project_id, deal_id, invoice_number, invoice_type, amount, status,
              issue_date, due_date, description,
              client_name, client_email, client_company
            ) VALUES (
              ${project.id},
              ${project.deal_id || null},
              ${depositInvoiceNumber},
              'deposit',
              ${depositAmount},
              'draft',
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP + INTERVAL '30 days',
              ${'Initial deposit (50% of total fee) for keynote presentation'},
              ${project.client_name},
              ${clientEmail},
              ${project.company || null}
            )
            RETURNING id
          `

          await sql`
            INSERT INTO invoices (
              project_id, deal_id, invoice_number, invoice_type, amount, status,
              issue_date, due_date, description,
              client_name, client_email, client_company,
              parent_invoice_id
            ) VALUES (
              ${project.id},
              ${project.deal_id || null},
              ${finalInvoiceNumber},
              'final',
              ${finalAmount},
              'draft',
              CURRENT_TIMESTAMP,
              ${eventDate},
              ${'Final payment (50% of total fee) due on event date'},
              ${project.client_name},
              ${clientEmail},
              ${project.company || null},
              ${depositInvoice.id}
            )
          `

          summary.entitiesCreated.invoicePairs++
          details.push({
            action: 'create_invoice_pair', projectId: project.id,
            depositNumber: depositInvoiceNumber, finalNumber: finalInvoiceNumber,
            total: effectiveTotal, deposit: depositAmount, final: finalAmount
          })
        } catch (err) {
          console.error(`Error creating invoices for project ${project.id}:`, err)
          summary.errors++
        }
      }
    }

    return NextResponse.json({
      success: true,
      summary,
      details
    })
  } catch (error) {
    console.error('Connect entities error:', error)
    return NextResponse.json({
      error: 'Failed to connect entities',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

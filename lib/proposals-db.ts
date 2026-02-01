import { neon } from "@neondatabase/serverless"
import type { Deal } from "./deals-db"

// Initialize Neon client with error handling
let sql: any = null
let databaseAvailable = false

try {
  if (process.env.DATABASE_URL) {
    console.log("Proposals DB: Initializing Neon client...")
    sql = neon(process.env.DATABASE_URL)
    databaseAvailable = true
    console.log("Proposals DB: Neon client initialized successfully")
  } else {
    console.warn("DATABASE_URL environment variable is not set - proposals database unavailable")
  }
} catch (error) {
  console.error("Failed to initialize Neon client for proposals:", error)
}

export interface Speaker {
  id?: number
  name: string
  slug?: string
  title?: string
  bio: string
  topics: string[]
  fee: number
  fee_status?: 'confirmed' | 'estimated'
  image_url?: string
  video_url?: string
  availability_confirmed?: boolean
  relevance_text?: string
}

export interface Service {
  name: string
  description: string
  duration?: string
  price: number
  included: boolean
}

export interface Deliverable {
  name: string
  description: string
  timeline: string
}

export interface PaymentMilestone {
  amount: number
  percentage?: number
  due_date: string
  description: string
}

export interface Testimonial {
  quote: string
  author: string
  title?: string
  company?: string
}

export interface CaseStudy {
  title: string
  description: string
  results: string[]
  link?: string
}

export interface Proposal {
  id: number
  deal_id?: number
  proposal_number: string
  title: string
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
  version: number
  
  // Client info
  client_name: string
  client_email: string
  client_company?: string
  client_title?: string
  
  // Content
  executive_summary?: string
  speakers: Speaker[]
  
  // Event details
  event_title?: string
  event_date?: string
  event_location?: string
  event_type?: string
  event_format?: 'in-person' | 'virtual' | 'hybrid'
  attendee_count?: number
  event_description?: string
  
  // Services & Investment
  services: Service[]
  deliverables: Deliverable[]
  subtotal?: number
  discount_percentage?: number
  discount_amount?: number
  total_investment: number
  
  // Payment
  payment_terms?: string
  payment_schedule: PaymentMilestone[]
  
  // Additional content
  why_us?: string
  testimonials: Testimonial[]
  case_studies: CaseStudy[]
  terms_conditions?: string
  
  // Validity
  valid_until?: string
  
  // Tracking
  access_token: string
  views: number
  first_viewed_at?: string
  last_viewed_at?: string
  
  // Acceptance
  accepted_at?: string
  accepted_by?: string
  acceptance_notes?: string
  rejected_at?: string
  rejected_by?: string
  rejection_reason?: string
  
  // Metadata
  created_by?: string
  created_at: string
  updated_at: string
  sent_at?: string
}

export interface ProposalView {
  id: number
  proposal_id: number
  viewed_at: string
  ip_address?: string
  user_agent?: string
  referrer?: string
  session_id?: string
  time_spent_seconds?: number
  sections_viewed?: string[]
  device_type?: string
  browser?: string
  os?: string
  country?: string
  city?: string
}

// Generate a secure random token
function generateSecureToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// Generate a unique proposal number based on existing max
async function generateUniqueProposalNumber(): Promise<string> {
  const year = new Date().getFullYear()

  try {
    // Find the max proposal number for this year
    const [result] = await sql`
      SELECT MAX(CAST(SUBSTRING(proposal_number FROM 'PROP-${year}-([0-9]+)') AS INTEGER)) as max_num
      FROM proposals
      WHERE proposal_number LIKE ${'PROP-' + year + '-%'}
    `

    const nextNum = (result?.max_num || 0) + 1
    return `PROP-${year}-${nextNum.toString().padStart(4, '0')}`
  } catch (error) {
    // Fallback: use timestamp-based number
    const timestamp = Date.now().toString().slice(-6)
    return `PROP-${year}-${timestamp}`
  }
}

// Create a new proposal
export async function createProposal(proposalData: Omit<Proposal, 'id' | 'created_at' | 'updated_at' | 'proposal_number' | 'access_token' | 'views'>): Promise<Proposal | null> {
  if (!databaseAvailable || !sql) {
    console.warn("createProposal: Database not available")
    return null
  }

  console.log("Creating proposal with data:", {
    client_name: proposalData.client_name,
    client_email: proposalData.client_email,
    status: proposalData.status,
    total_investment: proposalData.total_investment,
    speakers_count: proposalData.speakers?.length
  })

  // Retry up to 3 times with unique proposal numbers
  const maxRetries = 3
  let lastError: Error | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Generate proposal number - use our own function instead of the DB function
      const proposal_number = await generateUniqueProposalNumber()
      console.log(`Attempt ${attempt}: Generated proposal number: ${proposal_number}`)

      // Generate access token
      const access_token = generateSecureToken(40)

      const [proposal] = await sql`
        INSERT INTO proposals (
          deal_id, proposal_number, title, status, version,
          client_name, client_email, client_company, client_title,
          executive_summary, speakers,
          event_title, event_date, event_location, event_type, event_format,
          attendee_count, event_description,
          services, deliverables,
          subtotal, discount_percentage, discount_amount, total_investment,
          payment_terms, payment_schedule,
          why_us, testimonials, case_studies, terms_conditions,
          valid_until, access_token, created_by
        ) VALUES (
          ${proposalData.deal_id}, ${proposal_number}, ${proposalData.title},
          ${proposalData.status || 'draft'}, ${proposalData.version || 1},
          ${proposalData.client_name}, ${proposalData.client_email},
          ${proposalData.client_company}, ${proposalData.client_title},
          ${proposalData.executive_summary}, ${JSON.stringify(proposalData.speakers || [])},
          ${proposalData.event_title}, ${proposalData.event_date},
          ${proposalData.event_location}, ${proposalData.event_type}, ${proposalData.event_format},
          ${proposalData.attendee_count}, ${proposalData.event_description},
          ${JSON.stringify(proposalData.services || [])}, ${JSON.stringify(proposalData.deliverables || [])},
          ${proposalData.subtotal}, ${proposalData.discount_percentage || 0},
          ${proposalData.discount_amount || 0}, ${proposalData.total_investment},
          ${proposalData.payment_terms}, ${JSON.stringify(proposalData.payment_schedule || [])},
          ${proposalData.why_us}, ${JSON.stringify(proposalData.testimonials || [])},
          ${JSON.stringify(proposalData.case_studies || [])}, ${proposalData.terms_conditions},
          ${proposalData.valid_until}, ${access_token}, ${proposalData.created_by}
        )
        RETURNING *
      `

      console.log(`Proposal created successfully with number: ${proposal_number}`)

      return {
        ...proposal,
        speakers: proposal.speakers || [],
        services: proposal.services || [],
        deliverables: proposal.deliverables || [],
        payment_schedule: proposal.payment_schedule || [],
        testimonials: proposal.testimonials || [],
        case_studies: proposal.case_studies || []
      } as Proposal
    } catch (error: any) {
      lastError = error

      // Check if it's a duplicate key error
      if (error.code === '23505' && error.constraint === 'proposals_proposal_number_key') {
        console.warn(`Attempt ${attempt}: Duplicate proposal number, retrying...`)
        // Wait a bit before retrying to reduce collision chance
        await new Promise(resolve => setTimeout(resolve, 100 * attempt))
        continue
      }

      // For other errors, don't retry
      console.error("Error creating proposal:", error)
      console.error("Error details:", {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
      return null
    }
  }

  console.error("Failed to create proposal after all retries:", lastError)
  return null
}

// Get all proposals
export async function getAllProposals(): Promise<Proposal[]> {
  if (!databaseAvailable || !sql) {
    console.warn("getAllProposals: Database not available")
    return []
  }

  try {
    const proposals = await sql`
      SELECT p.*, d.client_name as deal_client_name, d.event_title as deal_event_title
      FROM proposals p
      LEFT JOIN deals d ON p.deal_id = d.id
      ORDER BY p.created_at DESC
    `
    
    return proposals.map((p: any) => ({
      ...p,
      speakers: p.speakers || [],
      services: p.services || [],
      deliverables: p.deliverables || [],
      payment_schedule: p.payment_schedule || [],
      testimonials: p.testimonials || [],
      case_studies: p.case_studies || []
    })) as Proposal[]
  } catch (error) {
    console.error("Error fetching proposals:", error)
    return []
  }
}

// Get proposal by ID
export async function getProposalById(id: number): Promise<Proposal | null> {
  if (!databaseAvailable || !sql) {
    console.warn("getProposalById: Database not available")
    return null
  }

  try {
    const [proposal] = await sql`
      SELECT p.*, d.client_name as deal_client_name, d.event_title as deal_event_title
      FROM proposals p
      LEFT JOIN deals d ON p.deal_id = d.id
      WHERE p.id = ${id}
    `
    
    if (!proposal) return null
    
    return {
      ...proposal,
      speakers: proposal.speakers || [],
      services: proposal.services || [],
      deliverables: proposal.deliverables || [],
      payment_schedule: proposal.payment_schedule || [],
      testimonials: proposal.testimonials || [],
      case_studies: proposal.case_studies || []
    } as Proposal
  } catch (error) {
    console.error("Error fetching proposal by ID:", error)
    return null
  }
}

// Get proposal by access token (for public viewing)
export async function getProposalByToken(token: string): Promise<Proposal | null> {
  if (!databaseAvailable || !sql) {
    console.warn("getProposalByToken: Database not available")
    return null
  }

  try {
    const [proposal] = await sql`
      SELECT * FROM proposals
      WHERE access_token = ${token}
      AND status != 'draft'
    `
    
    if (!proposal) return null
    
    // Update view count and last viewed timestamp
    await sql`
      UPDATE proposals
      SET 
        views = views + 1,
        last_viewed_at = CURRENT_TIMESTAMP,
        first_viewed_at = CASE 
          WHEN first_viewed_at IS NULL THEN CURRENT_TIMESTAMP 
          ELSE first_viewed_at 
        END
      WHERE id = ${proposal.id}
    `
    
    return {
      ...proposal,
      speakers: proposal.speakers || [],
      services: proposal.services || [],
      deliverables: proposal.deliverables || [],
      payment_schedule: proposal.payment_schedule || [],
      testimonials: proposal.testimonials || [],
      case_studies: proposal.case_studies || []
    } as Proposal
  } catch (error) {
    console.error("Error fetching proposal by token:", error)
    return null
  }
}

// Update proposal
export async function updateProposal(id: number, proposalData: Partial<Proposal>): Promise<Proposal | null> {
  if (!databaseAvailable || !sql) {
    console.warn("updateProposal: Database not available")
    return null
  }

  try {
    // Build dynamic update query
    const updates: string[] = []
    const values: any[] = []
    let paramCount = 1

    const updateFields = [
      'title', 'status', 'client_name', 'client_email', 'client_company', 'client_title',
      'executive_summary', 'event_title', 'event_date', 'event_location', 'event_type',
      'event_format', 'attendee_count', 'event_description', 'subtotal', 'discount_percentage',
      'discount_amount', 'total_investment', 'payment_terms', 'why_us', 'terms_conditions',
      'valid_until'
    ]

    for (const field of updateFields) {
      if (proposalData[field as keyof Proposal] !== undefined) {
        updates.push(`${field} = $${paramCount}`)
        values.push(proposalData[field as keyof Proposal])
        paramCount++
      }
    }

    // Handle JSON fields
    const jsonFields = ['speakers', 'services', 'deliverables', 'payment_schedule', 'testimonials', 'case_studies']
    for (const field of jsonFields) {
      if (proposalData[field as keyof Proposal] !== undefined) {
        updates.push(`${field} = $${paramCount}`)
        values.push(JSON.stringify(proposalData[field as keyof Proposal]))
        paramCount++
      }
    }

    if (updates.length === 0) return null

    values.push(id)
    
    const query = `
      UPDATE proposals
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramCount}
      RETURNING *
    `

    const [proposal] = await sql(query, values)
    
    return {
      ...proposal,
      speakers: proposal.speakers || [],
      services: proposal.services || [],
      deliverables: proposal.deliverables || [],
      payment_schedule: proposal.payment_schedule || [],
      testimonials: proposal.testimonials || [],
      case_studies: proposal.case_studies || []
    } as Proposal
  } catch (error) {
    console.error("Error updating proposal:", error)
    return null
  }
}

// Update proposal status
export async function updateProposalStatus(id: number, status: Proposal['status'], additionalData?: {
  accepted_by?: string
  acceptance_notes?: string
  rejected_by?: string
  rejection_reason?: string
}): Promise<boolean> {
  if (!databaseAvailable || !sql) {
    console.warn("updateProposalStatus: Database not available")
    return false
  }

  try {
    const updates: any = { status }
    
    if (status === 'sent') {
      updates.sent_at = sql`CURRENT_TIMESTAMP`
    } else if (status === 'accepted' && additionalData) {
      updates.accepted_at = sql`CURRENT_TIMESTAMP`
      updates.accepted_by = additionalData.accepted_by
      updates.acceptance_notes = additionalData.acceptance_notes
    } else if (status === 'rejected' && additionalData) {
      updates.rejected_at = sql`CURRENT_TIMESTAMP`
      updates.rejected_by = additionalData.rejected_by
      updates.rejection_reason = additionalData.rejection_reason
    }

    await sql`
      UPDATE proposals
      SET ${sql(updates)}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `
    
    return true
  } catch (error) {
    console.error("Error updating proposal status:", error)
    return false
  }
}

// Track proposal view
export async function trackProposalView(viewData: Omit<ProposalView, 'id' | 'viewed_at'>): Promise<ProposalView | null> {
  if (!databaseAvailable || !sql) {
    console.warn("trackProposalView: Database not available")
    return null
  }

  try {
    const [view] = await sql`
      INSERT INTO proposal_views (
        proposal_id, ip_address, user_agent, referrer,
        session_id, time_spent_seconds, sections_viewed,
        device_type, browser, os, country, city
      ) VALUES (
        ${viewData.proposal_id}, ${viewData.ip_address}, ${viewData.user_agent},
        ${viewData.referrer}, ${viewData.session_id}, ${viewData.time_spent_seconds},
        ${JSON.stringify(viewData.sections_viewed || [])}, ${viewData.device_type},
        ${viewData.browser}, ${viewData.os}, ${viewData.country}, ${viewData.city}
      )
      RETURNING *
    `
    
    return view as ProposalView
  } catch (error) {
    console.error("Error tracking proposal view:", error)
    return null
  }
}

// Get proposal views
export async function getProposalViews(proposalId: number): Promise<ProposalView[]> {
  if (!databaseAvailable || !sql) {
    console.warn("getProposalViews: Database not available")
    return []
  }

  try {
    const views = await sql`
      SELECT * FROM proposal_views
      WHERE proposal_id = ${proposalId}
      ORDER BY viewed_at DESC
    `
    
    return views as ProposalView[]
  } catch (error) {
    console.error("Error fetching proposal views:", error)
    return []
  }
}

// Delete proposal
export async function deleteProposal(id: number): Promise<boolean> {
  if (!databaseAvailable || !sql) {
    console.warn("deleteProposal: Database not available")
    return false
  }

  try {
    await sql`DELETE FROM proposals WHERE id = ${id}`
    return true
  } catch (error) {
    console.error("Error deleting proposal:", error)
    return false
  }
}

// Duplicate proposal (create new version)
export async function duplicateProposal(id: number): Promise<Proposal | null> {
  if (!databaseAvailable || !sql) {
    console.warn("duplicateProposal: Database not available")
    return null
  }

  try {
    const original = await getProposalById(id)
    if (!original) return null
    
    const newProposal = {
      ...original,
      status: 'draft' as const,
      version: original.version + 1,
      views: 0,
      first_viewed_at: undefined,
      last_viewed_at: undefined,
      accepted_at: undefined,
      accepted_by: undefined,
      acceptance_notes: undefined,
      rejected_at: undefined,
      rejected_by: undefined,
      rejection_reason: undefined,
      sent_at: undefined
    }
    
    delete (newProposal as any).id
    delete (newProposal as any).created_at
    delete (newProposal as any).updated_at
    delete (newProposal as any).proposal_number
    delete (newProposal as any).access_token
    
    return await createProposal(newProposal)
  } catch (error) {
    console.error("Error duplicating proposal:", error)
    return null
  }
}
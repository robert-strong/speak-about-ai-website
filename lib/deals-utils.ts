import { neon } from '@neondatabase/serverless'

// Initialize Neon client
let sql: any = null
try {
  if (process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL)
  }
} catch (error) {
  console.error('Failed to initialize Neon client for deals:', error)
}

export interface DealFormData {
  clientName: string
  clientEmail: string
  phone?: string
  organizationName?: string
  specificSpeaker?: string
  eventDate?: string
  eventDates?: string[]
  eventLocation?: string
  eventBudget?: string
  additionalInfo?: string
  wishlistSpeakers?: Array<{
    id: number
    name: string
  }>
  // Request type (keynote vs workshop)
  requestType?: 'keynote' | 'workshop'
  // Workshop-specific fields
  selectedWorkshop?: string
  selectedWorkshopId?: number
  hasNoWorkshopInMind?: boolean
  numberOfParticipants?: string
  participantSkillLevel?: string
  preferredFormat?: string
}

export interface Deal {
  id: number
  clientName: string
  clientEmail: string
  phone?: string
  company?: string
  organizationName?: string
  eventTitle?: string
  eventDate?: string
  eventLocation?: string
  dealValue?: number
  eventBudget?: string
  status: 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  specificSpeaker?: string
  additionalInfo?: string
  wishlistSpeakers?: any[]
  source: string
  notes?: string
  createdAt: string
  // Request type and workshop fields
  requestType?: 'keynote' | 'workshop'
  selectedWorkshop?: string
  selectedWorkshopId?: number
  numberOfParticipants?: string
  participantSkillLevel?: string
  preferredFormat?: string
}

/**
 * Create a new deal from form submission
 */
export async function createDeal(formData: DealFormData, sessionId?: string): Promise<number | null> {
  if (!sql) {
    console.error('Deals database not available')
    return null
  }

  try {
    // Determine deal value based on budget range
    const dealValue = estimateDealValue(formData.eventBudget)

    // Determine event type and title based on request type
    const isWorkshop = formData.requestType === 'workshop'
    const eventType = isWorkshop ? 'Workshop' : 'Keynote'
    const eventTitle = isWorkshop
      ? `AI Workshop: ${formData.selectedWorkshop || 'TBD'}`
      : 'AI Keynote Speaking Engagement'

    // For workshops, include workshop details in additional info
    let additionalInfo = formData.additionalInfo || ''
    if (isWorkshop) {
      const workshopDetails = []
      if (formData.selectedWorkshop) workshopDetails.push(`Workshop: ${formData.selectedWorkshop}`)
      if (formData.numberOfParticipants) workshopDetails.push(`Participants: ${formData.numberOfParticipants}`)
      if (formData.participantSkillLevel) workshopDetails.push(`Skill Level: ${formData.participantSkillLevel}`)
      if (formData.preferredFormat) workshopDetails.push(`Format: ${formData.preferredFormat}`)
      if (workshopDetails.length > 0) {
        additionalInfo = `[WORKSHOP DETAILS]\n${workshopDetails.join('\n')}\n\n${additionalInfo}`.trim()
      }
    }

    // For workshops, use selectedWorkshop as the speaker/request field
    const speakerOrWorkshop = isWorkshop
      ? formData.selectedWorkshop
      : formData.specificSpeaker

    // Create the main deal record
    const dealResult = await sql`
      INSERT INTO deals (
        client_name, client_email, client_phone, phone, organization_name, company,
        event_title, event_date, event_location, event_type, attendee_count,
        budget_range, deal_value, event_budget,
        status, priority, specific_speaker, speaker_requested, additional_info,
        wishlist_speakers, source, created_at, last_contact
      ) VALUES (
        ${formData.clientName},
        ${formData.clientEmail},
        ${formData.phone || null},
        ${formData.phone || null},
        ${formData.organizationName || null},
        ${formData.organizationName || 'Unknown'},
        ${eventTitle},
        ${formData.eventDate || new Date().toISOString().split('T')[0]},
        ${formData.eventLocation || 'TBD'},
        ${eventType},
        ${isWorkshop ? (parseInt(formData.numberOfParticipants?.split('-')[0] || '0') || 25) : 100},
        ${formData.eventBudget || 'TBD'},
        ${dealValue},
        ${formData.eventBudget || null},
        ${'lead'},
        ${determinePriority(formData)},
        ${speakerOrWorkshop || null},
        ${speakerOrWorkshop || null},
        ${additionalInfo || null},
        ${JSON.stringify(formData.wishlistSpeakers || [])},
        ${'website_form'},
        CURRENT_TIMESTAMP,
        CURRENT_DATE
      )
      RETURNING id
    `

    const dealId = dealResult[0]?.id

    if (dealId && formData.wishlistSpeakers && formData.wishlistSpeakers.length > 0) {
      // Create speaker interest records
      for (const speaker of formData.wishlistSpeakers) {
        await sql`
          INSERT INTO deal_speaker_interests (deal_id, speaker_id, interest_type)
          VALUES (${dealId}, ${speaker.id}, 'wishlist')
        `
      }
    }

    return dealId
  } catch (error) {
    console.error('Failed to create deal:', error)
    return null
  }
}

/**
 * Get deal by ID with full details
 */
export async function getDealById(dealId: number): Promise<Deal | null> {
  if (!sql) return null

  try {
    const result = await sql`
      SELECT 
        d.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'id', s.id,
              'name', s.name,
              'headshot_url', s.headshot_url,
              'interest_type', dsi.interest_type
            )
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) as interested_speakers
      FROM deals d
      LEFT JOIN deal_speaker_interests dsi ON d.id = dsi.deal_id
      LEFT JOIN speakers s ON dsi.speaker_id = s.id
      WHERE d.id = ${dealId}
      GROUP BY d.id
    `

    if (result.length === 0) return null

    const deal = result[0]
    return {
      id: deal.id,
      clientName: deal.client_name,
      clientEmail: deal.client_email,
      phone: deal.phone,
      company: deal.company,
      organizationName: deal.organization_name,
      eventTitle: deal.event_title,
      eventDate: deal.event_date,
      eventLocation: deal.event_location,
      dealValue: deal.deal_value,
      eventBudget: deal.event_budget,
      status: deal.status,
      priority: deal.priority,
      specificSpeaker: deal.specific_speaker,
      additionalInfo: deal.additional_info,
      wishlistSpeakers: deal.wishlist_speakers,
      source: deal.source,
      notes: deal.notes,
      createdAt: deal.created_at,
      // Derive request type from event_type
      requestType: deal.event_type === 'Workshop' ? 'workshop' : 'keynote'
    }
  } catch (error) {
    console.error('Failed to get deal:', error)
    return null
  }
}

/**
 * Estimate deal value based on budget range
 */
function estimateDealValue(budgetRange?: string): number {
  if (!budgetRange) return 15000 // Default estimate

  const budget = budgetRange.toLowerCase()
  
  if (budget.includes('under') || budget.includes('< ')) {
    if (budget.includes('10k') || budget.includes('10,000')) return 7500
    if (budget.includes('25k') || budget.includes('25,000')) return 15000
  }
  
  if (budget.includes('10k') && budget.includes('25k')) return 17500
  if (budget.includes('25k') && budget.includes('50k')) return 37500
  if (budget.includes('50k') && budget.includes('100k')) return 75000
  if (budget.includes('100k+') || budget.includes('over 100k')) return 150000
  
  // Try to extract numeric values
  const numbers = budget.match(/\d+/g)
  if (numbers && numbers.length > 0) {
    const firstNumber = parseInt(numbers[0])
    if (firstNumber < 100) return firstNumber * 1000 // Assume it's in thousands
    return firstNumber
  }
  
  return 15000 // Default fallback
}

/**
 * Determine priority based on form data
 */
function determinePriority(formData: DealFormData): 'low' | 'medium' | 'high' | 'urgent' {
  let score = 0
  
  // Budget scoring
  if (formData.eventBudget) {
    const budget = formData.eventBudget.toLowerCase()
    if (budget.includes('100k+') || budget.includes('over 100k')) score += 3
    else if (budget.includes('50k')) score += 2
    else if (budget.includes('25k')) score += 1
  }
  
  // Date urgency scoring
  if (formData.eventDate) {
    const eventDate = new Date(formData.eventDate)
    const today = new Date()
    const daysUntil = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysUntil < 30) score += 3
    else if (daysUntil < 90) score += 2
    else if (daysUntil < 180) score += 1
  }
  
  // Wishlist size scoring
  if (formData.wishlistSpeakers && formData.wishlistSpeakers.length > 2) score += 1
  
  // Specific speaker request scoring
  if (formData.specificSpeaker) score += 1
  
  // Organization name provided scoring
  if (formData.organizationName) score += 1
  
  if (score >= 6) return 'urgent'
  if (score >= 4) return 'high'
  if (score >= 2) return 'medium'
  return 'low'
}

/**
 * Update deal status
 */
export async function updateDealStatus(dealId: number, status: Deal['status']): Promise<boolean> {
  if (!sql) return false

  try {
    await sql`
      UPDATE deals 
      SET status = ${status}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${dealId}
    `
    return true
  } catch (error) {
    console.error('Failed to update deal status:', error)
    return false
  }
}

/**
 * Add notes to deal
 */
export async function addDealNotes(dealId: number, notes: string): Promise<boolean> {
  if (!sql) return false

  try {
    await sql`
      UPDATE deals 
      SET notes = COALESCE(notes || E'\n\n', '') || ${notes}, 
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ${dealId}
    `
    return true
  } catch (error) {
    console.error('Failed to add deal notes:', error)
    return false
  }
}
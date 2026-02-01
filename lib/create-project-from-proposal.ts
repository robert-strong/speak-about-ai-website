import { createProject } from "./projects-db"
import type { Proposal } from "./proposals-db"

export async function createProjectFromProposal(proposal: Proposal): Promise<number | null> {
  try {
    // Extract speaker names
    const speakerNames = proposal.speakers.map(s => s.name).filter(Boolean)
    const primarySpeaker = speakerNames[0] || "TBD"
    
    // Determine event classification based on format
    let eventClassification: 'virtual' | 'local' | 'travel' = 'local'
    if (proposal.event_format === 'virtual') {
      eventClassification = 'virtual'
    } else if (proposal.event_location && !proposal.event_location.toLowerCase().includes('virtual')) {
      // Simple heuristic - if location is not in same state/area, assume travel
      // In production, you'd want more sophisticated logic
      eventClassification = 'travel'
    }
    
    // Calculate payment milestones based on payment schedule
    const initialPayment = proposal.payment_schedule.find(p => 
      p.description.toLowerCase().includes('initial') || 
      p.description.toLowerCase().includes('deposit')
    )
    const finalPayment = proposal.payment_schedule.find(p => 
      p.description.toLowerCase().includes('final') || 
      p.description.toLowerCase().includes('completion')
    )
    
    // Create project data
    const projectData = {
      // Basic info from proposal
      client_name: proposal.client_name,
      event_name: proposal.event_title || `${proposal.client_company} Event`,
      event_date: proposal.event_date || new Date().toISOString(),
      location: proposal.event_location || "TBD",
      
      // Event details
      event_type: proposal.event_type || "Keynote",
      event_classification: eventClassification,
      audience_size: proposal.attendee_count || 0,
      audience_type: "Professional", // Default, could be enhanced
      
      // Speaker info
      speaker_id: null, // Would need to match with speaker database
      speaker_name: primarySpeaker,
      additional_speakers: speakerNames.slice(1).join(", ") || null,
      
      // Financial
      contract_value: proposal.total_investment,
      initial_payment_amount: initialPayment?.amount || (proposal.total_investment * 0.5),
      initial_payment_status: 'pending' as const,
      final_payment_amount: finalPayment?.amount || (proposal.total_investment * 0.5),
      final_payment_status: 'pending' as const,
      
      // Logistics (defaults - should be updated later)
      travel_required: eventClassification === 'travel',
      hotel_required: eventClassification === 'travel',
      flight_required: eventClassification === 'travel',
      ground_transportation_required: eventClassification === 'travel',
      meals_included: true,
      
      // Content from proposal
      presentation_topic: proposal.services.find(s => s.name.toLowerCase().includes('keynote'))?.description || "TBD",
      presentation_duration: "60 minutes", // Default
      content_customization_required: true,
      
      // Tech requirements (defaults)
      av_requirements: "Standard presentation setup",
      recording_permission: false,
      streaming_permission: false,
      
      // Marketing (defaults)
      promotional_requirements: "Standard promotional kit",
      social_media_promotion: true,
      
      // Stage tracking
      current_stage: 'contracting' as const,
      contracting_status: 'in_progress' as const,
      
      // Link to proposal
      notes: `Created from accepted proposal ${proposal.proposal_number}`,
      
      // Optional fields that might be in proposal
      rehearsal_required: proposal.services.some(s => 
        s.name.toLowerCase().includes('rehearsal') || 
        s.description.toLowerCase().includes('rehearsal')
      ),
      workshop: proposal.services.some(s => 
        s.name.toLowerCase().includes('workshop')
      ),
      panelist: proposal.services.some(s => 
        s.name.toLowerCase().includes('panel')
      ),
      moderator: proposal.services.some(s => 
        s.name.toLowerCase().includes('moderat')
      ),
      
      // Client contact info
      primary_contact_name: proposal.client_name,
      primary_contact_email: proposal.client_email,
      primary_contact_phone: "", // Not in proposal
      
      // Status
      project_status: 'active' as const
    }
    
    // Create the project
    const project = await createProject(projectData)
    
    if (project) {
      console.log(`Successfully created project ${project.id} from proposal ${proposal.proposal_number}`)
      return project.id
    }
    
    return null
  } catch (error) {
    console.error("Error creating project from proposal:", error)
    return null
  }
}
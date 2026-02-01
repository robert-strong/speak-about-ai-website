// Detailed task definitions for project management
export type EventClassification = 'local' | 'virtual' | 'travel'

export interface TaskDefinition {
  key: string
  name: string
  description: string
  requirements: string[]
  deliverables: string[]
  priority: 'critical' | 'high' | 'medium' | 'low'
  estimatedTime?: string // e.g., "30 min", "2 hours"
  owner?: 'sales' | 'operations' | 'speaker' | 'client'
  // Which event classifications this task applies to (omit for all)
  classifications?: EventClassification[]
}

export interface StageTaskDefinitions {
  [stage: string]: {
    [taskKey: string]: TaskDefinition
  }
}

export const TASK_DEFINITIONS: StageTaskDefinitions = {
  planning: {
    initial_discovery_call: {
      key: 'initial_discovery_call',
      name: 'Initial Discovery Call',
      description: 'Schedule and conduct initial discovery call to understand event requirements',
      requirements: [
        'Client contact information',
        'Preliminary event details',
        'Call scheduled'
      ],
      deliverables: [
        'Event requirements documented',
        'Client expectations clarified',
        'Budget range confirmed',
        'Follow-up actions identified'
      ],
      priority: 'critical',
      estimatedTime: '1 hour',
      owner: 'sales'
    },
    speaker_selection: {
      key: 'speaker_selection',
      name: 'Speaker Selection & Matching',
      description: 'Identify and recommend suitable speaker(s) based on client requirements',
      requirements: [
        'Event topic confirmed',
        'Audience demographics known',
        'Budget parameters established',
        'Event format defined'
      ],
      deliverables: [
        'Speaker recommendations sent',
        'Speaker availability confirmed',
        'Client decision received',
        'Speaker selected'
      ],
      priority: 'high',
      estimatedTime: '2 hours',
      owner: 'sales'
    },
    proposal_sent: {
      key: 'proposal_sent',
      name: 'Send Proposal to Client',
      description: 'Prepare and send formal proposal with speaker details and pricing',
      requirements: [
        'Speaker selected',
        'Pricing confirmed',
        'Event details documented',
        'Proposal template prepared'
      ],
      deliverables: [
        'Proposal document created',
        'Proposal sent to client',
        'Follow-up scheduled',
        'Client feedback received'
      ],
      priority: 'high',
      estimatedTime: '1.5 hours',
      owner: 'sales'
    },
    negotiate_terms: {
      key: 'negotiate_terms',
      name: 'Negotiate Terms & Conditions',
      description: 'Handle any negotiations on pricing, terms, or scope',
      requirements: [
        'Initial proposal reviewed by client',
        'Client feedback received',
        'Negotiation parameters defined'
      ],
      deliverables: [
        'Terms agreed upon',
        'Final pricing confirmed',
        'Special conditions documented',
        'Ready for contract'
      ],
      priority: 'medium',
      estimatedTime: '1 hour',
      owner: 'sales'
    }
  },

  contracts_signed: {
    // External Client Contract (first)
    prepare_client_contract: {
      key: 'prepare_client_contract',
      name: 'Prepare Client Contract',
      description: 'Draft and prepare the client engagement contract',
      requirements: [
        'Terms agreed with client',
        'Event details confirmed',
        'Pricing finalized',
        'Legal terms approved'
      ],
      deliverables: [
        'Contract document prepared',
        'Internal review completed',
        'Ready for client signature'
      ],
      priority: 'critical',
      estimatedTime: '1 hour',
      owner: 'operations'
    },
    send_client_contract: {
      key: 'send_client_contract',
      name: 'Send Contract to Client',
      description: 'Send contract to client for review and signature',
      requirements: [
        'Contract prepared',
        'Client contact confirmed',
        'DocuSign/signing method ready'
      ],
      deliverables: [
        'Contract sent to client',
        'Signature tracking initiated',
        'Client signed contract received'
      ],
      priority: 'critical',
      estimatedTime: '30 min',
      owner: 'operations'
    },
    client_contract_signed: {
      key: 'client_contract_signed',
      name: 'Client Contract Signed',
      description: 'Confirm client has signed and returned the contract',
      requirements: [
        'Contract sent to client',
        'Client reviewed terms'
      ],
      deliverables: [
        'Signed contract received',
        'Contract filed in system'
      ],
      priority: 'critical',
      estimatedTime: '15 min',
      owner: 'operations'
    },
    // Internal Speaker Contract (after client)
    prepare_speaker_agreement: {
      key: 'prepare_speaker_agreement',
      name: 'Prepare Speaker Agreement',
      description: 'Draft internal speaker agreement with event details and compensation',
      requirements: [
        'Client contract signed',
        'Event details confirmed',
        'Speaker fee agreed',
        'Terms and conditions ready'
      ],
      deliverables: [
        'Speaker agreement prepared',
        'Compensation terms documented',
        'Ready for speaker signature'
      ],
      priority: 'critical',
      estimatedTime: '45 min',
      owner: 'operations'
    },
    obtain_speaker_signature: {
      key: 'obtain_speaker_signature',
      name: 'Obtain Speaker Signature',
      description: 'Send agreement to speaker and obtain signed copy',
      requirements: [
        'Speaker agreement prepared',
        'Speaker contact confirmed'
      ],
      deliverables: [
        'Agreement sent to speaker',
        'Signed agreement received',
        'Filed in project folder'
      ],
      priority: 'critical',
      estimatedTime: '30 min',
      owner: 'operations'
    },
    file_signed_contracts: {
      key: 'file_signed_contracts',
      name: 'File All Signed Contracts',
      description: 'Organize and file all signed contracts in project folder',
      requirements: [
        'Client contract signed',
        'Speaker agreement signed',
        'Project folder created'
      ],
      deliverables: [
        'All contracts filed',
        'Project documentation complete',
        'Ready to proceed to invoicing'
      ],
      priority: 'high',
      estimatedTime: '15 min',
      owner: 'operations'
    }
  },

  invoicing: {
    send_internal_contract: {
      key: 'send_internal_contract',
      name: 'Send Internal Contract to Speaker',
      description: 'Send the internal speaker agreement for review and signature',
      requirements: [
        'Speaker details confirmed',
        'Event details finalized',
        'Fee structure agreed',
        'Terms and conditions ready'
      ],
      deliverables: [
        'Contract sent to speaker',
        'Signature tracking initiated',
        'Follow-up reminders scheduled',
        'Signed copy received and filed'
      ],
      priority: 'critical',
      estimatedTime: '30 min',
      owner: 'operations'
    },
    initial_invoice_sent: {
      key: 'initial_invoice_sent',
      name: 'Send Initial Deposit Invoice',
      description: 'Generate and send the 50% deposit invoice to the client with Net 30 payment terms',
      requirements: [
        'Confirmed event date and location',
        'Signed contract',
        'Client billing contact information',
        'Purchase order (if required)'
      ],
      deliverables: [
        'Invoice PDF sent via email',
        'Invoice logged in system',
        'Payment tracking initiated'
      ],
      priority: 'critical',
      estimatedTime: '30 min',
      owner: 'operations'
    },
    final_invoice_sent: {
      key: 'final_invoice_sent',
      name: 'Send Final Balance Invoice',
      description: 'Generate and send the remaining 50% balance invoice, due on event date',
      requirements: [
        'Initial deposit received',
        'Event details finalized',
        'Any additional charges documented'
      ],
      deliverables: [
        'Final invoice PDF sent',
        'Payment reminder scheduled',
        'Client notified of payment terms'
      ],
      priority: 'high',
      estimatedTime: '30 min',
      owner: 'operations'
    },
    kickoff_meeting_planned: {
      key: 'kickoff_meeting_planned',
      name: 'Schedule Client Kickoff Meeting',
      description: 'Coordinate and schedule initial project kickoff call with all stakeholders',
      requirements: [
        'Client availability confirmed',
        'Internal team availability checked',
        'Meeting agenda prepared',
        'Calendar invites ready'
      ],
      deliverables: [
        'Meeting scheduled in calendars',
        'Zoom/Teams link created',
        'Agenda shared with participants',
        'Pre-meeting materials sent'
      ],
      priority: 'high',
      estimatedTime: '45 min',
      owner: 'sales'
    },
    event_details_confirmed: {
      key: 'event_details_confirmed',
      name: 'Confirm All Event Specifications',
      description: 'Verify and document all event details including venue, timing, format, and special requirements',
      requirements: [
        'Venue details obtained',
        'Event schedule reviewed',
        'Technical requirements listed',
        'Special requests noted'
      ],
      deliverables: [
        'Event specification document',
        'Confirmation email sent to client',
        'Internal checklist updated',
        'Risk factors identified'
      ],
      priority: 'critical',
      estimatedTime: '2 hours',
      owner: 'operations'
    }
  },
  
  logistics_planning: {
    // For in-person events (local and travel)
    details_confirmed: {
      key: 'details_confirmed',
      name: 'Final Event Details Confirmation',
      description: 'Conduct final verification of all event logistics with client and venue',
      requirements: [
        'Venue contract reviewed',
        'Run of show approved',
        'Load-in times confirmed',
        'Parking/access arranged'
      ],
      deliverables: [
        'Final confirmation document',
        'Venue communication log',
        'Updated project timeline',
        'Client approval received'
      ],
      priority: 'critical',
      estimatedTime: '2 hours',
      owner: 'operations',
      classifications: ['local', 'travel']
    },
    // For virtual events
    virtual_platform_setup: {
      key: 'virtual_platform_setup',
      name: 'Virtual Platform Setup',
      description: 'Configure virtual event platform (Zoom, Teams, Webex) with all required settings',
      requirements: [
        'Platform selected and confirmed',
        'Meeting/webinar created',
        'Registration enabled if needed',
        'Recording settings configured'
      ],
      deliverables: [
        'Event link generated',
        'Host/co-host permissions set',
        'Waiting room/security configured',
        'Backup platform identified'
      ],
      priority: 'critical',
      estimatedTime: '1 hour',
      owner: 'operations',
      classifications: ['virtual']
    },
    av_requirements_gathered: {
      key: 'av_requirements_gathered',
      name: 'Compile A/V Technical Requirements',
      description: 'Document all audio/visual needs and coordinate with venue or AV vendor',
      requirements: [
        'Presentation format confirmed',
        'Microphone preferences noted',
        'Screen/projector specs obtained',
        'Recording requirements clarified'
      ],
      deliverables: [
        'AV requirements document',
        'Venue AV confirmation',
        'Backup plan documented',
        'Test schedule arranged'
      ],
      priority: 'high',
      estimatedTime: '1.5 hours',
      owner: 'operations',
      classifications: ['local', 'travel']
    },
    press_pack_sent: {
      key: 'press_pack_sent',
      name: 'Deliver Speaker Press Pack',
      description: 'Send comprehensive media kit including bio, headshots, and promotional materials',
      requirements: [
        'Updated speaker bio',
        'High-resolution headshots',
        'Speaking topics/abstracts',
        'Social media links'
      ],
      deliverables: [
        'Press pack PDF created',
        'Materials sent to client',
        'Confirmation received',
        'Usage rights clarified'
      ],
      priority: 'medium',
      estimatedTime: '1 hour',
      owner: 'operations'
      // No classifications = applies to all
    },
    // Travel itinerary - only for travel events
    calendar_confirmed: {
      key: 'calendar_confirmed',
      name: 'Confirm & Send Travel Itinerary',
      description: 'Finalize travel details including where to be and when, and send complete itinerary to speaker',
      requirements: [
        'Flight details confirmed',
        'Hotel/accommodation booked',
        'Ground transportation arranged',
        'Venue address and arrival time confirmed'
      ],
      deliverables: [
        'Complete itinerary sent to speaker',
        'Calendar invites with all details sent',
        'Speaker confirmation received',
        'Travel documents shared (tickets, confirmations)'
      ],
      priority: 'critical',
      estimatedTime: '1 hour',
      owner: 'operations',
      classifications: ['travel']
    },
    // Local event logistics - simpler than travel
    local_logistics_confirmed: {
      key: 'local_logistics_confirmed',
      name: 'Confirm Local Event Logistics',
      description: 'Send venue address, parking info, and arrival time to speaker',
      requirements: [
        'Venue address confirmed',
        'Parking arrangements made',
        'Arrival time set',
        'On-site contact identified'
      ],
      deliverables: [
        'Location details sent to speaker',
        'Calendar invite with address',
        'Speaker confirmation received',
        'Parking pass arranged if needed'
      ],
      priority: 'high',
      estimatedTime: '30 min',
      owner: 'operations',
      classifications: ['local']
    },
    // Virtual event timing - simpler logistics
    virtual_schedule_confirmed: {
      key: 'virtual_schedule_confirmed',
      name: 'Confirm Virtual Event Schedule',
      description: 'Send meeting link, login time, and run of show to speaker',
      requirements: [
        'Meeting link created',
        'Time zones confirmed',
        'Run of show finalized',
        'Login time set (15-30 min early)'
      ],
      deliverables: [
        'Calendar invite with link sent',
        'Time zone confirmed with speaker',
        'Run of show shared',
        'Speaker confirmation received'
      ],
      priority: 'high',
      estimatedTime: '30 min',
      owner: 'operations',
      classifications: ['virtual']
    },
    client_contact_obtained: {
      key: 'client_contact_obtained',
      name: 'Establish Day-of Contact Protocol',
      description: 'Set up communication plan for event day including emergency contacts',
      requirements: [
        'On-site contact identified',
        'Phone numbers verified',
        'Communication apps installed',
        'Backup contacts listed'
      ],
      deliverables: [
        'Contact sheet created',
        'WhatsApp/Slack group set up',
        'Emergency protocol defined',
        'All parties confirmed'
      ],
      priority: 'high',
      estimatedTime: '30 min',
      owner: 'operations'
      // No classifications = applies to all
    },
    speaker_materials_ready: {
      key: 'speaker_materials_ready',
      name: 'Prepare Speaker Presentation Materials',
      description: 'Finalize all presentation content and supporting materials',
      requirements: [
        'Presentation deck completed',
        'Handouts designed (if needed)',
        'Demo materials prepared',
        'Backup formats created'
      ],
      deliverables: [
        'Final presentation uploaded',
        'PDF backup created',
        'USB drive prepared',
        'Cloud backup confirmed'
      ],
      priority: 'high',
      estimatedTime: '3 hours',
      owner: 'speaker'
      // No classifications = applies to all
    },
    vendor_onboarding_complete: {
      key: 'vendor_onboarding_complete',
      name: 'Complete Vendor Onboarding Process',
      description: 'Ensure all vendor requirements are met including insurance, W9, and compliance',
      requirements: [
        'W9 form submitted',
        'Insurance certificates provided',
        'Vendor agreements signed',
        'Payment terms agreed'
      ],
      deliverables: [
        'Vendor profile completed',
        'Compliance verified',
        'Payment setup confirmed',
        'Access credentials provided'
      ],
      priority: 'medium',
      estimatedTime: '2 hours',
      owner: 'operations'
      // No classifications = applies to all
    }
  },
  
  pre_event: {
    logistics_confirmed: {
      key: 'logistics_confirmed',
      name: 'Final Logistics Verification',
      description: 'Complete final check of all logistical arrangements 48 hours before event',
      requirements: [
        'Travel confirmations printed',
        'Ground transportation arranged',
        'Hotel confirmations verified',
        'Event timing reconfirmed'
      ],
      deliverables: [
        'Final logistics checklist',
        'All confirmations documented',
        'Contingency plans ready',
        'Team briefed on changes'
      ],
      priority: 'critical',
      estimatedTime: '2 hours',
      owner: 'operations'
    },
    speaker_prepared: {
      key: 'speaker_prepared',
      name: 'Speaker Final Preparation',
      description: 'Ensure speaker is fully prepared with final briefing and materials check',
      requirements: [
        'Presentation rehearsed',
        'Content customized for audience',
        'Q&A anticipated',
        'Wardrobe confirmed'
      ],
      deliverables: [
        'Final prep call completed',
        'Presentation tested',
        'Backup plans confirmed',
        'Speaker confidence verified'
      ],
      priority: 'critical',
      estimatedTime: '2 hours',
      owner: 'speaker'
    },
    client_materials_sent: {
      key: 'client_materials_sent',
      name: 'Deliver Final Client Materials',
      description: 'Send all final materials and instructions to client team',
      requirements: [
        'Introduction script prepared',
        'Speaker requirements list',
        'Run of show finalized',
        'Promotional materials ready'
      ],
      deliverables: [
        'Final package sent',
        'Receipt confirmed',
        'Questions answered',
        'Last-minute updates handled'
      ],
      priority: 'high',
      estimatedTime: '1 hour',
      owner: 'operations'
    },
    ready_for_execution: {
      key: 'ready_for_execution',
      name: 'Event Readiness Checkpoint',
      description: 'Final go/no-go decision with all systems checked',
      requirements: [
        'All tasks completed',
        'Team availability confirmed',
        'Equipment checked',
        'Communications tested'
      ],
      deliverables: [
        'Readiness confirmed',
        'Go decision documented',
        'Final briefing completed',
        'Success metrics defined'
      ],
      priority: 'critical',
      estimatedTime: '1 hour',
      owner: 'operations'
    }
  },
  
  event_week: {
    tech_check_scheduled: {
      key: 'tech_check_scheduled',
      name: 'Schedule & Complete Tech Check',
      description: 'Arrange technical rehearsal with speaker to test audio, video, presentation sharing, and all AV equipment',
      requirements: [
        'Speaker availability confirmed',
        'Platform/venue access ready',
        'Test presentation ready',
        'Client tech contact available'
      ],
      deliverables: [
        'Tech check completed',
        'Audio/video quality verified',
        'Screen sharing/AV tested',
        'Backup plan confirmed'
      ],
      priority: 'critical',
      estimatedTime: '1 hour',
      owner: 'operations'
      // No classifications = applies to all event types
    },
    final_preparations_complete: {
      key: 'final_preparations_complete',
      name: 'Complete Day-Before Preparations',
      description: 'Execute all day-before event tasks and final checks',
      requirements: [
        'Tech check completed',
        'Materials packed',
        'Team coordinated',
        'Timeline reviewed'
      ],
      deliverables: [
        'Pre-event checklist done',
        'All materials staged',
        'Team check-in completed',
        'Client notified of readiness'
      ],
      priority: 'critical',
      estimatedTime: '3 hours',
      owner: 'operations'
    },
    event_executed: {
      key: 'event_executed',
      name: 'Execute Event Successfully',
      description: 'Deliver the presentation and manage all on-site logistics',
      requirements: [
        'Arrive on time',
        'Technical setup completed',
        'Sound check done',
        'Client briefing conducted'
      ],
      deliverables: [
        'Presentation delivered',
        'Q&A session managed',
        'Recording captured (if applicable)',
        'Feedback collected'
      ],
      priority: 'critical',
      estimatedTime: 'Event duration',
      owner: 'speaker'
    },
    support_provided: {
      key: 'support_provided',
      name: 'Provide Real-Time Event Support',
      description: 'Manage all support needs during the event',
      requirements: [
        'On-site or remote availability',
        'Communication channels open',
        'Problem-solving ready',
        'Documentation ongoing'
      ],
      deliverables: [
        'Issues resolved quickly',
        'Client requests handled',
        'Event notes documented',
        'Success metrics tracked'
      ],
      priority: 'critical',
      estimatedTime: 'Event duration',
      owner: 'operations'
    }
  },
  
  follow_up: {
    follow_up_sent: {
      key: 'follow_up_sent',
      name: 'Send Post-Event Follow-Up',
      description: 'Send thank you and follow-up communications within 24 hours',
      requirements: [
        'Thank you message drafted',
        'Key contacts identified',
        'Materials promised noted',
        'Next steps defined'
      ],
      deliverables: [
        'Thank you email sent',
        'Promised materials delivered',
        'Recording link shared (if applicable)',
        'Future opportunities discussed'
      ],
      priority: 'high',
      estimatedTime: '1 hour',
      owner: 'operations'
    },
    client_feedback_requested: {
      key: 'client_feedback_requested',
      name: 'Request Client Feedback',
      description: 'Send formal feedback request and testimonial collection',
      requirements: [
        'Feedback form prepared',
        'Key questions identified',
        'Testimonial request drafted',
        'Survey link created'
      ],
      deliverables: [
        'Feedback request sent',
        'Survey responses collected',
        'Testimonial received',
        'Case study potential identified'
      ],
      priority: 'medium',
      estimatedTime: '30 min',
      owner: 'sales'
    },
    speaker_feedback_requested: {
      key: 'speaker_feedback_requested',
      name: 'Collect Speaker Feedback',
      description: 'Gather speaker insights on event experience and client',
      requirements: [
        'Debrief call scheduled',
        'Feedback form ready',
        'Experience documented',
        'Improvements noted'
      ],
      deliverables: [
        'Speaker feedback collected',
        'Insights documented',
        'Database updated',
        'Process improvements identified'
      ],
      priority: 'low',
      estimatedTime: '30 min',
      owner: 'operations'
    },
    lessons_documented: {
      key: 'lessons_documented',
      name: 'Document Lessons Learned',
      description: 'Create comprehensive post-mortem document for future reference',
      requirements: [
        'All feedback compiled',
        'Team input gathered',
        'Metrics analyzed',
        'Issues documented'
      ],
      deliverables: [
        'Post-mortem document created',
        'Best practices updated',
        'Process improvements logged',
        'Knowledge base updated'
      ],
      priority: 'low',
      estimatedTime: '2 hours',
      owner: 'operations'
    }
  }
}

// Helper function to get task urgency based on event date and stage
export function calculateTaskUrgency(
  stage: string,
  daysUntilEvent: number | null,
  taskKey: string
): 'critical' | 'high' | 'medium' | 'low' {
  if (daysUntilEvent === null) return 'low'
  
  // Stage-specific urgency rules
  const urgencyRules: Record<string, { thresholds: { critical: number; high: number; medium: number }; criticalTasks: string[] }> = {
    planning: {
      thresholds: { critical: 60, high: 90, medium: 120 },
      criticalTasks: ['initial_discovery_call', 'speaker_selection']
    },
    contracts_signed: {
      thresholds: { critical: 45, high: 60, medium: 90 },
      criticalTasks: ['prepare_client_contract', 'send_client_contract', 'obtain_speaker_signature']
    },
    invoicing: {
      thresholds: { critical: 45, high: 60, medium: 90 },
      criticalTasks: ['send_internal_contract', 'initial_invoice_sent', 'event_details_confirmed']
    },
    logistics_planning: {
      thresholds: { critical: 21, high: 30, medium: 45 },
      criticalTasks: ['details_confirmed', 'calendar_confirmed']
    },
    pre_event: {
      thresholds: { critical: 3, high: 7, medium: 14 },
      criticalTasks: ['logistics_confirmed', 'speaker_prepared']
    },
    event_week: {
      thresholds: { critical: 0, high: 1, medium: 3 },
      criticalTasks: ['tech_check_scheduled', 'final_preparations_complete', 'event_executed']
    },
    follow_up: {
      thresholds: { critical: -7, high: -3, medium: 0 }, // Negative = days after event
      criticalTasks: ['follow_up_sent']
    }
  }
  
  const rules = urgencyRules[stage]
  if (!rules) return 'medium'
  
  // Check if this is a critical task
  if (rules.criticalTasks.includes(taskKey)) {
    if (daysUntilEvent <= rules.thresholds.critical) return 'critical'
  }
  
  // Apply standard thresholds
  if (daysUntilEvent <= rules.thresholds.critical) return 'critical'
  if (daysUntilEvent <= rules.thresholds.high) return 'high'
  if (daysUntilEvent <= rules.thresholds.medium) return 'medium'
  
  return 'low'
}

// Helper to get owner label
export function getTaskOwnerLabel(owner?: string): string {
  const ownerLabels = {
    sales: 'Sales Team',
    operations: 'Operations',
    speaker: 'Speaker',
    client: 'Client'
  }
  return owner ? ownerLabels[owner] || 'Team' : 'Team'
}

// Helper to get priority color
export function getPriorityColor(priority: string): string {
  const colors = {
    critical: 'text-red-600 bg-red-50',
    high: 'text-orange-600 bg-orange-50',
    medium: 'text-yellow-600 bg-yellow-50',
    low: 'text-gray-600 bg-gray-50'
  }
  return colors[priority] || colors.low
}

// Helper to filter tasks by event classification
export function filterTasksByClassification(
  stageId: string,
  classification?: EventClassification
): [string, TaskDefinition][] {
  const stageTasks = TASK_DEFINITIONS[stageId] || {}
  return Object.entries(stageTasks).filter(([_, task]) => {
    // If task has no classifications specified, it applies to all
    if (!task.classifications || task.classifications.length === 0) {
      return true
    }
    // If project has no classification, show all tasks
    if (!classification) {
      return true
    }
    // Filter based on classification
    return task.classifications.includes(classification)
  })
}

// Helper to get tasks for a specific classification with summary
export function getTaskSummaryForClassification(
  stageId: string,
  classification?: EventClassification
): { total: number; tasks: string[] } {
  const filtered = filterTasksByClassification(stageId, classification)
  return {
    total: filtered.length,
    tasks: filtered.map(([_, task]) => task.name)
  }
}
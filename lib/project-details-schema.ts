// Comprehensive project details schema for event management
// Aligned with Firm Offer Sheet template

export interface ProjectDetails {
  // Basic Overview
  overview: {
    speaker_name?: string
    speaker_title?: string // e.g., "CSP"
    company_name?: string
    event_location?: string
    event_date?: string // ISO date string
    event_time?: string
    event_classification?: 'virtual' | 'local' | 'travel' // Event type determines required fields

    // Additional Event Overview fields
    end_client_name?: string
    event_name?: string
    event_website?: string
  }

  // Billing Contact (from Firm Offer Sheet)
  billing_contact?: {
    name?: string
    title?: string
    email?: string
    phone?: string
    address?: string
  }

  // Logistics Contact (from Firm Offer Sheet)
  logistics_contact?: {
    name?: string
    email?: string
    phone?: string
  }

  // Speaker Program Details (from Firm Offer Sheet)
  program_details?: {
    requested_speaker_name?: string
    program_topic?: string
    program_type?: 'keynote' | 'fireside_chat' | 'panel_discussion' | 'workshop' | 'breakout_session' | 'emcee' | 'other'
    program_type_other?: string // If "other" is selected
    audience_size?: number
    audience_demographics?: string // Job titles, industries, experience levels
    speaker_attire?: 'business_formal' | 'business_casual' | 'smart_casual' | 'casual' | 'black_tie' | 'other'
    attire_notes?: string
  }

  // Event Schedule (from Firm Offer Sheet)
  event_schedule?: {
    event_start_time?: string
    event_end_time?: string
    speaker_arrival_time?: string
    program_start_time?: string
    program_length_minutes?: number
    qa_length_minutes?: number
    total_program_length_minutes?: number
    speaker_departure_time?: string
    detailed_timeline?: string // Full agenda with specific times
    timezone?: string
  }

  // Technical Requirements (from Firm Offer Sheet)
  technical_requirements?: {
    av_requirements?: string // Microphone type, projector, screen size, lighting, etc.
    recording_allowed?: boolean
    recording_purpose?: string // Internal use, promotional use, etc.
    live_streaming?: boolean
    photography_allowed?: boolean
    tech_rehearsal_date?: string
    tech_rehearsal_time?: string
    tech_rehearsal_notes?: string
  }

  // Travel & Accommodation (from Firm Offer Sheet)
  travel: {
    // Expected Travel Dates (from Firm Offer Sheet)
    fly_in_date?: string
    fly_out_date?: string
    nearest_airport?: string

    // Transportation from Airport to Hotel
    airport_to_hotel?: {
      provided_by_client?: boolean
      speaker_arranges?: boolean
      details?: string
    }

    // Transportation from Hotel to Venue
    hotel_to_venue?: {
      provided_by_client?: boolean
      speaker_arranges?: boolean
      details?: string
    }

    // Flights
    flights?: {
      outbound?: Flight[]
      return?: Flight[]
      confirmation_numbers?: string[]
      notes?: string
    }

    // Ground Transportation (legacy - keeping for backwards compatibility)
    ground_transportation?: {
      type?: 'taxi' | 'uber' | 'car_service' | 'rental' | 'provided' | 'other'
      details?: string
      responsibility?: 'speaker' | 'client' | 'agency'
      confirmation?: string
    }

    // Hotel Accommodation
    hotel?: {
      name?: string
      address?: string
      city_state_zip?: string
      phone?: string
      confirmation_number?: string
      confirmation_number_2?: string
      check_in_date?: string
      check_out_date?: string
      room_type?: string
      travel_time_to_airport?: string // e.g., "10 miles / 20 minutes"
      travel_time_to_venue?: string
      arranged_by?: 'sponsor' | 'speaker' | 'agency' | 'other'
      preferred_tier?: string // Preferred hotel tier
      dates_needed?: string
      additional_info?: string
    }

    // Meals (from Firm Offer Sheet)
    meals?: {
      meals_provided?: string // Which meals will be provided
      dietary_requirements?: string
    }

    // Guest List / VIP (from Firm Offer Sheet)
    guest_list?: {
      invited_to_reception?: boolean
      invited_to_dinner?: boolean
      vip_meet_greet?: boolean
      details?: string
    }
  }

  // Venue Information
  venue: {
    name?: string
    address?: string
    city_state_zip?: string
    phone?: string
    closest_airport?: string
    distance_from_airport?: string
    meeting_room_name?: string
    room_setup?: 'theater' | 'classroom' | 'rounds' | 'u-shape' | 'boardroom' | 'auditorium' | 'arena' | 'other'
    room_capacity?: number
    venue_contact?: ContactInfo
    parking_info?: string
    loading_dock_info?: string
    venue_website?: string
  }

  // Contacts
  contacts: {
    // Primary On-Site Contact
    on_site?: ContactInfo & {
      best_contact_method?: 'call' | 'text' | 'email'
      arrival_contact_instructions?: string
    }
    
    // A/V Contact
    av_contact?: ContactInfo & {
      company_name?: string
    }
    
    // Additional Contacts
    additional_contacts?: Array<ContactInfo & {
      role?: string
    }>
  }

  // Event Schedule & Itinerary
  itinerary: {
    // Day-of Details
    escort_person?: string
    escort_phone?: string
    doors_open_time?: string
    speaker_arrival_time?: string
    sound_check_time?: string
    
    // Schedule of Activities
    schedule?: EventScheduleItem[]
    
    // Speaking Details
    speaking_slot?: {
      start_time?: string
      end_time?: string
      duration_minutes?: number
      includes_qa?: boolean
      qa_duration_minutes?: number
    }
  }

  // Audience Information
  audience: {
    expected_size?: number
    actual_size?: number
    
    demographics?: {
      age_range?: string // e.g., "30-70"
      gender_percentage?: {
        male?: number
        female?: number
        other?: number
      }
      geographic_profile?: 'local' | 'regional' | 'national' | 'international'
      industry?: string
      job_titles?: string[]
      seniority_level?: string[]
    }
    
    key_attendees?: Array<{
      name?: string
      title?: string
      company?: string
      notes?: string
    }>
    
    audience_description?: string
    attendee_role?: string // Role of attendees to organization
  }

  // Event Details & Objectives
  event_details: {
    event_title?: string
    event_type?: 'conference' | 'workshop' | 'seminar' | 'corporate_meeting' | 'association' | 'other'
    is_annual_event?: boolean
    past_speakers?: string[]
    
    organization_description?: string
    event_theme?: string
    event_purpose?: string
    
    speaker_selection_reason?: string
    key_message_goals?: string
    success_metrics?: string[]
    
    other_speakers?: Array<{
      name?: string
      company?: string
      topic?: string
      speaking_order?: number
    }>
    
    // Custom terminology
    customer_terminology?: string // What they call customers (guests, members, clients)
    employee_terminology?: string // What they call employees
    
    // Competition
    competitors?: string[]
    
    // Marketing
    event_logo_url?: string
    can_publicize?: boolean
    event_hashtag?: string
    
    // Additional
    special_requests?: string[]
    budget_notes?: string
    book_distribution?: boolean
    book_signing?: boolean
  }

  // Speaker Requirements
  speaker_requirements: {
    // Introduction
    introduction?: {
      text?: string
      phonetic_name?: string // e.g., "Hodak rhymes with Kodak"
      introducer_name?: string
      introducer_title?: string
    }
    
    // A/V Needs
    av_needs?: {
      microphone_type?: 'lavalier' | 'countryman' | 'handheld' | 'headset' | 'podium'
      confidence_monitor?: boolean
      screens_count?: number
      screen_dimensions?: string
      screen_ratio?: '16:9' | '4:3'
      projector?: boolean
      remote_clicker?: boolean
      internet_required?: boolean
      internet_speed_required?: string
      hardwired_internet?: boolean
      
      presentation_format?: 'powerpoint' | 'keynote' | 'mentimeter' | 'prezi' | 'other'
      presentation_notes?: string
      
      stage_requirements?: {
        clear_stage?: boolean
        podium?: boolean
        stool?: boolean
        table?: boolean
      }
      
      water_preference?: string // e.g., "still, room temperature"
      
      sound_check?: {
        required?: boolean
        duration_minutes?: number
        preferred_time?: string
      }
      
      backup_equipment?: string[]
      special_software?: string[]
    }
    
    // Workshop specific
    workshop_requirements?: {
      room_setup?: string
      materials_needed?: string[]
      attendee_requirements?: string[]
      mic_runners_count?: number
    }
    
    // Presentation details
    presentation?: {
      custom_video_requested?: boolean
      custom_video_purpose?: string
      mentimeter_enabled?: boolean
      audience_participation?: boolean
      handouts_required?: boolean
      recording_permitted?: boolean
    }
    
    // Attire
    recommended_attire?: 'business_formal' | 'business_casual' | 'casual' | 'black_tie' | 'other'
    attire_notes?: string
  }

  // Online Presence
  online_presence: {
    event_website?: string
    registration_link?: string
    linkedin_url?: string
    facebook_event?: string
    twitter_handle?: string
    instagram_handle?: string
    youtube_channel?: string
    event_app?: string
  }

  // Additional Information (from Firm Offer Sheet)
  additional_info?: {
    green_room_available?: boolean
    green_room_details?: string
    meet_greet_opportunities?: string // Before/after presentation, VIP reception, etc.
    marketing_use_allowed?: boolean // Will speaker's name/bio be used in event marketing?
    press_media_present?: boolean
    media_interview_requests?: string
    special_requests?: string
  }

  // Financial Details (from Firm Offer Sheet)
  financial_details?: {
    speaker_fee?: number
    speaker_fee_currency?: string
    travel_expenses_type?: 'flat_buyout' | 'actual_expenses' | 'client_books' | 'included'
    travel_expenses_amount?: number
    travel_expenses_notes?: string // Ground transportation, accommodation, meals details
    payment_terms?: 'net_30' | 'net_15' | 'upon_completion' | 'deposit_balance' | 'other'
    payment_terms_other?: string
    deposit_amount?: number
    deposit_due_date?: string
    balance_due_date?: string
  }

  // Confirmation Details (from Firm Offer Sheet)
  confirmation_details?: {
    prep_call_requested?: boolean
    prep_call_date?: string
    prep_call_time?: string
    prep_call_notes?: string
    additional_notes?: string
  }

  // Files & Documents
  documents?: {
    contracts?: string[]
    venue_layouts?: string[]
    av_diagrams?: string[]
    marketing_materials?: string[]
    speaker_materials?: string[]
    other_files?: Array<{
      name: string
      url: string
      type: string
    }>
  }

  // Completion Tracking
  completion_status?: {
    overview_complete?: boolean
    travel_complete?: boolean
    venue_complete?: boolean
    contacts_complete?: boolean
    itinerary_complete?: boolean
    audience_complete?: boolean
    event_details_complete?: boolean
    speaker_requirements_complete?: boolean
    online_presence_complete?: boolean
    overall_percentage?: number
    missing_critical_fields?: string[]
    missing_optional_fields?: string[]
  }
}

// Supporting Types
export interface Flight {
  airline?: string
  flight_number?: string
  departure_airport?: string
  departure_time?: string
  arrival_airport?: string
  arrival_time?: string
  confirmation_number?: string
  seat_number?: string
  notes?: string
}

export interface ContactInfo {
  name?: string
  title?: string
  company?: string
  email?: string
  office_phone?: string
  cell_phone?: string
  preferred_contact?: 'email' | 'office' | 'cell' | 'text'
}

export interface EventScheduleItem {
  date?: string
  start_time?: string
  end_time?: string
  activity?: string
  location?: string
  notes?: string
  is_speaker_required?: boolean
}

// Helper function to calculate completion percentage
export function calculateProjectCompletion(details: ProjectDetails): {
  percentage: number
  missingCritical: string[]
  missingOptional: string[]
} {
  const critical: string[] = []
  const optional: string[] = []
  let totalFields = 0
  let completedFields = 0

  // Define critical fields
  const criticalFields = [
    'overview.speaker_name',
    'overview.company_name',
    'overview.event_location',
    'overview.event_date',
    'venue.name',
    'venue.address',
    'contacts.on_site',
    'audience.expected_size',
    'event_details.event_title',
    'speaker_requirements.av_needs'
  ]

  // Recursive function to check all fields
  function checkFields(obj: any, path: string = '') {
    for (const key in obj) {
      if (obj[key] !== undefined && obj[key] !== null) {
        const currentPath = path ? `${path}.${key}` : key
        
        if (typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
          checkFields(obj[key], currentPath)
        } else {
          totalFields++
          if (obj[key] && obj[key] !== '') {
            completedFields++
          } else {
            if (criticalFields.some(field => currentPath.startsWith(field))) {
              critical.push(currentPath)
            } else {
              optional.push(currentPath)
            }
          }
        }
      }
    }
  }

  checkFields(details)

  return {
    percentage: totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0,
    missingCritical: critical,
    missingOptional: optional
  }
}

// Task generation based on missing fields
export function generateTasksFromMissingFields(
  details: ProjectDetails,
  projectName: string
): Array<{
  name: string
  description: string
  category: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  requirements: string[]
  deliverables: string[]
}> {
  const tasks: Array<{
    name: string
    description: string
    category: string
    priority: 'critical' | 'high' | 'medium' | 'low'
    requirements: string[]
    deliverables: string[]
  }> = []

  // Check critical overview fields
  if (!details.overview?.speaker_name) {
    tasks.push({
      name: 'Confirm Speaker Name',
      description: `Confirm and document the speaker's full name and title for ${projectName}`,
      category: 'overview',
      priority: 'critical',
      requirements: [
        'Contact client or agency for speaker details',
        'Verify correct spelling and pronunciation',
        'Confirm professional title and credentials'
      ],
      deliverables: [
        'Speaker name documented in project details',
        'Phonetic spelling if needed',
        'Professional title confirmed'
      ]
    })
  }

  if (!details.overview?.event_date) {
    tasks.push({
      name: 'Confirm Event Date',
      description: `Finalize and document the event date for ${projectName}`,
      category: 'overview',
      priority: 'critical',
      requirements: [
        'Client confirmation of date',
        'Venue availability verified',
        'Speaker calendar blocked'
      ],
      deliverables: [
        'Event date locked in system',
        'Calendar invites sent',
        'All parties notified'
      ]
    })
  }

  // Check travel arrangements
  if (!details.travel?.flights?.outbound || details.travel.flights.outbound.length === 0) {
    tasks.push({
      name: 'Book Speaker Flights',
      description: 'Arrange and confirm speaker flight reservations',
      category: 'travel',
      priority: 'high',
      requirements: [
        'Speaker travel preferences',
        'Event schedule confirmed',
        'Budget approval',
        'Passport/ID verification'
      ],
      deliverables: [
        'Flight confirmations',
        'Itinerary sent to speaker',
        'Check-in instructions provided',
        'Seat assignments confirmed'
      ]
    })
  }

  if (!details.travel?.hotel?.confirmation_number) {
    tasks.push({
      name: 'Confirm Hotel Reservation',
      description: 'Book and confirm speaker hotel accommodations',
      category: 'travel',
      priority: 'high',
      requirements: [
        'Hotel preferences from speaker',
        'Check-in/out dates confirmed',
        'Proximity to venue verified',
        'Budget approval'
      ],
      deliverables: [
        'Hotel confirmation number',
        'Room type and amenities confirmed',
        'Check-in instructions sent',
        'Contact information shared'
      ]
    })
  }

  // Check venue details
  if (!details.venue?.name || !details.venue?.address) {
    tasks.push({
      name: 'Finalize Venue Details',
      description: 'Confirm venue name, address, and room specifications',
      category: 'venue',
      priority: 'critical',
      requirements: [
        'Venue contract signed',
        'Room assignment confirmed',
        'Capacity requirements met',
        'Technical capabilities verified'
      ],
      deliverables: [
        'Complete venue information documented',
        'Room layout confirmed',
        'Access instructions obtained',
        'Parking information gathered'
      ]
    })
  }

  // Check contacts
  if (!details.contacts?.on_site?.name) {
    tasks.push({
      name: 'Identify On-Site Contact',
      description: 'Confirm primary on-site contact person and their information',
      category: 'contacts',
      priority: 'critical',
      requirements: [
        'Client identifies point person',
        'Contact availability confirmed',
        'Communication preferences established'
      ],
      deliverables: [
        'Contact name and role documented',
        'Phone and email confirmed',
        'Backup contact identified',
        'Day-of communication plan'
      ]
    })
  }

  if (!details.contacts?.av_contact?.name) {
    tasks.push({
      name: 'Confirm A/V Contact',
      description: 'Get A/V contact information and technical requirements',
      category: 'contacts',
      priority: 'high',
      requirements: [
        'Venue A/V team identified',
        'Technical specifications gathered',
        'Test schedule arranged'
      ],
      deliverables: [
        'A/V contact details documented',
        'Technical requirements confirmed',
        'Sound check scheduled',
        'Backup plan established'
      ]
    })
  }

  // Check audience information
  if (!details.audience?.expected_size) {
    tasks.push({
      name: 'Confirm Audience Size',
      description: 'Get expected attendance numbers for proper preparation',
      category: 'audience',
      priority: 'medium',
      requirements: [
        'Registration numbers from client',
        'Room capacity verification',
        'Materials quantity planning'
      ],
      deliverables: [
        'Expected attendance documented',
        'Room setup confirmed',
        'Materials ordered accordingly',
        'Seating arrangement planned'
      ]
    })
  }

  // Check event details
  if (!details.event_details?.event_title) {
    tasks.push({
      name: 'Confirm Event Title',
      description: 'Get official event title for materials and announcements',
      category: 'event_details',
      priority: 'high',
      requirements: [
        'Client approval of title',
        'Marketing materials review',
        'Consistency across platforms'
      ],
      deliverables: [
        'Official event title documented',
        'Materials updated with title',
        'Website/social media updated',
        'Signage ordered if needed'
      ]
    })
  }

  // Check speaker requirements
  if (!details.speaker_requirements?.introduction?.text) {
    tasks.push({
      name: 'Prepare Speaker Introduction',
      description: 'Write and approve speaker introduction script',
      category: 'speaker_requirements',
      priority: 'medium',
      requirements: [
        'Speaker bio and credentials',
        'Client input on emphasis',
        'Time limit for introduction',
        'Pronunciation guide'
      ],
      deliverables: [
        'Introduction script written',
        'Speaker approval obtained',
        'Introducer identified and briefed',
        'Backup copy provided'
      ]
    })
  }

  if (!details.speaker_requirements?.av_needs?.microphone_type) {
    tasks.push({
      name: 'Confirm A/V Requirements',
      description: 'Document all audio/visual needs and preferences',
      category: 'speaker_requirements',
      priority: 'high',
      requirements: [
        'Speaker preferences gathered',
        'Venue capabilities confirmed',
        'Presentation format verified',
        'Recording requirements checked'
      ],
      deliverables: [
        'A/V requirements documented',
        'Equipment confirmed available',
        'Backup equipment arranged',
        'Test schedule confirmed'
      ]
    })
  }

  return tasks
}
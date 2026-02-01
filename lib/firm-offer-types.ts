// Firm Offer Sheet Types

export interface FirmOfferBillingContact {
  name: string
  title: string
  email: string
  phone: string
  address: string
}

export interface FirmOfferLogisticsContact {
  name: string
  email: string
  phone: string
}

export interface FirmOfferVenueContact {
  name: string
  email: string
  phone: string
}

export interface FirmOfferEventOverview {
  billing_contact: FirmOfferBillingContact
  logistics_contact: FirmOfferLogisticsContact
  end_client_name: string
  event_date: string
  event_name: string
  event_website: string
  venue_name: string
  venue_address: string
  venue_contact: FirmOfferVenueContact
}

export interface FirmOfferSpeakerProgram {
  requested_speaker_name: string
  program_topic: string
  program_type: 'keynote' | 'fireside_chat' | 'panel_discussion' | 'workshop' | 'other'
  program_type_other?: string
  audience_size: number
  audience_demographics: string
  speaker_attire: 'business_formal' | 'business_casual' | 'smart_casual' | 'other'
  speaker_attire_other?: string
}

export interface FirmOfferEventSchedule {
  event_start_time: string
  event_end_time: string
  speaker_arrival_time: string
  program_start_time: string
  program_length_minutes: number
  qa_length_minutes: number
  total_program_length_minutes: number
  speaker_departure_time: string
  detailed_timeline: string
  timezone: string
}

export interface FirmOfferTechnicalRequirements {
  microphone_type: string
  projector_screen: string
  lighting_requirements: string
  other_av: string
  recording_allowed: boolean
  recording_purpose: 'internal' | 'promotional' | 'both' | 'none'
  live_stream: boolean
  photography_allowed: boolean
  tech_rehearsal_date: string
  tech_rehearsal_time: string
}

export interface FirmOfferTravelAccommodation {
  fly_in_date: string
  fly_out_date: string
  nearest_airport: string
  airport_transportation: 'client_provides' | 'speaker_arranges' | 'tbd'
  hotel_transportation: 'client_provides' | 'speaker_arranges' | 'tbd'
  hotel_required: boolean
  hotel_dates: string
  hotel_tier: 'standard' | 'upscale' | 'luxury' | 'tbd'
  meals_provided: string[]
  dietary_requirements: string
  guest_list_invitation: boolean
  vip_meet_greet: boolean
}

export interface FirmOfferAdditionalInfo {
  green_room_available: boolean
  meet_greet_before: boolean
  meet_greet_after: boolean
  vip_reception: boolean
  marketing_use_approved: boolean
  press_media_present: boolean
  interview_requests: string
  special_requests: string
}

export interface FirmOfferFinancialDetails {
  speaker_fee: number
  travel_expenses_type: 'flat_buyout' | 'client_books' | 'reimbursement'
  travel_buyout_amount?: number
  travel_notes: string
  payment_terms: string
}

export interface FirmOfferConfirmation {
  prep_call_requested: boolean
  prep_call_date_preferences: string
  additional_notes: string
}

export interface FirmOffer {
  id?: number
  proposal_id: number
  status: 'draft' | 'submitted' | 'admin_review' | 'sent_to_speaker' | 'speaker_confirmed' | 'speaker_declined' | 'completed'

  // Event Overview
  event_overview: FirmOfferEventOverview

  // Speaker Program
  speaker_program: FirmOfferSpeakerProgram

  // Event Schedule
  event_schedule: FirmOfferEventSchedule

  // Technical Requirements
  technical_requirements: FirmOfferTechnicalRequirements

  // Travel & Accommodation
  travel_accommodation: FirmOfferTravelAccommodation

  // Additional Info
  additional_info: FirmOfferAdditionalInfo

  // Financial Details
  financial_details: FirmOfferFinancialDetails

  // Confirmation
  confirmation: FirmOfferConfirmation

  // Speaker Review
  speaker_access_token?: string
  speaker_viewed_at?: string
  speaker_response_at?: string
  speaker_notes?: string

  // Metadata
  created_at?: string
  updated_at?: string
  submitted_at?: string
  sent_to_speaker_at?: string
}

// Empty firm offer template
export const emptyFirmOffer: Omit<FirmOffer, 'id' | 'proposal_id' | 'created_at' | 'updated_at'> = {
  status: 'draft',
  event_overview: {
    billing_contact: { name: '', title: '', email: '', phone: '', address: '' },
    logistics_contact: { name: '', email: '', phone: '' },
    end_client_name: '',
    event_date: '',
    event_name: '',
    event_website: '',
    venue_name: '',
    venue_address: '',
    venue_contact: { name: '', email: '', phone: '' }
  },
  speaker_program: {
    requested_speaker_name: '',
    program_topic: '',
    program_type: 'keynote',
    audience_size: 0,
    audience_demographics: '',
    speaker_attire: 'business_casual'
  },
  event_schedule: {
    event_start_time: '',
    event_end_time: '',
    speaker_arrival_time: '',
    program_start_time: '',
    program_length_minutes: 60,
    qa_length_minutes: 15,
    total_program_length_minutes: 75,
    speaker_departure_time: '',
    detailed_timeline: '',
    timezone: 'America/New_York'
  },
  technical_requirements: {
    microphone_type: 'Lavalier/lapel preferred',
    projector_screen: '',
    lighting_requirements: '',
    other_av: '',
    recording_allowed: false,
    recording_purpose: 'none',
    live_stream: false,
    photography_allowed: true,
    tech_rehearsal_date: '',
    tech_rehearsal_time: ''
  },
  travel_accommodation: {
    fly_in_date: '',
    fly_out_date: '',
    nearest_airport: '',
    airport_transportation: 'tbd',
    hotel_transportation: 'tbd',
    hotel_required: true,
    hotel_dates: '',
    hotel_tier: 'upscale',
    meals_provided: [],
    dietary_requirements: '',
    guest_list_invitation: false,
    vip_meet_greet: false
  },
  additional_info: {
    green_room_available: false,
    meet_greet_before: false,
    meet_greet_after: false,
    vip_reception: false,
    marketing_use_approved: true,
    press_media_present: false,
    interview_requests: '',
    special_requests: ''
  },
  financial_details: {
    speaker_fee: 0,
    travel_expenses_type: 'flat_buyout',
    travel_notes: '',
    payment_terms: 'Net 30 days after event'
  },
  confirmation: {
    prep_call_requested: true,
    prep_call_date_preferences: '',
    additional_notes: ''
  }
}

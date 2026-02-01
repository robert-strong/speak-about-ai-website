-- Migration Script: Consolidate Project Details into JSONB column
-- This script migrates all individual project detail columns into the unified project_details JSONB column
-- Author: Claude Code
-- Date: 2025-01-25

-- Step 1: Backup the existing project_details column (if any data exists)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_details_backup jsonb;
UPDATE projects SET project_details_backup = project_details WHERE project_details IS NOT NULL;

-- Step 2: Update project_details with all individual column data
UPDATE projects SET project_details = jsonb_build_object(
  -- Basic Overview
  'overview', jsonb_build_object(
    'speaker_name', COALESCE((project_details->'overview'->>'speaker_name'), requested_speaker_name),
    'speaker_title', project_details->'overview'->>'speaker_title',
    'company_name', COALESCE((project_details->'overview'->>'company_name'), company),
    'event_location', COALESCE((project_details->'overview'->>'event_location'), event_location),
    'event_date', COALESCE((project_details->'overview'->>'event_date'), event_date::text),
    'event_time', COALESCE((project_details->'overview'->>'event_time'), event_start_time),
    'event_classification', COALESCE((project_details->'overview'->>'event_classification'), event_classification)
  ),
  
  -- Travel & Logistics
  'travel', jsonb_build_object(
    'flights', jsonb_build_object(
      'outbound', COALESCE(project_details->'travel'->'flights'->'outbound', '[]'::jsonb),
      'return', COALESCE(project_details->'travel'->'flights'->'return', '[]'::jsonb),
      'confirmation_numbers', CASE 
        WHEN flight_number_in IS NOT NULL OR flight_number_out IS NOT NULL 
        THEN jsonb_build_array(flight_number_in, flight_number_out) - 'null'::jsonb
        ELSE COALESCE(project_details->'travel'->'flights'->'confirmation_numbers', '[]'::jsonb)
      END,
      'notes', COALESCE((project_details->'travel'->'flights'->>'notes'), travel_notes)
    ),
    'ground_transportation', jsonb_build_object(
      'type', project_details->'travel'->'ground_transportation'->>'type',
      'details', COALESCE(
        (project_details->'travel'->'ground_transportation'->>'details'),
        airport_transport_details,
        venue_transport_details
      ),
      'responsibility', project_details->'travel'->'ground_transportation'->>'responsibility',
      'confirmation', project_details->'travel'->'ground_transportation'->>'confirmation'
    ),
    'hotel', jsonb_build_object(
      'name', COALESCE((project_details->'travel'->'hotel'->>'name'), hotel_name),
      'address', project_details->'travel'->'hotel'->>'address',
      'city_state_zip', project_details->'travel'->'hotel'->>'city_state_zip',
      'phone', project_details->'travel'->'hotel'->>'phone',
      'confirmation_number', COALESCE((project_details->'travel'->'hotel'->>'confirmation_number'), hotel_reservation_number),
      'check_in_date', COALESCE((project_details->'travel'->'hotel'->>'check_in_date'), fly_in_date),
      'check_out_date', COALESCE((project_details->'travel'->'hotel'->>'check_out_date'), fly_out_date),
      'room_type', project_details->'travel'->'hotel'->>'room_type',
      'travel_time_to_airport', project_details->'travel'->'hotel'->>'travel_time_to_airport',
      'travel_time_to_venue', project_details->'travel'->'hotel'->>'travel_time_to_venue',
      'arranged_by', project_details->'travel'->'hotel'->>'arranged_by',
      'additional_info', COALESCE((project_details->'travel'->'hotel'->>'additional_info'), hotel_dates_needed)
    )
  ),
  
  -- Venue Information
  'venue', jsonb_build_object(
    'name', COALESCE((project_details->'venue'->>'name'), venue_name),
    'address', COALESCE((project_details->'venue'->>'address'), venue_address),
    'city_state_zip', project_details->'venue'->>'city_state_zip',
    'phone', project_details->'venue'->>'phone',
    'closest_airport', COALESCE((project_details->'venue'->>'closest_airport'), nearest_airport),
    'distance_from_airport', project_details->'venue'->>'distance_from_airport',
    'meeting_room_name', project_details->'venue'->>'meeting_room_name',
    'room_setup', project_details->'venue'->>'room_setup',
    'room_capacity', COALESCE((project_details->'venue'->>'room_capacity')::int, attendee_count, audience_size),
    'venue_contact', jsonb_build_object(
      'name', COALESCE(project_details->'venue'->'venue_contact'->>'name', venue_contact_name, venue_contact),
      'title', project_details->'venue'->'venue_contact'->>'title',
      'company', project_details->'venue'->'venue_contact'->>'company',
      'email', COALESCE(project_details->'venue'->'venue_contact'->>'email', venue_contact_email),
      'office_phone', COALESCE(project_details->'venue'->'venue_contact'->>'office_phone', venue_contact_phone),
      'cell_phone', project_details->'venue'->'venue_contact'->>'cell_phone',
      'preferred_contact', project_details->'venue'->'venue_contact'->>'preferred_contact'
    ),
    'parking_info', project_details->'venue'->>'parking_info',
    'loading_dock_info', project_details->'venue'->>'loading_dock_info',
    'venue_website', project_details->'venue'->>'venue_website'
  ),
  
  -- Contacts
  'contacts', jsonb_build_object(
    'on_site', jsonb_build_object(
      'name', COALESCE(project_details->'contacts'->'on_site'->>'name', contact_person, client_name),
      'title', project_details->'contacts'->'on_site'->>'title',
      'company', COALESCE(project_details->'contacts'->'on_site'->>'company', company),
      'email', COALESCE(project_details->'contacts'->'on_site'->>'email', client_email),
      'office_phone', project_details->'contacts'->'on_site'->>'office_phone',
      'cell_phone', COALESCE(project_details->'contacts'->'on_site'->>'cell_phone', client_phone),
      'preferred_contact', project_details->'contacts'->'on_site'->>'preferred_contact',
      'best_contact_method', project_details->'contacts'->'on_site'->>'best_contact_method',
      'arrival_contact_instructions', project_details->'contacts'->'on_site'->>'arrival_contact_instructions'
    ),
    'av_contact', jsonb_build_object(
      'name', project_details->'contacts'->'av_contact'->>'name',
      'title', project_details->'contacts'->'av_contact'->>'title',
      'company_name', project_details->'contacts'->'av_contact'->>'company_name',
      'email', project_details->'contacts'->'av_contact'->>'email',
      'office_phone', project_details->'contacts'->'av_contact'->>'office_phone',
      'cell_phone', project_details->'contacts'->'av_contact'->>'cell_phone',
      'preferred_contact', project_details->'contacts'->'av_contact'->>'preferred_contact'
    ),
    'additional_contacts', COALESCE(project_details->'contacts'->'additional_contacts', '[]'::jsonb)
  ),
  
  -- Event Schedule & Itinerary
  'itinerary', jsonb_build_object(
    'escort_person', project_details->'itinerary'->>'escort_person',
    'escort_phone', project_details->'itinerary'->>'escort_phone',
    'doors_open_time', project_details->'itinerary'->>'doors_open_time',
    'speaker_arrival_time', COALESCE((project_details->'itinerary'->>'speaker_arrival_time'), speaker_arrival_time),
    'sound_check_time', COALESCE((project_details->'itinerary'->>'sound_check_time'), tech_rehearsal_time),
    'schedule', COALESCE(project_details->'itinerary'->'schedule', event_agenda, '[]'::jsonb),
    'speaking_slot', jsonb_build_object(
      'start_time', COALESCE(project_details->'itinerary'->'speaking_slot'->>'start_time', program_start_time),
      'end_time', project_details->'itinerary'->'speaking_slot'->>'end_time',
      'duration_minutes', COALESCE((project_details->'itinerary'->'speaking_slot'->>'duration_minutes')::int, program_length),
      'includes_qa', CASE WHEN qa_length > 0 THEN true ELSE false END,
      'qa_duration_minutes', COALESCE((project_details->'itinerary'->'speaking_slot'->>'qa_duration_minutes')::int, qa_length)
    )
  ),
  
  -- Audience Information
  'audience', jsonb_build_object(
    'expected_size', COALESCE((project_details->'audience'->>'expected_size')::int, attendee_count, audience_size),
    'actual_size', (project_details->'audience'->>'actual_size')::int,
    'demographics', jsonb_build_object(
      'age_range', project_details->'audience'->'demographics'->>'age_range',
      'gender_percentage', project_details->'audience'->'demographics'->'gender_percentage',
      'geographic_profile', project_details->'audience'->'demographics'->>'geographic_profile',
      'industry', project_details->'audience'->'demographics'->>'industry',
      'job_titles', project_details->'audience'->'demographics'->'job_titles',
      'seniority_level', project_details->'audience'->'demographics'->'seniority_level'
    ),
    'key_attendees', COALESCE(project_details->'audience'->'key_attendees', '[]'::jsonb),
    'audience_description', COALESCE((project_details->'audience'->>'audience_description'), audience_demographics),
    'attendee_role', project_details->'audience'->>'attendee_role'
  ),
  
  -- Event Details & Objectives
  'event_details', jsonb_build_object(
    'event_title', COALESCE((project_details->'event_details'->>'event_title'), event_name, project_name),
    'event_type', COALESCE((project_details->'event_details'->>'event_type'), event_type),
    'is_annual_event', project_details->'event_details'->>'is_annual_event',
    'past_speakers', COALESCE(project_details->'event_details'->'past_speakers', '[]'::jsonb),
    'organization_description', COALESCE((project_details->'event_details'->>'organization_description'), company),
    'event_theme', project_details->'event_details'->>'event_theme',
    'event_purpose', project_details->'event_details'->>'event_purpose',
    'speaker_selection_reason', project_details->'event_details'->>'speaker_selection_reason',
    'key_message_goals', project_details->'event_details'->>'key_message_goals',
    'success_metrics', COALESCE(project_details->'event_details'->'success_metrics', '[]'::jsonb),
    'other_speakers', COALESCE(project_details->'event_details'->'other_speakers', '[]'::jsonb),
    'customer_terminology', project_details->'event_details'->>'customer_terminology',
    'employee_terminology', project_details->'event_details'->>'employee_terminology',
    'competitors', COALESCE(project_details->'event_details'->'competitors', '[]'::jsonb),
    'event_logo_url', project_details->'event_details'->>'event_logo_url',
    'can_publicize', COALESCE((project_details->'event_details'->>'can_publicize')::boolean, marketing_use_allowed),
    'event_hashtag', project_details->'event_details'->>'event_hashtag',
    'special_requests', COALESCE(project_details->'event_details'->'special_requests', 
      CASE WHEN special_requests IS NOT NULL THEN jsonb_build_array(special_requests) ELSE '[]'::jsonb END),
    'budget_notes', project_details->'event_details'->>'budget_notes',
    'book_distribution', project_details->'event_details'->>'book_distribution',
    'book_signing', project_details->'event_details'->>'book_signing'
  ),
  
  -- Speaker Requirements
  'speaker_requirements', jsonb_build_object(
    'introduction', jsonb_build_object(
      'text', COALESCE((project_details->'speaker_requirements'->'introduction'->>'text'), speaker_bio),
      'phonetic_name', project_details->'speaker_requirements'->'introduction'->>'phonetic_name',
      'introducer_name', project_details->'speaker_requirements'->'introduction'->>'introducer_name',
      'introducer_title', project_details->'speaker_requirements'->'introduction'->>'introducer_title'
    ),
    'av_needs', jsonb_build_object(
      'microphone_type', project_details->'speaker_requirements'->'av_needs'->>'microphone_type',
      'confidence_monitor', project_details->'speaker_requirements'->'av_needs'->>'confidence_monitor',
      'screens_count', project_details->'speaker_requirements'->'av_needs'->>'screens_count',
      'screen_dimensions', project_details->'speaker_requirements'->'av_needs'->>'screen_dimensions',
      'screen_ratio', project_details->'speaker_requirements'->'av_needs'->>'screen_ratio',
      'projector', project_details->'speaker_requirements'->'av_needs'->>'projector',
      'remote_clicker', project_details->'speaker_requirements'->'av_needs'->>'remote_clicker',
      'internet_required', project_details->'speaker_requirements'->'av_needs'->>'internet_required',
      'internet_speed_required', project_details->'speaker_requirements'->'av_needs'->>'internet_speed_required',
      'hardwired_internet', project_details->'speaker_requirements'->'av_needs'->>'hardwired_internet',
      'presentation_format', project_details->'speaker_requirements'->'av_needs'->>'presentation_format',
      'presentation_notes', COALESCE(
        (project_details->'speaker_requirements'->'av_needs'->>'presentation_notes'),
        speaker_av_requirements,
        av_requirements
      ),
      'stage_requirements', project_details->'speaker_requirements'->'av_needs'->'stage_requirements',
      'water_preference', project_details->'speaker_requirements'->'av_needs'->>'water_preference',
      'sound_check', jsonb_build_object(
        'required', project_details->'speaker_requirements'->'av_needs'->'sound_check'->>'required',
        'duration_minutes', project_details->'speaker_requirements'->'av_needs'->'sound_check'->>'duration_minutes',
        'preferred_time', COALESCE(
          project_details->'speaker_requirements'->'av_needs'->'sound_check'->>'preferred_time',
          tech_rehearsal_time
        )
      ),
      'backup_equipment', COALESCE(project_details->'speaker_requirements'->'av_needs'->'backup_equipment', '[]'::jsonb),
      'special_software', COALESCE(project_details->'speaker_requirements'->'av_needs'->'special_software', '[]'::jsonb)
    ),
    'workshop_requirements', project_details->'speaker_requirements'->'workshop_requirements',
    'presentation', jsonb_build_object(
      'custom_video_requested', project_details->'speaker_requirements'->'presentation'->>'custom_video_requested',
      'custom_video_purpose', project_details->'speaker_requirements'->'presentation'->>'custom_video_purpose',
      'mentimeter_enabled', project_details->'speaker_requirements'->'presentation'->>'mentimeter_enabled',
      'audience_participation', project_details->'speaker_requirements'->'presentation'->>'audience_participation',
      'handouts_required', project_details->'speaker_requirements'->'presentation'->>'handouts_required',
      'recording_permitted', COALESCE(
        (project_details->'speaker_requirements'->'presentation'->>'recording_permitted')::boolean,
        recording_allowed
      )
    ),
    'recommended_attire', COALESCE(project_details->'speaker_requirements'->>'recommended_attire', speaker_attire),
    'attire_notes', project_details->'speaker_requirements'->>'attire_notes'
  ),
  
  -- Online Presence
  'online_presence', jsonb_build_object(
    'event_website', COALESCE((project_details->'online_presence'->>'event_website'), event_website),
    'registration_link', project_details->'online_presence'->>'registration_link',
    'linkedin_url', project_details->'online_presence'->>'linkedin_url',
    'facebook_event', project_details->'online_presence'->>'facebook_event',
    'twitter_handle', project_details->'online_presence'->>'twitter_handle',
    'instagram_handle', project_details->'online_presence'->>'instagram_handle',
    'youtube_channel', project_details->'online_presence'->>'youtube_channel',
    'event_app', project_details->'online_presence'->>'event_app'
  ),
  
  -- Files & Documents
  'documents', jsonb_build_object(
    'contracts', CASE 
      WHEN contract_url IS NOT NULL THEN jsonb_build_array(contract_url)
      ELSE COALESCE(project_details->'documents'->'contracts', '[]'::jsonb)
    END,
    'venue_layouts', COALESCE(project_details->'documents'->'venue_layouts', '[]'::jsonb),
    'av_diagrams', COALESCE(project_details->'documents'->'av_diagrams', '[]'::jsonb),
    'marketing_materials', COALESCE(project_details->'documents'->'marketing_materials', marketing_materials, '[]'::jsonb),
    'speaker_materials', COALESCE(project_details->'documents'->'speaker_materials', '[]'::jsonb),
    'other_files', COALESCE(project_details->'documents'->'other_files', '[]'::jsonb)
  ),
  
  -- Billing Information (additional section not in original schema)
  'billing', jsonb_build_object(
    'contact', jsonb_build_object(
      'name', billing_contact_name,
      'title', billing_contact_title,
      'email', billing_contact_email,
      'phone', billing_contact_phone,
      'address', billing_address
    ),
    'invoice_number', invoice_number,
    'purchase_order_number', purchase_order_number,
    'payment_terms', payment_terms,
    'speaker_fee', speaker_fee,
    'travel_stipend', travel_stipend,
    'travel_expenses_amount', travel_expenses_amount,
    'travel_expenses_type', travel_expenses_type
  ),
  
  -- Logistics Contact (additional section)
  'logistics', jsonb_build_object(
    'contact', jsonb_build_object(
      'name', logistics_contact_name,
      'email', logistics_contact_email,
      'phone', logistics_contact_phone
    ),
    'travel_required', travel_required,
    'flight_required', flight_required,
    'hotel_required', hotel_required,
    'accommodation_required', accommodation_required,
    'airport_transport_provided', airport_transport_provided,
    'venue_transport_provided', venue_transport_provided,
    'green_room_available', green_room_available,
    'meet_greet_opportunities', meet_greet_opportunities,
    'media_interview_requests', media_interview_requests
  ),
  
  -- Preparation Details
  'preparation', jsonb_build_object(
    'prep_call_requested', prep_call_requested,
    'prep_call_date', prep_call_date,
    'prep_call_time', prep_call_time,
    'presentation_ready', presentation_ready,
    'materials_sent', materials_sent,
    'presentation_title', speaker_presentation_title,
    'speaker_topics', speaker_topics,
    'speaker_social_media', speaker_social_media,
    'speaker_website', speaker_website,
    'speaker_one_liner', speaker_one_liner,
    'speaker_headshot_url', speaker_headshot_url
  ),
  
  -- Program Details
  'program', jsonb_build_object(
    'topic', program_topic,
    'type', program_type,
    'timezone', event_timezone,
    'recording_purpose', recording_purpose,
    'live_streaming', live_streaming,
    'photography_allowed', photography_allowed,
    'press_media_present', press_media_present,
    'timeline', event_timeline,
    'departure_time', speaker_departure_time,
    'total_length', total_program_length
  ),
  
  -- Completion Status
  'completion_status', jsonb_build_object(
    'overview_complete', false,
    'travel_complete', false,
    'venue_complete', false,
    'contacts_complete', false,
    'itinerary_complete', false,
    'audience_complete', false,
    'event_details_complete', false,
    'speaker_requirements_complete', false,
    'online_presence_complete', false,
    'overall_percentage', 0,
    'missing_critical_fields', '[]'::jsonb,
    'missing_optional_fields', '[]'::jsonb
  ),
  
  -- Legacy Data Preservation
  'legacy_data', jsonb_build_object(
    'promotional_materials', promotional_materials,
    'end_client_name', end_client_name,
    'contract_requirements', contract_requirements,
    'invoice_requirements', invoice_requirements,
    'invoice_url', invoice_url,
    'additional_notes', additional_notes,
    'catering_requirements', catering_requirements,
    'special_requirements', special_requirements,
    'hotel_tier_preference', hotel_tier_preference,
    'guest_list_details', guest_list_details,
    'contract_signed', contract_signed,
    'invoice_sent', invoice_sent,
    'payment_received', payment_received
  )
);

-- Step 3: Recalculate completion percentages
UPDATE projects SET details_completion_percentage = (
  SELECT ROUND(
    (
      CASE WHEN project_details->'overview'->>'speaker_name' IS NOT NULL AND project_details->'overview'->>'speaker_name' != '' THEN 1 ELSE 0 END +
      CASE WHEN project_details->'overview'->>'company_name' IS NOT NULL AND project_details->'overview'->>'company_name' != '' THEN 1 ELSE 0 END +
      CASE WHEN project_details->'overview'->>'event_location' IS NOT NULL AND project_details->'overview'->>'event_location' != '' THEN 1 ELSE 0 END +
      CASE WHEN project_details->'overview'->>'event_date' IS NOT NULL AND project_details->'overview'->>'event_date' != '' THEN 1 ELSE 0 END +
      CASE WHEN project_details->'venue'->>'name' IS NOT NULL AND project_details->'venue'->>'name' != '' THEN 1 ELSE 0 END +
      CASE WHEN project_details->'venue'->>'address' IS NOT NULL AND project_details->'venue'->>'address' != '' THEN 1 ELSE 0 END +
      CASE WHEN project_details->'contacts'->'on_site'->>'name' IS NOT NULL AND project_details->'contacts'->'on_site'->>'name' != '' THEN 1 ELSE 0 END +
      CASE WHEN project_details->'audience'->>'expected_size' IS NOT NULL THEN 1 ELSE 0 END +
      CASE WHEN project_details->'event_details'->>'event_title' IS NOT NULL AND project_details->'event_details'->>'event_title' != '' THEN 1 ELSE 0 END
    )::numeric / 9 * 100
  )::integer
);

-- Step 4: Update has_critical_missing_info flag
UPDATE projects SET has_critical_missing_info = (
  project_details->'overview'->>'speaker_name' IS NULL OR project_details->'overview'->>'speaker_name' = '' OR
  project_details->'overview'->>'company_name' IS NULL OR project_details->'overview'->>'company_name' = '' OR
  project_details->'overview'->>'event_location' IS NULL OR project_details->'overview'->>'event_location' = '' OR
  project_details->'overview'->>'event_date' IS NULL OR project_details->'overview'->>'event_date' = '' OR
  project_details->'venue'->>'name' IS NULL OR project_details->'venue'->>'name' = '' OR
  project_details->'venue'->>'address' IS NULL OR project_details->'venue'->>'address' = '' OR
  project_details->'contacts'->'on_site'->>'name' IS NULL OR project_details->'contacts'->'on_site'->>'name' = '' OR
  project_details->'audience'->>'expected_size' IS NULL OR
  project_details->'event_details'->>'event_title' IS NULL OR project_details->'event_details'->>'event_title' = ''
);

-- Step 5: Create views for backward compatibility
CREATE OR REPLACE VIEW projects_legacy_view AS
SELECT 
  id,
  project_name,
  client_name,
  client_email,
  client_phone,
  company,
  project_type,
  description,
  status,
  priority,
  start_date,
  end_date,
  deadline,
  budget,
  spent,
  completion_percentage,
  team_members,
  deliverables,
  milestones,
  notes,
  tags,
  created_at,
  updated_at,
  completed_at,
  -- Map from JSONB back to individual columns
  project_details->'overview'->>'event_date' AS event_date,
  project_details->'overview'->>'event_location' AS event_location,
  project_details->'event_details'->>'event_type' AS event_type,
  (project_details->'audience'->>'expected_size')::integer AS attendee_count,
  (project_details->'billing'->'speaker_fee')::numeric AS speaker_fee,
  (project_details->'logistics'->'travel_required')::boolean AS travel_required,
  (project_details->'logistics'->'accommodation_required')::boolean AS accommodation_required,
  project_details->'speaker_requirements'->'av_needs'->>'presentation_notes' AS av_requirements,
  -- Add all other fields as needed...
  project_details,
  details_completion_percentage,
  has_critical_missing_info
FROM projects;

-- Step 6: Log the migration completion
DO $$
BEGIN
  RAISE NOTICE 'Project details consolidation completed successfully at %', NOW();
  RAISE NOTICE 'All individual columns have been migrated to the project_details JSONB column';
  RAISE NOTICE 'Original project_details data backed up to project_details_backup column';
  RAISE NOTICE 'Legacy view created for backward compatibility';
END $$;
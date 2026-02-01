-- Complete migration to add all new project management fields to the projects table

-- Remove catering/dietary fields as they're no longer needed
ALTER TABLE projects DROP COLUMN IF EXISTS meals_provided;
ALTER TABLE projects DROP COLUMN IF EXISTS dietary_requirements;

-- Event Overview - Billing Contact
ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_contact_name VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_contact_title VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_contact_email VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_contact_phone VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- Event Overview - Logistics Contact
ALTER TABLE projects ADD COLUMN IF NOT EXISTS logistics_contact_name VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS logistics_contact_email VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS logistics_contact_phone VARCHAR(50);

-- Event Overview - Additional Fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_client_name VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_name VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_website VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS venue_name VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS venue_address TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS venue_contact_name VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS venue_contact_email VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS venue_contact_phone VARCHAR(50);

-- Speaker Program Details
ALTER TABLE projects ADD COLUMN IF NOT EXISTS requested_speaker_name VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS program_topic VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS program_type VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS audience_size INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS audience_demographics TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_attire VARCHAR(255);

-- Event Schedule
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_start_time VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_end_time VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_arrival_time VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS program_start_time VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS program_length INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS qa_length INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_program_length INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_departure_time VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_timeline TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_timezone VARCHAR(100);

-- Technical Requirements
ALTER TABLE projects ADD COLUMN IF NOT EXISTS recording_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS recording_purpose VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS live_streaming BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS photography_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_rehearsal_date VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_rehearsal_time VARCHAR(50);

-- Travel & Accommodation (new fields)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS flight_number_in VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS flight_number_out VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hotel_name VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hotel_reservation_number VARCHAR(100);

-- Additional Information
ALTER TABLE projects ADD COLUMN IF NOT EXISTS green_room_available BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS meet_greet_opportunities TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketing_use_allowed BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS press_media_present BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS media_interview_requests TEXT;

-- Financial Details
ALTER TABLE projects ADD COLUMN IF NOT EXISTS travel_expenses_type VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS travel_expenses_amount DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS purchase_order_number VARCHAR(100);

-- Confirmation Details
ALTER TABLE projects ADD COLUMN IF NOT EXISTS prep_call_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS prep_call_date VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS prep_call_time VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Speaker Information (for speaker portal integration)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_bio TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_headshot VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_presentation_title VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_av_requirements TEXT;

-- Event Classification
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_classification VARCHAR(50);

-- Add comments for key new fields
COMMENT ON COLUMN projects.logistics_contact_name IS 'Name of logistics contact person for event coordination';
COMMENT ON COLUMN projects.billing_contact_name IS 'Name of billing contact person for financial matters';
COMMENT ON COLUMN projects.flight_number_in IS 'Inbound flight number when travel is required';
COMMENT ON COLUMN projects.flight_number_out IS 'Outbound flight number when travel is required';
COMMENT ON COLUMN projects.hotel_name IS 'Hotel name when accommodation is required';
COMMENT ON COLUMN projects.hotel_reservation_number IS 'Hotel confirmation/reservation number';
COMMENT ON COLUMN projects.speaker_bio IS 'Speaker biography provided through speaker portal';
COMMENT ON COLUMN projects.speaker_headshot IS 'Speaker headshot image URL from speaker portal';
COMMENT ON COLUMN projects.speaker_presentation_title IS 'Final presentation title from speaker';
COMMENT ON COLUMN projects.speaker_av_requirements IS 'Speaker-specific A/V requirements';
COMMENT ON COLUMN projects.event_classification IS 'Event type classification: virtual, local, or travel';
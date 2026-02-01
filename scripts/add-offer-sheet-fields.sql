-- Add all fields from firm offer sheet to projects table

-- Event Overview - Billing Contact
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS billing_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_contact_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS billing_contact_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS billing_address TEXT;

-- Event Overview - Logistics Contact (already have contact_person, adding more fields)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS logistics_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS logistics_contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS logistics_contact_phone VARCHAR(50);

-- Event Overview - Additional Fields
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS end_client_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS event_name VARCHAR(500),
ADD COLUMN IF NOT EXISTS event_website VARCHAR(500),
ADD COLUMN IF NOT EXISTS venue_name VARCHAR(500),
ADD COLUMN IF NOT EXISTS venue_address TEXT,
ADD COLUMN IF NOT EXISTS venue_contact_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS venue_contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS venue_contact_phone VARCHAR(50);

-- Speaker Program Details
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS requested_speaker_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS program_topic VARCHAR(500),
ADD COLUMN IF NOT EXISTS program_type VARCHAR(100), -- Keynote, Fireside Chat, Panel, Workshop, etc.
ADD COLUMN IF NOT EXISTS audience_size INTEGER,
ADD COLUMN IF NOT EXISTS audience_demographics TEXT,
ADD COLUMN IF NOT EXISTS speaker_attire VARCHAR(100); -- Business Formal, Business Casual, etc.

-- Event Schedule
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS event_start_time TIME,
ADD COLUMN IF NOT EXISTS event_end_time TIME,
ADD COLUMN IF NOT EXISTS speaker_arrival_time TIME,
ADD COLUMN IF NOT EXISTS program_start_time TIME,
ADD COLUMN IF NOT EXISTS program_length INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS qa_length INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS total_program_length INTEGER, -- in minutes
ADD COLUMN IF NOT EXISTS speaker_departure_time TIME,
ADD COLUMN IF NOT EXISTS event_timeline TEXT, -- Full agenda with times
ADD COLUMN IF NOT EXISTS event_timezone VARCHAR(50);

-- Technical Requirements (expand existing av_requirements)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS recording_allowed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recording_purpose VARCHAR(255), -- internal use, promotional, etc.
ADD COLUMN IF NOT EXISTS live_streaming BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS photography_allowed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tech_rehearsal_date DATE,
ADD COLUMN IF NOT EXISTS tech_rehearsal_time TIME;

-- Travel & Accommodation
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS fly_in_date DATE,
ADD COLUMN IF NOT EXISTS fly_out_date DATE,
ADD COLUMN IF NOT EXISTS nearest_airport VARCHAR(255),
ADD COLUMN IF NOT EXISTS airport_transport_provided BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS airport_transport_details TEXT,
ADD COLUMN IF NOT EXISTS venue_transport_provided BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS venue_transport_details TEXT,
ADD COLUMN IF NOT EXISTS hotel_dates_needed VARCHAR(255),
ADD COLUMN IF NOT EXISTS hotel_tier_preference VARCHAR(100),
ADD COLUMN IF NOT EXISTS meals_provided TEXT,
ADD COLUMN IF NOT EXISTS dietary_requirements TEXT,
ADD COLUMN IF NOT EXISTS guest_list_details TEXT; -- reception/dinner invites, VIP meet & greet

-- Additional Information
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS green_room_available BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS meet_greet_opportunities TEXT,
ADD COLUMN IF NOT EXISTS marketing_use_allowed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS press_media_present BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS media_interview_requests TEXT,
ADD COLUMN IF NOT EXISTS special_requests TEXT;

-- Financial Details (some already exist, adding more)
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS travel_expenses_type VARCHAR(100), -- flat buyout vs actual expenses
ADD COLUMN IF NOT EXISTS travel_expenses_amount DECIMAL(10,2);

-- Confirmation Details
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS prep_call_requested BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS prep_call_date DATE,
ADD COLUMN IF NOT EXISTS prep_call_time TIME,
ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Create indexes for frequently searched fields
CREATE INDEX IF NOT EXISTS idx_projects_billing_contact_email ON projects(billing_contact_email);
CREATE INDEX IF NOT EXISTS idx_projects_logistics_contact_email ON projects(logistics_contact_email);
CREATE INDEX IF NOT EXISTS idx_projects_requested_speaker_name ON projects(requested_speaker_name);
CREATE INDEX IF NOT EXISTS idx_projects_event_name ON projects(event_name);
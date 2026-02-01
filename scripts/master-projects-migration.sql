-- MASTER MIGRATION: Add ALL missing fields to projects table
-- This script consolidates all previous migrations to ensure complete schema

-- First, add basic event fields that were in original event-focused update
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_location VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_type VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS attendee_count INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_fee DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS travel_required BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS accommodation_required BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS av_requirements TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS special_requests TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_agenda JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketing_materials JSONB;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS venue_contact VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_signed BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS invoice_sent BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_received BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS presentation_ready BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS materials_sent BOOLEAN DEFAULT false;

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
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_name VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_website VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS venue_name VARCHAR(500);
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
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_attire VARCHAR(100);

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
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_timezone VARCHAR(50);

-- Technical Requirements
ALTER TABLE projects ADD COLUMN IF NOT EXISTS recording_allowed BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS recording_purpose VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS live_streaming BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS photography_allowed BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_rehearsal_date VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS tech_rehearsal_time VARCHAR(50);

-- Travel & Accommodation (including original and new fields)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS fly_in_date VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS fly_out_date VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS flight_number_in VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS flight_number_out VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS nearest_airport VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS airport_transport_provided BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS airport_transport_details TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS venue_transport_provided BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS venue_transport_details TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hotel_name VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hotel_reservation_number VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hotel_dates_needed VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hotel_tier_preference VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS guest_list_details TEXT;

-- Additional Information
ALTER TABLE projects ADD COLUMN IF NOT EXISTS green_room_available BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS meet_greet_opportunities TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS marketing_use_allowed BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS press_media_present BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS media_interview_requests TEXT;

-- Financial Details
ALTER TABLE projects ADD COLUMN IF NOT EXISTS travel_expenses_type VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS travel_expenses_amount DECIMAL(10,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(100);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS purchase_order_number VARCHAR(100);

-- Confirmation Details
ALTER TABLE projects ADD COLUMN IF NOT EXISTS prep_call_requested BOOLEAN DEFAULT false;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS prep_call_date VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS prep_call_time VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS additional_notes TEXT;

-- Speaker Information (for speaker portal integration)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_bio TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_headshot VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_presentation_title VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_av_requirements TEXT;

-- Event Classification and Speaker Info (from event classification migration)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS event_classification VARCHAR(20);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_headshot_url VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_topics JSONB DEFAULT '[]'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_social_media JSONB DEFAULT '{}'::jsonb;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_website VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_one_liner VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS promotional_materials JSONB DEFAULT '{}'::jsonb;

-- Contracting and invoicing requirements
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_requirements TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS invoice_requirements TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contract_url VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS invoice_url VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_id INTEGER;

-- Remove deprecated fields that are no longer needed
ALTER TABLE projects DROP COLUMN IF EXISTS meals_provided;
ALTER TABLE projects DROP COLUMN IF EXISTS dietary_requirements;

-- Update status values to match current enum
UPDATE projects SET status = '2plus_months' WHERE status = 'planning';
UPDATE projects SET status = '1to2_months' WHERE status = 'in_progress';
UPDATE projects SET status = 'less_than_month' WHERE status = 'review';
UPDATE projects SET status = 'final_week' WHERE status = 'on_hold';
-- 'completed' and 'cancelled' remain the same

-- Create indexes for frequently searched fields (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_projects_event_date ON projects(event_date);
CREATE INDEX IF NOT EXISTS idx_projects_event_location ON projects(event_location);
CREATE INDEX IF NOT EXISTS idx_projects_billing_contact_email ON projects(billing_contact_email);
CREATE INDEX IF NOT EXISTS idx_projects_logistics_contact_email ON projects(logistics_contact_email);
CREATE INDEX IF NOT EXISTS idx_projects_requested_speaker_name ON projects(requested_speaker_name);
CREATE INDEX IF NOT EXISTS idx_projects_event_name ON projects(event_name);
CREATE INDEX IF NOT EXISTS idx_projects_event_classification ON projects(event_classification);

-- Add check constraint for event_classification if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'projects_event_classification_check' 
        AND table_name = 'projects'
    ) THEN
        ALTER TABLE projects ADD CONSTRAINT projects_event_classification_check 
        CHECK (event_classification IN ('virtual', 'local', 'travel'));
    END IF;
END $$;
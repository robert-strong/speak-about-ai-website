-- Update the projects table to be event-focused with timeline stages
-- First, add new columns for event management
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS event_date DATE,
ADD COLUMN IF NOT EXISTS event_location VARCHAR(500),
ADD COLUMN IF NOT EXISTS event_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS attendee_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS speaker_fee DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS travel_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accommodation_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS av_requirements TEXT,
ADD COLUMN IF NOT EXISTS catering_requirements TEXT,
ADD COLUMN IF NOT EXISTS special_requirements TEXT,
ADD COLUMN IF NOT EXISTS event_agenda JSONB,
ADD COLUMN IF NOT EXISTS marketing_materials JSONB,
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
ADD COLUMN IF NOT EXISTS venue_contact VARCHAR(255),
ADD COLUMN IF NOT EXISTS contract_signed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS invoice_sent BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS payment_received BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS presentation_ready BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS materials_sent BOOLEAN DEFAULT false;

-- Update the status field to use timeline stages
-- Note: This will update the constraint, but existing data will remain unchanged
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check 
CHECK (status IN ('2plus_months', '1to2_months', 'less_than_month', 'final_week', 'completed', 'cancelled'));

-- Update the default status
ALTER TABLE projects ALTER COLUMN status SET DEFAULT '2plus_months';

-- Create function to automatically calculate and update status based on event date
CREATE OR REPLACE FUNCTION update_project_timeline_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only auto-update status if event_date is set and status is not completed/cancelled
    IF NEW.event_date IS NOT NULL AND NEW.status NOT IN ('completed', 'cancelled') THEN
        DECLARE
            days_until_event INTEGER;
        BEGIN
            days_until_event := NEW.event_date - CURRENT_DATE;
            
            IF days_until_event > 60 THEN
                NEW.status := '2plus_months';
            ELSIF days_until_event > 30 THEN
                NEW.status := '1to2_months';
            ELSIF days_until_event > 7 THEN
                NEW.status := 'less_than_month';
            ELSIF days_until_event >= 0 THEN
                NEW.status := 'final_week';
            ELSE
                -- Event has passed, mark as completed if not already set
                IF NEW.status != 'completed' THEN
                    NEW.status := 'completed';
                    NEW.completed_at := CURRENT_TIMESTAMP;
                END IF;
            END IF;
        END;
    END IF;
    
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop the old trigger and create new one
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_timeline_status 
    BEFORE INSERT OR UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_project_timeline_status();

-- Create additional indexes for event-focused queries
CREATE INDEX IF NOT EXISTS idx_projects_event_date ON projects(event_date);
CREATE INDEX IF NOT EXISTS idx_projects_event_type ON projects(event_type);
CREATE INDEX IF NOT EXISTS idx_projects_speaker_fee ON projects(speaker_fee);
CREATE INDEX IF NOT EXISTS idx_projects_contract_signed ON projects(contract_signed);
CREATE INDEX IF NOT EXISTS idx_projects_payment_received ON projects(payment_received);

-- Sample event data (optional - uncomment to use)
/*
-- Update existing records to have event dates and proper status
UPDATE projects SET 
    event_date = deadline,
    event_location = 'TBD',
    event_type = project_type,
    attendee_count = 50,
    speaker_fee = budget
WHERE event_date IS NULL;

-- Insert sample event-focused data
INSERT INTO projects (
    project_name, client_name, client_email, company, project_type,
    description, event_date, event_location, event_type, attendee_count,
    speaker_fee, contact_person, travel_required, tags
) VALUES 
(
    'AI in Healthcare Summit 2025',
    'Dr. Sarah Johnson',
    'sarah.johnson@healthtech.com',
    'HealthTech Solutions',
    'Speaking',
    'Keynote presentation on AI applications in healthcare diagnostics',
    '2025-04-15',
    'San Francisco Convention Center, CA',
    'Conference',
    500,
    15000.00,
    'Sarah Johnson',
    true,
    ARRAY['AI', 'healthcare', 'keynote']
),
(
    'Corporate AI Workshop',
    'Michael Chen',
    'mchen@innovatecorp.com',
    'InnovateCorp',
    'Workshop',
    'Full-day workshop on implementing AI in enterprise environments',
    '2025-03-10',
    'InnovateCorp Headquarters, Seattle',
    'Workshop',
    25,
    8000.00,
    'Michael Chen',
    true,
    ARRAY['AI', 'enterprise', 'workshop']
);
*/
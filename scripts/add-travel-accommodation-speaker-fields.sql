-- Add new travel, accommodation, and speaker information fields to the projects table

-- Remove catering/dietary fields as they're no longer needed
ALTER TABLE projects DROP COLUMN IF EXISTS meals_provided;
ALTER TABLE projects DROP COLUMN IF EXISTS dietary_requirements;

-- Add new travel fields
ALTER TABLE projects ADD COLUMN IF NOT EXISTS flight_number_in VARCHAR(50);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS flight_number_out VARCHAR(50);

-- Add new accommodation fields  
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hotel_name VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS hotel_reservation_number VARCHAR(100);

-- Add speaker information fields (for speaker portal integration)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_bio TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_headshot VARCHAR(500);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_presentation_title VARCHAR(255);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS speaker_av_requirements TEXT;

-- Add comments for clarity
COMMENT ON COLUMN projects.flight_number_in IS 'Inbound flight number when travel is required';
COMMENT ON COLUMN projects.flight_number_out IS 'Outbound flight number when travel is required';
COMMENT ON COLUMN projects.hotel_name IS 'Hotel name when accommodation is required';
COMMENT ON COLUMN projects.hotel_reservation_number IS 'Hotel confirmation/reservation number';
COMMENT ON COLUMN projects.speaker_bio IS 'Speaker biography provided through speaker portal';
COMMENT ON COLUMN projects.speaker_headshot IS 'Speaker headshot image URL from speaker portal';
COMMENT ON COLUMN projects.speaker_presentation_title IS 'Final presentation title from speaker';
COMMENT ON COLUMN projects.speaker_av_requirements IS 'Speaker-specific A/V requirements';
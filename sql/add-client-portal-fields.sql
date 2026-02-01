-- Add client portal specific fields to the projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS client_portal_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS client_portal_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS client_portal_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS client_portal_invited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS client_portal_last_accessed TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS client_editable_fields TEXT[] DEFAULT ARRAY[
    'venue_name', 'venue_address', 'venue_contact_name', 'venue_contact_email', 'venue_contact_phone',
    'event_start_time', 'event_end_time', 'program_start_time', 'program_length', 'qa_length',
    'audience_demographics', 'av_requirements', 'recording_purpose', 'tech_rehearsal_date', 'tech_rehearsal_time',
    'airport_transport_details', 'venue_transport_details', 'hotel_dates_needed', 'guest_list_details',
    'meet_greet_opportunities', 'media_interview_requests', 'special_requests', 'prep_call_requested',
    'prep_call_date', 'prep_call_time', 'additional_notes', 'billing_contact_name', 'billing_contact_email',
    'billing_contact_phone', 'billing_address', 'logistics_contact_name', 'logistics_contact_email', 
    'logistics_contact_phone'
],
ADD COLUMN IF NOT EXISTS client_view_only_fields TEXT[] DEFAULT ARRAY[
    'project_name', 'event_name', 'event_date', 'requested_speaker_name', 'program_topic',
    'program_type', 'audience_size', 'speaker_attire', 'event_timeline', 'event_timezone',
    'travel_required', 'fly_in_date', 'fly_out_date', 'accommodation_required', 'speaker_fee',
    'travel_expenses_amount', 'payment_terms', 'event_location', 'event_type', 'budget'
];

-- Create index for client portal token lookups
CREATE INDEX IF NOT EXISTS idx_projects_client_portal_token ON projects(client_portal_token);

-- Create client portal invitations tracking table
CREATE TABLE IF NOT EXISTS client_portal_invitations (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    client_email VARCHAR(255) NOT NULL,
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    invited_by VARCHAR(255), -- admin email who sent invite
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_invitations_token ON client_portal_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_client_invitations_email ON client_portal_invitations(client_email);
CREATE INDEX IF NOT EXISTS idx_client_invitations_project ON client_portal_invitations(project_id);

-- Create audit log for client portal access
CREATE TABLE IF NOT EXISTS client_portal_audit_log (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id),
    client_email VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'login', 'view', 'edit', 'download', 'invitation_sent', 'invitation_accepted'
    field_changed VARCHAR(255), -- for edit actions
    old_value TEXT, -- for edit actions
    new_value TEXT, -- for edit actions
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_log_project ON client_portal_audit_log(project_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_email ON client_portal_audit_log(client_email);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON client_portal_audit_log(created_at DESC);
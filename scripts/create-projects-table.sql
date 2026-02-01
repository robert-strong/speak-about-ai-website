-- Create the projects table for tracking active projects
CREATE TABLE IF NOT EXISTS projects (
    id SERIAL PRIMARY KEY,
    project_name VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_email VARCHAR(255),
    client_phone VARCHAR(50),
    company VARCHAR(255),
    project_type VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'review', 'completed', 'on_hold', 'cancelled')),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    start_date DATE NOT NULL,
    end_date DATE,
    deadline DATE,
    budget DECIMAL(10,2) DEFAULT 0.00,
    spent DECIMAL(10,2) DEFAULT 0.00,
    completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100),
    team_members TEXT[], -- Array of team member names
    deliverables TEXT,
    milestones JSONB, -- JSON array of milestone objects
    notes TEXT,
    tags TEXT[], -- Array of project tags
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_deadline ON projects(deadline);
CREATE INDEX IF NOT EXISTS idx_projects_client_name ON projects(client_name);
CREATE INDEX IF NOT EXISTS idx_projects_company ON projects(company);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_projects_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    -- Set completed_at when status changes to completed
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        NEW.completed_at = CURRENT_TIMESTAMP;
    END IF;
    -- Clear completed_at if status changes from completed
    IF NEW.status != 'completed' AND OLD.status = 'completed' THEN
        NEW.completed_at = NULL;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_projects_updated_at_column();

-- Sample data for testing (optional - uncomment to use)
/*
INSERT INTO projects (
    project_name, client_name, client_email, company, project_type,
    description, status, priority, start_date, deadline, budget,
    team_members, tags
) VALUES 
(
    'AI Strategy Workshop',
    'John Smith',
    'john.smith@techcorp.com',
    'TechCorp Industries',
    'Workshop',
    'Comprehensive AI strategy workshop for executive team',
    'in_progress',
    'high',
    '2025-01-15',
    '2025-02-15',
    25000.00,
    ARRAY['Adam Cheyer', 'Sarah Johnson'],
    ARRAY['AI', 'strategy', 'workshop']
),
(
    'Machine Learning Implementation',
    'Sarah Davis',
    'sarah.davis@innovate.io',
    'Innovate.io',
    'Consulting',
    'End-to-end ML model development and deployment',
    'planning',
    'urgent',
    '2025-02-01',
    '2025-04-30',
    75000.00,
    ARRAY['Adam Cheyer', 'Mike Wilson', 'Emily Chen'],
    ARRAY['machine-learning', 'implementation', 'consulting']
),
(
    'AI Ethics Seminar Series',
    'Robert Brown',
    'rbrown@university.edu',
    'State University',
    'Speaking',
    'Three-part seminar series on AI ethics and responsible AI',
    'planning',
    'medium',
    '2025-03-01',
    '2025-05-31',
    45000.00,
    ARRAY['Adam Cheyer'],
    ARRAY['ethics', 'education', 'speaking']
);
*/
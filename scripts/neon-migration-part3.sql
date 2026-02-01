-- Create indexes (run after part 2)
CREATE INDEX IF NOT EXISTS idx_projects_event_date ON projects(event_date);
CREATE INDEX IF NOT EXISTS idx_projects_event_type ON projects(event_type);
CREATE INDEX IF NOT EXISTS idx_projects_speaker_fee ON projects(speaker_fee);
CREATE INDEX IF NOT EXISTS idx_projects_contract_signed ON projects(contract_signed);
CREATE INDEX IF NOT EXISTS idx_projects_payment_received ON projects(payment_received);
-- Create webhook_logs table for monitoring Outrank webhook calls
CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    webhook_type VARCHAR(50) DEFAULT 'outrank',
    request_method VARCHAR(10),
    request_headers JSONB,
    request_body JSONB,
    response_status INTEGER,
    response_body JSONB,
    error_message TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_webhook_type ON webhook_logs(webhook_type);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_response_status ON webhook_logs(response_status);

-- Keep only last 1000 logs (optional cleanup trigger)
CREATE OR REPLACE FUNCTION cleanup_old_webhook_logs()
RETURNS TRIGGER AS $$
BEGIN
    DELETE FROM webhook_logs
    WHERE id NOT IN (
        SELECT id FROM webhook_logs
        ORDER BY created_at DESC
        LIMIT 1000
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to clean up old logs
DROP TRIGGER IF EXISTS trigger_cleanup_webhook_logs ON webhook_logs;
CREATE TRIGGER trigger_cleanup_webhook_logs
    AFTER INSERT ON webhook_logs
    FOR EACH STATEMENT
    EXECUTE FUNCTION cleanup_old_webhook_logs();
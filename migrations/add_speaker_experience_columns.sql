-- Add the Experience tab columns to the speakers table.
-- These back the edit form's Past Speaking Engagements, Awards, Publications,
-- and Client Logos sections. `publications` already exists (see
-- add_speaker_profile_columns.sql); the other three were never created, so
-- saves from the Experience tab were silently dropped.
--
-- The API (app/api/admin/speakers/[id]/route.ts) also ensures these columns
-- exist at runtime, so applying this migration is optional but recommended.
ALTER TABLE speakers
ADD COLUMN IF NOT EXISTS past_events JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS awards JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS publications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS client_logos JSONB DEFAULT '[]'::jsonb;

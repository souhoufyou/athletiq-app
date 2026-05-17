-- Add updated_at columns for bidirectional sync reconciliation.
-- Run this in the Supabase SQL Editor.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE planned_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE completed_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add unique constraint for planned_sessions upsert (replaces delete+insert pattern)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'planned_sessions_user_session_unique'
  ) THEN
    ALTER TABLE planned_sessions
      ADD CONSTRAINT planned_sessions_user_session_unique UNIQUE (user_id, session_id);
  END IF;
END $$;

-- Migration 004: Add projection datetime + film proposal feature
-- Run this migration in your Supabase SQL editor.

-- ============================================================
-- Phase 3: Horaires de projection
-- ============================================================

ALTER TABLE sp_soirees ADD COLUMN IF NOT EXISTS projection_datetime TIMESTAMPTZ;

-- ============================================================
-- Phase 4: Film proposals by guests
-- ============================================================

-- Extend the phase CHECK constraint to include 'film_proposal' and 'cancelled'
ALTER TABLE sp_soirees DROP CONSTRAINT IF EXISTS sp_soirees_phase_check;
ALTER TABLE sp_soirees ADD CONSTRAINT sp_soirees_phase_check
  CHECK (phase IN ('planned', 'theme_vote', 'film_proposal', 'film_vote', 'completed', 'cancelled'));

-- New columns on sp_soirees
ALTER TABLE sp_soirees ADD COLUMN IF NOT EXISTS proposal_enabled BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE sp_soirees ADD COLUMN IF NOT EXISTS proposal_ends_at TIMESTAMPTZ;

-- New table for guest film proposals
CREATE TABLE IF NOT EXISTS sp_soiree_film_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  soiree_id UUID NOT NULL REFERENCES sp_soirees(id) ON DELETE CASCADE,
  voter_id TEXT NOT NULL,
  tmdb_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  poster_path TEXT,
  overview TEXT,
  release_date TEXT,
  director TEXT,
  duration INTEGER,
  trailer_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(soiree_id, tmdb_id)
);

-- RLS
ALTER TABLE sp_soiree_film_proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read proposals"
  ON sp_soiree_film_proposals FOR SELECT
  USING (true);

CREATE POLICY "Anyone can propose"
  ON sp_soiree_film_proposals FOR INSERT
  WITH CHECK (true);

-- Migration 005: Add 'cancelled' phase
-- Run this migration if you already ran 004 (proposals feature).
-- If you have NOT run 004 yet, use the updated 004 file instead (it already includes 'cancelled').

ALTER TABLE sp_soirees DROP CONSTRAINT IF EXISTS sp_soirees_phase_check;
ALTER TABLE sp_soirees ADD CONSTRAINT sp_soirees_phase_check
  CHECK (phase IN ('planned', 'theme_vote', 'film_proposal', 'film_vote', 'completed', 'cancelled'));

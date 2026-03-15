-- Migration 005: Add encrypted TMDb token storage to sp_salles
-- Run this in the Supabase SQL editor.
--
-- The token is encrypted client-side (AES-256-GCM) before being stored.
-- The ENCRYPTION_KEY env var is required in Vercel to decrypt it.

ALTER TABLE sp_salles
  ADD COLUMN IF NOT EXISTS tmdb_token_encrypted TEXT;

-- Only the salle owner can read or update their own token
-- (RLS policies on sp_salles already restrict access to created_by = auth.uid())

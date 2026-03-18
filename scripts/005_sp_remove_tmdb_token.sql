-- Migration 005: Remove per-user TMDb token storage
-- TMDb API key is now managed exclusively via the TMDB_API_READ_ACCESS_TOKEN env var.
-- Run this in the Supabase SQL editor.

ALTER TABLE sp_salles DROP COLUMN IF EXISTS tmdb_token_encrypted;

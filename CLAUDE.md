# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Build (copies redoc.standalone.js first via prebuild)
pnpm lint         # ESLint — zero warnings allowed (--max-warnings 0)
pnpm test         # Vitest (all tests)
pnpm test:coverage # Vitest with coverage (80% threshold on lib/**)

# Run a single test file
pnpm vitest run __tests__/lib/tmdb.test.ts

# Type-check without building
pnpm tsc --noEmit
```

## Architecture

**Pixel Night** is a collaborative film-night voting app. Organizers create events (*soirées*); participants vote anonymously (no login required). The flow follows phases: `planned → theme_vote → film_proposal → film_vote → completed`.

### Routing

- `app/s/[slug]/page.tsx` — public voting page (the main participant experience)
- `app/soiree/[id]/` — soiree detail and results pages
- `app/admin/` — organizer dashboard (requires Supabase auth)
- `app/api/soirees/[id]/` — all voting/phase transition API routes
- `app/api/tmdb/` — TMDb proxy routes (search, movie details, token management)

### Data Layer

All Supabase tables use the `sp_` prefix. Key tables:
- `sp_salles` — cinema rooms (organizer-owned, with optional TMDb token)
- `sp_soirees` — events with `phase`, vote deadlines, and `proposal_enabled`
- `sp_themes` / `sp_soiree_themes` — theme catalog and per-soiree theme selection
- `sp_soiree_films` — curated films for a soiree's film vote
- `sp_soiree_film_proposals` — participant-proposed films (max 3 per voter)
- `sp_theme_votes` / `sp_film_votes` — vote records keyed by `voter_id`

Supabase client selection:
- `lib/supabase/client.ts` — browser (SWR hooks, client components)
- `lib/supabase/server.ts` — server components and API routes
- `lib/supabase/admin.ts` — service role, used only in API routes that need to bypass RLS

### Anonymous Voting

Voter identity is a UUID stored in `localStorage` as `sp_voter_id` (`lib/voter.ts`). No authentication is needed for participants. Vote uniqueness is enforced by Supabase unique constraints on `(soiree_id, voter_id)`.

### TMDb Integration

The TMDb API token is resolved in priority order: env var `TMDB_API_TOKEN` → encrypted value in `sp_salles.tmdb_token_encrypted` (AES-256-GCM via Web Crypto API in `lib/encryption.ts`). Film scoring uses `vote_average × log(vote_count + 1)`, deduped by `tmdb_id`.

### Key Conventions

- Path alias `@/*` maps to the project root
- `components/ui/**` is auto-generated shadcn/ui — do not edit manually
- `SoireePhase` type lives in `lib/types.ts` — the source of truth for phase names
- SQL migrations are in `scripts/` — run manually in the Supabase SQL editor, not via CLI
- Coverage is only enforced on `lib/**/*.ts` (excluding `supabase/`, `types.ts`, `utils.ts`)

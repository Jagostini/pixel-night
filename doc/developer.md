# Guide Développeur — Pixel Night

## Prérequis

- Node.js >= 20
- pnpm >= 9
- Compte Supabase (gratuit)
- Compte TMDb (gratuit, pour l'API films)

## Setup local

```bash
git clone https://github.com/Jagostini/pixel-night.git
cd pixel-night
pnpm install

# Variables d'environnement
cp .env.example .env.local
# Remplir .env.local (voir doc/sysadmin.md)

pnpm dev
```

Application disponible sur http://localhost:3000.

## Structure du projet

```
pixel-night/
├── app/
│   ├── admin/              # Pages admin (auth requise)
│   │   ├── soirees/        # Liste + détail soirée
│   │   ├── salles/         # Gestion des salles
│   │   ├── themes/         # Catalogue de thèmes
│   │   └── parametres/     # Config token TMDb
│   ├── api/
│   │   ├── soirees/[id]/   # Votes, phases, propositions
│   │   └── tmdb/           # Proxy TMDb, token, statut
│   ├── auth/               # Login / signup
│   ├── docs/               # Route handler → Redoc (OpenAPI)
│   ├── roadmap/            # Page feuille de route (ISR GitHub)
│   └── s/[slug]/           # Page publique soirée
├── components/
│   ├── ui/                 # Shadcn UI (auto-généré, ne pas modifier)
│   └── *.tsx               # Composants métier
├── lib/
│   ├── supabase/
│   │   ├── client.ts       # createBrowserClient (Client Components)
│   │   ├── server.ts       # createServerClient (Server Components, Route Handlers)
│   │   └── admin.ts        # createAdminClient (service role, contourne RLS)
│   ├── types.ts            # Types partagés (SoireePhase, SpSoiree, etc.)
│   ├── tmdb.ts             # tmdbPoster(), tmdbBackdrop(), tmdbHeaders()
│   ├── tmdb-token.ts       # getActiveTmdbToken() — env var ou DB chiffré
│   ├── encryption.ts       # encrypt() / decrypt() AES-256-GCM
│   ├── duration.ts         # parseDurationToMinutes() / formatDurationFromMinutes()
│   └── voter.ts            # getVoterId() — ID anonyme localStorage
├── __tests__/
│   ├── lib/                # Tests unitaires des utilitaires
│   └── api/                # Tests de logique API (finalize-*)
├── scripts/                # Migrations SQL (exécuter dans l'ordre)
├── doc/                    # Documentation
├── public/
│   └── openapi.yaml        # Spec OpenAPI 3.0
└── proxy.ts                # Proxy Supabase SSR (anciennement middleware.ts)
```

## Commandes utiles

```bash
pnpm dev          # Serveur de développement
pnpm build        # Build de production
pnpm lint         # ESLint
pnpm test         # Tests unitaires (Vitest)
pnpm test --ui    # Interface Vitest (mode watch)
```

## Ajouter une route API

1. Créer `app/api/<resource>/route.ts`
2. Exporter les méthodes HTTP (`GET`, `POST`, `DELETE`, etc.)
3. Pour les routes nécessitant l'auth :
   ```typescript
   import { createClient } from "@/lib/supabase/server"
   const authSupabase = await createClient()
   const { data: { user } } = await authSupabase.auth.getUser()
   if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 })
   ```
4. Pour contourner RLS (votes anonymes) :
   ```typescript
   import { createAdminClient } from "@/lib/supabase/admin"
   const supabase = createAdminClient()
   ```
5. Documenter l'endpoint dans `public/openapi.yaml`

## Utiliser le client Supabase correct

| Contexte | Client | Raison |
|---|---|---|
| Server Component, Route Handler (lecture auth) | `createClient()` de `lib/supabase/server.ts` | Lit les cookies de session |
| Client Component | `createClient()` de `lib/supabase/client.ts` | Browser, cache SWR |
| Route Handler avec votes anonymes | `createAdminClient()` | Service role, bypass RLS |

## Bibliothèques clés

### `lib/tmdb-token.ts`

```typescript
// Résout le token TMDb actif (env var en priorité, sinon DB chiffrée)
const token = await getActiveTmdbToken()
if (!token) return NextResponse.json({ error: "Token TMDb non configuré" }, { status: 500 })

// Toujours passer le token explicitement à tmdbHeaders
const res = await fetch(url, { headers: tmdbHeaders(token) })
```

### `lib/duration.ts`

```typescript
// Parseur de durée texte → minutes
parseDurationToMinutes("2 jours")  // → 2880
parseDurationToMinutes("1h30")     // → 90
parseDurationToMinutes("30min")    // → 30
parseDurationToMinutes("60")       // → 60

// Formater pour affichage
formatDurationFromMinutes(90)      // → "1h30"
formatDurationFromMinutes(2880)    // → "2j"
```

### `lib/encryption.ts`

```typescript
// AES-256-GCM — requiert une clé hex 64 chars (32 octets)
const encrypted = await encrypt("my-token", process.env.ENCRYPTION_KEY!)
const plain = await decrypt(encrypted, process.env.ENCRYPTION_KEY!)
```

### `lib/voter.ts`

```typescript
// Retourne (ou génère) l'UUID anonyme du votant depuis localStorage
const voterId = getVoterId()
```

## Conventions de code

### TypeScript

- Mode strict activé (`tsconfig.json`)
- Tous les types partagés dans `lib/types.ts`
- Préférer `unknown` à `any` — les `any` sont en `warn`, pas `error`

### Composants

- Composants fonctionnels uniquement
- Server Component par défaut — ajouter `"use client"` seulement si nécessaire
- Les composants `components/ui/` sont auto-générés par shadcn — ne pas modifier directement

### API Routes

- Retourner systématiquement `NextResponse.json({ error: "..." }, { status: xxx })` en cas d'erreur
- Pas de mutation de `process.env` (token TMDb) — utiliser `getActiveTmdbToken()`
- Vérification auth en début de route pour les endpoints admin

### Nommage

- Fichiers : `kebab-case` (ex: `film-proposal-search.tsx`)
- Composants React : `PascalCase`
- Fonctions utilitaires : `camelCase`
- Tables DB : `sp_snake_case`

## Tests

Les tests unitaires sont dans `__tests__/` et utilisent **Vitest 4** avec l'environnement `happy-dom`.

```bash
pnpm test                    # Run all tests
pnpm test lib/encryption     # Run specific test file
```

### Modules testés

| Fichier de test | Ce qui est testé |
|---|---|
| `__tests__/lib/tmdb.test.ts` | `tmdbPoster()`, `tmdbBackdrop()`, `tmdbHeaders()` |
| `__tests__/lib/duration.test.ts` | `parseDurationToMinutes()`, `formatDurationFromMinutes()` |
| `__tests__/lib/encryption.test.ts` | `encrypt()`, `decrypt()`, round-trips, tampering |
| `__tests__/lib/tmdb-token.test.ts` | `getActiveTmdbToken()` — env var, DB fallback, erreurs |
| `__tests__/api/finalize-theme.test.ts` | Logique de départage à égalité |
| `__tests__/api/finalize-film.test.ts` | Logique de départage à égalité |

### Écrire un test

```typescript
import { describe, it, expect, vi } from "vitest"

// Mocker un module
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))

// Stubber une variable d'env
vi.stubEnv("ENCRYPTION_KEY", "a".repeat(64))
```

## ESLint

Configuration flat config native (ESLint 9 + eslint-config-next 16).

```bash
pnpm lint
```

Les dossiers `components/ui/**` sont exclus (code auto-généré shadcn).

## Migrations de base de données

Les migrations sont dans `scripts/` — exécuter dans l'ordre dans le SQL Editor Supabase.

```
001_sp_create_tables.sql
002_sp_rls_policies.sql
003_sp_profile_trigger.sql
004_sp_add_projection_proposals.sql
005_sp_add_cancelled_phase.sql
005_sp_add_tmdb_token.sql
006_sp_add_salles.sql
007_sp_grants_salles.sql
```

Pour ajouter une migration : créer `scripts/00N_sp_description.sql` avec des `ALTER TABLE`
ou `CREATE TABLE IF NOT EXISTS`.

# Architecture — Pixel Night

## Vue d'ensemble

Pixel Night est une application **Next.js 16 App Router** hébergée sur Vercel, utilisant
Supabase comme backend (auth + base de données PostgreSQL + RLS) et TMDb pour les données
films.

```
┌─────────────────────────────────────────────────────────┐
│                        Vercel                           │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │           Next.js 16 (App Router)                │   │
│  │                                                  │   │
│  │  ┌─────────────┐   ┌───────────────────────────┐ │   │
│  │  │ Server      │   │ Client Components         │ │   │
│  │  │ Components  │   │ (React 19, SWR, Sonner)   │ │   │
│  │  └──────┬──────┘   └───────────┬───────────────┘ │   │
│  │         │                      │                 │   │
│  │  ┌──────▼──────────────────────▼───────────────┐ │   │
│  │  │         Route Handlers (app/api/)           │ │   │
│  │  └──────────────────────┬──────────────────────┘ │   │
│  └─────────────────────────┼────────────────────────┘   │
│                            │                            │
└────────────────────────────┼────────────────────────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
    ┌─────▼──────┐   ┌───────▼──────┐   ┌──────▼──────┐
    │  Supabase  │   │  Supabase    │   │    TMDb     │
    │    Auth    │   │ PostgreSQL   │   │     API     │
    │  (sessions)│   │ (RLS + sp_)  │   │  (films)    │
    └────────────┘   └───────────-──┘   └─────────────┘
```

## Stack technique

| Couche | Technologie | Version | Raison du choix |
|---|---|---|---|
| Framework | Next.js App Router | 16 | SSR/ISR natif, route handlers, proxy.ts |
| Langage | TypeScript | 5.7 | Typage strict, DX |
| UI | shadcn/ui + Radix UI | — | Composants accessibles, sans style imposé |
| CSS | Tailwind CSS | 4 | Utility-first, cohérence design |
| Auth + DB | Supabase | — | PostgreSQL managé, Auth intégrée, RLS |
| Films | TMDb API | v3 | Base de données films la plus complète |
| Data fetching client | SWR | — | Cache, revalidation, UX optimiste |
| Toasts | Sonner | — | API simple, rendu natif |
| Tests | Vitest | 4 | Rapide, compatible ESM, happy-dom |
| Hébergement | Vercel | — | Intégration Next.js native, ISR |

## Modèle de données

### Schéma des tables (`sp_` = Soirée Pixelisée)

```
sp_profiles            sp_salles
    │                     │
    │ created_by          │ created_by
    │                     │
    ▼                     ▼
sp_themes ──────► sp_soirees ─────────────────────────────────┐
(catalogue)           │                                       │
                      │ soiree_id                             │
          ┌───────────┼────────────────┐                      │
          │           │                │                      │
          ▼           ▼                ▼                      │
   sp_soiree_themes  sp_soiree_films  sp_soiree_film_proposals│
          │           │                                       │
          │           │                                       │
          ▼           ▼                                       │
   sp_theme_votes  sp_film_votes                              │
                                                              │
   sp_salles.tmdb_token_encrypted ◄───────────────────────────┘
   (AES-256-GCM)
```

### Types clés (`lib/types.ts`)

```typescript
type SoireePhase =
  | "planned"        // créée, votes fermés
  | "theme_vote"     // votes thème ouverts
  | "film_proposal"  // propositions de films ouvertes
  | "film_vote"      // votes film ouverts
  | "completed"      // terminée
  | "cancelled"      // annulée
```

### Relations importantes

- `sp_soirees.winning_theme_id → sp_themes.id`
- `sp_soiree_themes.theme_id → sp_themes.id`
- `sp_soiree_films.soiree_id → sp_soirees.id` (unique sur `soiree_id, tmdb_id`)
- `sp_soiree_film_proposals.soiree_id → sp_soirees.id` (max 3 par `voter_id`)

## Authentification et autorisation

### Flux d'authentification

```
Navigateur          Next.js (proxy.ts)        Supabase Auth
    │                       │                       │
    ├──── GET /admin ──────►│                       │
    │                       ├── getSession() ──────►│
    │                       │◄── session ───────────┤
    │                       │                       │
    │  [session valide]     │                       │
    │◄── 200 /admin ────────┤                       │
    │                       │                       │
    │  [pas de session]     │                       │
    │◄── redirect /auth ────┤                       │
```

**`proxy.ts`** (anciennement `middleware.ts`) gère le rafraîchissement des cookies de session
Supabase SSR à chaque requête.

### Row Level Security (RLS)

Les tables `sp_*` utilisent des politiques RLS Supabase :
- Les **lectures** de votes et thèmes sont publiques (participants anonymes)
- Les **écritures** de vote passent par le service role (route handlers admin client)
- Les données d'admin (soirées, thèmes) sont restreintes à `auth.uid() = created_by`

## Flux de données — Exemple : vote de thème

```
Participant (Browser)              Route Handler              Supabase DB
       │                               │                          │
       ├── POST /api/soirees/{id}/ ───►│                          │
       │        vote-theme             │── SELECT sp_theme_votes  │
       │   { soireeThemeId, voterId }  │   WHERE voter_id = ?     │
       │                               │◄── exists? ──────────────┤
       │                               │                          │
       │                    [déjà voté]│                          │
       │◄── 409 "Déjà voté" ───────────┤                          │
       │                               │                          │
       │                  [premier vote]                          │
       │                               ├─ INSERT sp_theme_votes ─►│
       │                               ├─ COUNT votes ───────────►│
       │                               ├─ UPDATE sp_soiree_themes ─►│
       │◄── 200 { success: true } ─────┤                          │
```

## Résolution du token TMDb

```
getActiveTmdbToken()
        │
        ├── process.env.TMDB_API_READ_ACCESS_TOKEN ?
        │         ├── oui → retourne le token (env)
        │         └── non ─────────────────────────────────────────┐
        │                                                          │
        ├── process.env.ENCRYPTION_KEY ?                           │
        │         ├── non → retourne null                          │
        │         └── oui ──────────────────────────────────────┐  │
        │                                                       │  │
        │         Supabase: SELECT tmdb_token_encrypted         │  │
        │         FROM sp_salles WHERE created_by = userId      │  │
        │                   │                                   │  │
        │         decrypt(blob, ENCRYPTION_KEY)  ←──────────────┘  │
        │                   │                                      │
        └── retourne token décrypté (ou null si erreur)   ◄────────┘
```

## Algorithme de sélection des films (TMDb)

```
keywords = theme.keywords || [theme.name]
queries  = [...keywords, keywords.join(" ")]

Pour chaque query:
  GET /search/movie?query={q}&language=fr-FR
  Pour chaque film:
    if adult || vote_count < 50 → skip
    score = vote_average × log(vote_count + 1)
    scored.set(tmdb_id, max(existing.score, score))

selectedMovies = sorted(scored, desc score).slice(0, film_count × 2)

Pour chaque film sélectionné:
  GET /movie/{id}?append_to_response=credits,videos
  → director, runtime, trailer YouTube
```

## Performances et cache

- **ISR** : `/roadmap` revalidée toutes les 5 min (GitHub Issues API)
- **`/docs`** : statique (`force-static`), aucun appel serveur
- **SWR** : revalidation automatique côté client sur les pages de vote
- **Images TMDb** : `next/image` avec domaine `image.tmdb.org` configuré

## Choix techniques notables

| Décision | Alternative écartée | Raison |
|---|---|---|
| `window.location.assign` pour redirect post-login | `router.push + router.refresh` | Next.js 16 : les cookies sont inclus dans une requête HTTP complète, pas dans la navigation soft |
| AES-256-GCM Web Crypto API | Node.js `crypto` | Compatible Edge Runtime, aucune dépendance |
| Service role pour les votes | Client avec RLS | Les votants sont anonymes, pas d'user Supabase — RLS ne peut pas les identifier |
| Durée en texte libre → minutes | Champ number direct | UX : "2 jours" plus naturel que "2880 minutes" |

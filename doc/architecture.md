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
| Langage | TypeScript | 5.9 | Typage strict, DX |
| UI | shadcn/ui + Radix UI | — | Composants accessibles, sans style imposé |
| CSS | Tailwind CSS | 4 | Utility-first, cohérence design |
| Auth + DB | Supabase | — | PostgreSQL managé, Auth intégrée, RLS |
| Films | TMDb API | v3 | Base de données films la plus complète |
| Data fetching client | SWR | — | Cache, revalidation, UX optimiste |
| Toasts | Sonner | — | API simple, rendu natif |
| Tests | Vitest | 4 | Rapide, compatible ESM, happy-dom |
| Hébergement | Vercel | — | Intégration Next.js native, ISR |

## Modèle de données

### Hiérarchie Cinéma / Salles / Soirées

```
sp_salles (cinéma)
    │  slug, name, exclusion_mode, exclusion_value
    │
    ├── sp_salle_rooms (salles physiques)
    │       name?, capacity?, room_order
    │
    └── sp_soirees (soirées)
            room_id → sp_salle_rooms.id
```

Un organisateur possède **un seul cinéma** (`sp_salles`) qui peut avoir **plusieurs salles**
(`sp_salle_rooms`). Chaque soirée est rattachée à une salle.

### Schéma des tables (`sp_` = Soirée Pixelisée)

```
sp_profiles            sp_salles
    │                     │  exclusion_mode, exclusion_value
    │ created_by          │  created_by
    │                     │
    │                     ├── sp_salle_rooms
    │                     │       room_id
    ▼                     ▼
sp_themes ──────► sp_soirees ─────────────────────────────────┐
(catalogue)           │  room_id → sp_salle_rooms             │
 genre_ids[]          │                                       │
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

type ExclusionMode = "none" | "days" | "soirees"

interface SpSalle {
  id: string
  slug: string
  name: string
  exclusion_mode: ExclusionMode
  exclusion_value: number  // nombre de jours ou de soirées
  // ...
}

interface SpSalleRoom {
  id: string
  salle_id: string
  name: string | null
  capacity: number | null
  room_order: number
  created_at: string
}

interface SpTheme {
  // ...
  genre_ids: number[]   // IDs de genres TMDb pour la Découverte
  keywords: string[]
}
```

### Relations importantes

- `sp_soirees.winning_theme_id → sp_themes.id`
- `sp_soirees.room_id → sp_salle_rooms.id`
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
- `sp_salle_rooms` : lecture/écriture via `EXISTS (SELECT 1 FROM sp_salles WHERE id = salle_id AND created_by = auth.uid())`

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

Le token TMDb provient exclusivement de la variable d'environnement `process.env.TMDB_API_READ_ACCESS_TOKEN` (côté serveur uniquement). Il n'y a pas de fallback base de données ni de chiffrement impliqué.

```
getActiveTmdbToken()
        │
        └── process.env.TMDB_API_READ_ACCESS_TOKEN ?
                  ├── oui → retourne le token (env)
                  └── non → retourne null
```

## Algorithme de sélection des films

### Mode mots-clés (`fetch-films`)

```
keywords = theme.keywords || [theme.name]
queries  = [...keywords, keywords.join(" ")]

Pour chaque query:
  GET /search/movie?query={q}&language=fr-FR
  Pour chaque film:
    if adult || vote_count < 50 → skip
    score = vote_average × log(vote_count + 1)
    scored.set(tmdb_id, max(existing.score, score))

selectedMovies = sorted(scored, desc score).slice(0, film_count)

Pour chaque film sélectionné:
  GET /movie/{id}?append_to_response=credits,videos
  → director, runtime, trailer YouTube
```

### Mode découverte (`fetch-films-discover`)

Utilisé quand le thème a des `genre_ids` configurés (sinon, repli sur mots-clés).

```
genre_ids = theme.genre_ids  (ex: [878, 18])

GET /discover/movie?with_genres=878,18
  &sort_by=popularity.desc
  &vote_count.gte=100
  &vote_average.gte=6
  &language=fr-FR

→ Récupère 5 pages aléatoires parmi les 10 premières
→ Déduplique, enrichit chaque film (réalisateur, durée, bande-annonce)
→ Retourne { success, count, used_discover: true }
```

### Curation manuelle (`DELETE/POST /soirees/{id}/films`)

```
Avant premier vote :
  DELETE → supprime le film de sp_soiree_films
  POST   → ajoute un film depuis TMDb (recherche + enrichissement)

Après premier vote (sp_film_votes.count > 0) :
  → 409 Conflict — modification impossible
```

## Règles d'exclusion des thèmes

Après finalisation du film gagnant, le thème gagnant est exclu selon la règle du cinéma :

```
exclusion_mode = "none"    → aucune exclusion
exclusion_mode = "days"    → excluded_until = now + exclusion_value jours
exclusion_mode = "soirees" → excluded_until = now + exclusion_value × 30 jours
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
| Catalogue de thèmes statique | Génération IA | Pas de dépendance externe, résultats reproductibles, moins coûteux |
| TMDb Discover pour les genres | Recherche par mots-clés seulement | Discover retourne des films populaires cohérents avec le genre, plus variés |

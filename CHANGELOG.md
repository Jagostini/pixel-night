# Changelog

Toutes les modifications notables de Pixel Night sont documentées ici.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [Unreleased] — v2.0.0

### ⚠ Breaking Changes

- **Token TMDb** : le token n'est plus stocké en base de données. Il doit être fourni via la variable d'environnement `TMDB_API_READ_ACCESS_TOKEN`. Toute instance qui utilisait la configuration via l'interface admin **perd la connexion TMDb** sans migration.

**Migration requise avant mise à jour :**
1. Définir `TMDB_API_READ_ACCESS_TOKEN` dans les variables d'environnement Vercel (si pas déjà fait)
2. Exécuter `scripts/005_sp_remove_tmdb_token.sql` dans le SQL Editor Supabase

### Ajouté

- **Page de crédits TMDb** (`/credits`) : logo officiel, mention légale requise par TMDb, section licence MIT.
- **Lien « Crédits »** dans le footer (icône Award).
- **Champ `film_count` modifiable** après création de la soirée (phases `planned`, `theme_vote`, `film_proposal`) via `PATCH /api/soirees/[id]/update-settings`.
- **Durée de vote en format lisible** (`1h`, `2 jours`, `30min`, vide = illimité) — même expérience que le champ durée des propositions.
- **Durée des propositions nullable** : champ vide = pas de délai automatique (clôture manuelle uniquement).
- **Client TMDb centralisé** (`lib/tmdb-client.ts`) : concurrence limitée à 8 requêtes parallèles (`p-limit`), retry automatique sur HTTP 429 avec back-off exponentiel.
- **Badge de version dans le footer** : affiche `v1.x.x` en production et `build #abc1234` en preview Vercel (masqué en local).
- **Pages légales** : `/legal` (mentions légales LCEN) et `/privacy` (politique de confidentialité RGPD) avec liens dans le footer.
- **Vercel Speed Insights** : collecte des Core Web Vitals (LCP, FID, CLS) pour le suivi des performances en production.
- **CodeQL** : analyse statique de sécurité (GitHub Code Scanning) sur chaque PR et push vers `main`.

### Modifié

- **Gestion du token TMDb simplifiée** : le token est désormais lu exclusivement depuis la variable d'environnement `TMDB_API_READ_ACCESS_TOKEN`. La configuration par utilisateur (stockage chiffré en base) a été supprimée.
- **Correction du comptage de films** : `fetch-films`, `fetch-films-discover` et `close-proposals` insèrent maintenant exactement `film_count` films (corrigé depuis `film_count × 2`).
- **Interface Admin — Paramètres** : la carte de configuration du token TMDb a été retirée (token géré uniquement côté serveur).

### Sécurité

- **Vérification de propriété (403)** ajoutée sur toutes les routes de mutation de soirée : `cancel`, `delete`, `finalize-theme`, `finalize-film`, `fetch-films`, `fetch-films-discover`, `films` (DELETE + POST), `start-proposals`, `close-proposals`, `update-settings` — seul le créateur de la soirée peut effectuer ces actions.
- **Suppression de `lib/encryption.ts`** et de la colonne `tmdb_token_encrypted` : aucun secret chiffré stocké en base.
- **Patch CVE-2026-26278** (high, `fast-xml-parser` via `redoc`) via override pnpm `>=5.5.6`.

### Supprimé

- Route `POST /api/tmdb/save-token` (configuration par utilisateur supprimée).
- Route `GET /api/tmdb/test`.
- `lib/encryption.ts` et `__tests__/lib/encryption.test.ts`.

### Tests

- Suite portée à **139 tests** — couverture 100 % sur tous les modules `lib/`.
- Ajout : `__tests__/lib/tmdb-client.test.ts` (5 tests : succès, retry 429, limite retry, pas de retry 500, concurrence limiter).
- Ajout : `__tests__/lib/build-info.test.ts` (5 tests : production, preview avec/sans SHA, development, local).
- Ajout : `__tests__/api/update-settings.test.ts` (9 tests : phase gate, validation `film_count`, ownership).
- Ajout : `__tests__/api/start-proposals.test.ts` (5 tests : calcul deadline nullable).
- Mise à jour : `__tests__/lib/tmdb-token.test.ts`, `__tests__/lib/voter.test.ts` (couverture SSR).

### Migration requise

- Exécuter `scripts/005_sp_remove_tmdb_token.sql` pour supprimer la colonne `tmdb_token_encrypted` de `sp_salles`.
- Configurer `TMDB_API_READ_ACCESS_TOKEN` dans les variables d'environnement Vercel si ce n'est pas déjà fait.

---

## [1.3.0] — 2026-03-16

**Commits** : [`5b3e529`](https://github.com/Jagostini/pixel-night/commit/5b3e529) → [`d697313`](https://github.com/Jagostini/pixel-night/commit/d697313)

Inclut : PR #7 (`documentation`).

### Ajouté
- Système de documentation dynamique avec rendu Markdown et référence API interactive (Redoc + OpenAPI)
- Configuration Dependabot pour npm et GitHub Actions (mises à jour automatiques des dépendances)
- Gouvernance du projet : guide de contribution (`CONTRIBUTING.md`), code de conduite, templates de PR/issues
- Améliorations CI/CD : workflows GitHub Actions renforcés
- Renommage du projet en **Pixel Night**

---

## [1.2.0] — 2026-03-15

**Commits** : [`67872a3`](https://github.com/Jagostini/pixel-night/commit/67872a3) → [`015e412`](https://github.com/Jagostini/pixel-night/commit/015e412)

Inclut : PR #6 (`correction_proposition`), renommage proxy, token chiffré, documentation.

### Ajouté
- Chiffrement AES-256-GCM du token TMDb (`lib/encryption.ts`) — stocké dans `sp_salles.tmdb_token_encrypted`
- `lib/tmdb-token.ts` — résolution du token actif (env var en priorité, sinon DB chiffrée)
- `lib/duration.ts` — parseur de durée texte libre (`"2 jours"` → 2880 min, `"1h30"` → 90 min)
- Durée des propositions en champ texte libre avec aperçu en direct dans l'admin
- Feedback de recherche amélioré : état d'erreur et état "aucun résultat" dans `film-proposal-search`
- Page `/roadmap` synchronisée avec les issues GitHub (ISR 5 min)
- Page `/docs` avec documentation API interactive (Redoc + OpenAPI 3.0)
- `public/openapi.yaml` — spécification OpenAPI complète de tous les endpoints
- Répertoire `doc/` avec documentation pour architectes, développeurs, UX, sysadmin, DevOps, sécurité, QA, organisateurs et participants
- Footer mis à jour : liens GitHub, documentation, roadmap, contribution
- `CHANGELOG.md` (ce fichier)
- Script SQL `scripts/005_sp_add_tmdb_token.sql`
- Tests unitaires : `encryption.test.ts` (9 tests), `tmdb-token.test.ts` (7 tests), `duration.test.ts` (30+ tests)

### Modifié
- `proxy.ts` remplace `middleware.ts` (dépréciation Next.js 16) — [`67872a3`](https://github.com/Jagostini/pixel-night/commit/67872a3)
- `lib/tmdb.ts` : `tmdbHeaders()` requiert maintenant un token explicite en paramètre
- Redirect post-login : `window.location.assign("/admin")` remplace `router.push + router.refresh`
- Tous les endpoints TMDb passent le token explicitement à `tmdbHeaders(token)`

### Corrigé
- Token TMDb perdu au redémarrage du serveur (plus de mutation `process.env`)
- Pas de message de succès ni de redirect après connexion — [`8d2386d`](https://github.com/Jagostini/pixel-night/commit/8d2386d)

---

## [1.1.0] — 2026-03-15

**Commits** : [`ed86a90`](https://github.com/Jagostini/pixel-night/commit/ed86a90) → [`d1854b8`](https://github.com/Jagostini/pixel-night/commit/d1854b8)

Inclut : PR #2 (`amelioration`), PR #3 (`delete_action`), PR #4 (`multi_cine`), PR #5 (`multi_cine`).

### Ajouté
- Phase `film_proposal` : les participants peuvent proposer jusqu'à 3 films — [`ed86a90`](https://github.com/Jagostini/pixel-night/commit/ed86a90)
- API routes : `start-proposals`, `close-proposals`, `propose-film`, `proposals`
- Phase `cancelled` : annulation de soirée par l'organisateur — [`3e48d21`](https://github.com/Jagostini/pixel-night/commit/3e48d21)
- Suppression de soirée (`delete` route)
- Table `sp_salles` — salles de cinéma associées aux soirées — [`06b6c85`](https://github.com/Jagostini/pixel-night/commit/06b6c85)
- Identifiants votants spécifiques à la salle (`sp_voter_id_{salleId}`) — [`2b0c2a9`](https://github.com/Jagostini/pixel-night/commit/2b0c2a9)
- Prochaines soirées affichées sur les pages de salle publiques
- Grants DB pour les nouvelles tables — [`289f130`](https://github.com/Jagostini/pixel-night/commit/289f130)
- Scripts SQL `004`, `005` (phase cancelled), `006`, `007`

### Modifié
- Transition conditionnelle `theme_vote → film_vote` ou `theme_vote` selon `proposal_enabled` — [`2ff5ef5`](https://github.com/Jagostini/pixel-night/commit/2ff5ef5)
- Navigation vers les pages de salle améliorée

---

## [1.0.0] — 2026-03-12

**Commit** : [`f5651c2`](https://github.com/Jagostini/pixel-night/commit/f5651c2) (Merge PR #3 `delete_action`)

Inclut les fonctionnalités de `v1.0.0-beta.1` + propositions de films (PR #2) + annulation/suppression (PR #3).

### Ajouté
- Phase `film_proposal` : propositions de films par les participants (max 3)
- API routes : `start-proposals`, `close-proposals`, `propose-film`, `proposals`
- Phase `cancelled` : annulation de soirée par l'organisateur
- Suppression de soirée
- Transition conditionnelle `theme_vote → film_vote` selon `proposal_enabled`

## [1.0.0-beta.1] — 2026-02-18

**Commit** : [`93514a3`](https://github.com/Jagostini/pixel-night/commit/93514a3) (Merge PR #1)

### Ajouté
- Vote de thème anonyme (sans compte)
- Vote de film anonyme
- Interface organisateur avec authentification Supabase
- Catalogue de thèmes avec mots-clés pour la recherche TMDb
- Algorithme de sélection films : score = `vote_average × log(vote_count + 1)`
- Déduplication par `tmdb_id`, filtre `vote_count >= 50` et `adult = false`
- Fetch détails film (réalisateur, durée, bande-annonce YouTube)
- Gestion des soirées (création, phases, finalisation)
- Identifiant votant anonyme (`localStorage`)
- Gestion des égalités par tirage au sort
- Scripts SQL de base (`001`, `002`, `003`)
- Stack : Next.js 16, Supabase, TMDb, shadcn/ui, Tailwind 4, Vitest

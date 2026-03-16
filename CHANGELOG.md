# Changelog

Toutes les modifications notables de Pixel Night sont documentées ici.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

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

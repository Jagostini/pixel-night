# Changelog

Toutes les modifications notables de Pixel Night sont documentées ici.

Format basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/).

---

## [1.2.0] — 2026-03-15

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
- `proxy.ts` remplace `middleware.ts` (dépréciation Next.js 16)
- `lib/tmdb.ts` : `tmdbHeaders()` requiert maintenant un token explicite en paramètre
- Redirect post-login : `window.location.assign("/admin")` remplace `router.push + router.refresh`
- Tous les endpoints TMDb passent le token explicitement à `tmdbHeaders(token)`

### Corrigé
- Token TMDb perdu au redémarrage du serveur (plus de mutation `process.env`)
- Pas de message de succès ni de redirect après connexion

---

## [1.1.0] — 2026-02

### Ajouté
- Phase `film_proposal` : les participants peuvent proposer jusqu'à 3 films
- API routes : `start-proposals`, `close-proposals`, `propose-film`, `proposals`
- Phase `cancelled` : annulation de soirée par l'organisateur
- Suppression de soirée (`delete` route)
- Table `sp_salles` — salles de cinéma associées aux soirées
- Identifiants votants spécifiques à la salle (`sp_voter_id_{salleId}`)
- Prochaines soirées affichées sur les pages de salle publiques
- Scripts SQL `004`, `005`, `006`, `007`

### Modifié
- Navigation vers les pages de salle améliorée

---

## [1.0.0] — 2026-01

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

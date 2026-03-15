# Guide Testeur / QA — Pixel Night

## Tests automatisés

### Lancer les tests

```bash
pnpm test              # Run all (once)
pnpm test --watch      # Mode watch
pnpm test --ui         # Interface Vitest
pnpm test --coverage   # Couverture de code
```

### Suite de tests unitaires

| Fichier | Tests | Ce qui est couvert |
|---|---|---|
| `__tests__/lib/tmdb.test.ts` | 8 | `tmdbPoster()`, `tmdbBackdrop()`, `tmdbHeaders()` |
| `__tests__/lib/duration.test.ts` | 30+ | `parseDurationToMinutes()`, `formatDurationFromMinutes()`, formats divers |
| `__tests__/lib/encryption.test.ts` | 9 | `encrypt()`, `decrypt()`, round-trips, mauvaise clé, tampering |
| `__tests__/lib/tmdb-token.test.ts` | 7 | `getActiveTmdbToken()` — env var, DB fallback, erreurs decrypt/Supabase |
| `__tests__/api/finalize-theme.test.ts` | — | Logique de départage à égalité (tirage au sort) |
| `__tests__/api/finalize-film.test.ts` | — | Logique de départage à égalité |

## Plan de test manuel

### Prérequis

- Application déployée (ou `pnpm dev` local)
- Compte organisateur créé
- Token TMDb configuré (`GET /api/tmdb/status` → `{ configured: true }`)
- Au moins un thème dans le catalogue

---

### Module 1 — Authentification

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| AUTH-01 | Connexion valide | Saisir email + mot de passe corrects | Redirect `/admin`, toast « Connexion réussie ! » |
| AUTH-02 | Connexion échouée | Mauvais mot de passe | Message d'erreur, reste sur `/auth/login` |
| AUTH-03 | Accès admin sans auth | Ouvrir `/admin` sans session | Redirect vers `/auth/login` |
| AUTH-04 | Déconnexion | Cliquer "Se déconnecter" | Redirect `/`, session invalidée |

---

### Module 2 — Création de soirée

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| CREA-01 | Création basique | Remplir le formulaire, sans propositions | Soirée créée en phase `planned` |
| CREA-02 | Avec propositions | Activer "propositions", saisir "2 jours" | Soirée créée, durée correctement parsée |
| CREA-03 | Durée invalide | Saisir "abc" dans le champ durée | Bouton "Créer" désactivé, « Format non reconnu » |
| CREA-04 | Durée "1h30" | Saisir "1h30" | Aperçu « Durée : 1h30 », soit 90 min |
| CREA-05 | Durée "3j" | Saisir "3j" | Aperçu « Durée : 3j », soit 4320 min |

---

### Module 3 — Vote de thème

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| VOTE-T01 | Accès page publique | Ouvrir `/s/{slug}` | Affiche les thèmes si phase `theme_vote` |
| VOTE-T02 | Premier vote | Cliquer sur un thème | Toast succès, bouton désactivé |
| VOTE-T03 | Double vote (même session) | Re-cliquer un thème | Toast erreur « Déjà voté » |
| VOTE-T04 | Double vote (localStorage vidé) | Vider localStorage, recharger, voter | Vote accepté (nouvel ID anonyme) |
| VOTE-T05 | Finaliser (sans égalité) | Admin : cliquer "Finaliser le thème" | Thème gagnant affiché, phase change |
| VOTE-T06 | Finaliser (avec égalité) | Votes égaux sur 2 thèmes | Un thème désigné au hasard |

---

### Module 4 — Phase propositions

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| PROP-01 | Lancer les propositions | Admin : cliquer "Lancer les propositions" | Phase `film_proposal`, minuterie affichée |
| PROP-02 | Rechercher un film | Participant : saisir un terme, chercher | Résultats TMDb affichés |
| PROP-03 | Proposer un film | Cliquer "Proposer" sur un film | Film ajouté à la liste des propositions |
| PROP-04 | 3 propositions max | Proposer un 4ème film | Erreur « Limite atteinte » |
| PROP-05 | Film déjà proposé | Proposer un film déjà proposé | Erreur idempotente |
| PROP-06 | Clore avec propositions | Admin : clore les propositions | Films copiés → `sp_soiree_films`, phase `film_vote` |
| PROP-07 | Clore sans proposition | Aucune proposition, admin clore | Repli TMDb automatique, phase `film_vote` |
| PROP-08 | Erreur de recherche | Couper le réseau, chercher | « Erreur lors de la recherche » affiché |
| PROP-09 | Terme sans résultat | Chercher "xyzxyzxyz" | « Aucun résultat pour 'xyzxyzxyz' » |

---

### Module 5 — Vote de film

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| VOTE-F01 | Affichage films | Ouvrir la page en `film_vote` | Films affichés avec poster, titre, durée |
| VOTE-F02 | Voter pour un film | Cliquer sur un film | Toast succès, bouton désactivé |
| VOTE-F03 | Double vote film | Re-cliquer | Erreur « Déjà voté » |
| VOTE-F04 | Finaliser le film | Admin : finaliser | Film gagnant affiché, phase `completed` |
| VOTE-F05 | Finaliser à égalité | Votes égaux sur 2 films | Un film désigné au hasard |

---

### Module 6 — Résultats

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| RES-01 | Page résultats | Phase `completed` | Film gagnant, titre, poster affiché |
| RES-02 | Lien bande-annonce | Cliquer sur la bande-annonce | Ouverture YouTube (si disponible) |

---

### Module 7 — Annulation et suppression

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| ANN-01 | Annuler une soirée | Admin : cliquer "Annuler" | Phase `cancelled`, badge rouge sur page publique |
| ANN-02 | Vote sur soirée annulée | Participant tente de voter | Interface en lecture seule |
| SUP-01 | Supprimer | Admin : supprimer la soirée | Soirée disparaît du dashboard |

---

### Module 8 — Configuration TMDb

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| TMDb-01 | Statut sans token | Aucun token configuré | `/api/tmdb/status` → `{ configured: false }` |
| TMDb-02 | Sauvegarder token valide | Saisir un token TMDb valide | Succès, `{ configured: true, source: "database" }` |
| TMDb-03 | Sauvegarder token invalide | Saisir un token invalide | Erreur « Token invalide » |
| TMDb-04 | Priorité env var | `TMDB_API_READ_ACCESS_TOKEN` défini | `source: "env"` retourné |

---

### Module 9 — Pages publiques

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| PUB-01 | Accueil | Ouvrir `/` | Page d'accueil avec champ code salle |
| PUB-02 | Code invalide | Saisir un slug inexistant | Page soirée → message "soirée introuvable" |
| PUB-03 | Roadmap | Ouvrir `/roadmap` | Page chargée, issues GitHub affichées ou état vide |
| PUB-04 | Documentation API | Ouvrir `/docs` | Page Redoc chargée avec l'OpenAPI spec |
| PUB-05 | Footer | Vérifier tous les liens du footer | GitHub, Docs, Roadmap, Contribuer fonctionnels |

---

## Cas limites à tester

- Soirée sans thème → action "Finaliser" doit retourner 400
- Soirée sans film → action "Finaliser film" doit retourner 400
- Finaliser thème sans vote (0 votes sur tous) → comportement cohérent
- Réseau coupé pendant un vote → pas de vote fantôme en DB
- Rechargement page pendant un vote en cours → état cohérent

## Outils de test recommandés

| Outil | Usage |
|---|---|
| Navigateur DevTools → Storage | Vérifier/modifier `sp_voter_id` dans localStorage |
| `curl` / Insomnia / Postman | Tester les routes API directement |
| Supabase SQL Editor | Vérifier l'état des tables directement |
| Network throttle (DevTools) | Tester les états de chargement |
| Incognito mode | Simuler un nouveau participant |

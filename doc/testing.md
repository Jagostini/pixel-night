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
| `__tests__/lib/theme-catalog.test.ts` | 6 | Intégrité du catalogue, genre_ids valides, tri TMDB_GENRE_LIST |
| `__tests__/api/finalize-theme.test.ts` | — | Logique de départage à égalité (tirage au sort) |
| `__tests__/api/finalize-film.test.ts` | 4 | Logique de départage à égalité |
| `__tests__/api/exclusion.test.ts` | 6 | Calcul `excluded_until` pour les 3 modes d'exclusion |
| `__tests__/api/films-curation.test.ts` | 5 | Vote-lock : autoriser la curation si 0 votes, bloquer sinon |

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

### Module 2 — Configuration cinéma et salles

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| CINE-01 | Affichage paramètres | Ouvrir `/admin/parametres` | Nom, slug, URL de partage affichés |
| CINE-02 | Modifier le nom | Changer le nom, enregistrer | Nom mis à jour, toast succès |
| CINE-03 | Ajouter une salle | Cliquer "+ Ajouter une salle", nommer | Salle apparaît dans la liste |
| CINE-04 | Salle avec capacité | Ajouter une salle avec 50 places | Capacité affichée sur la carte |
| CINE-05 | Supprimer une salle | Cliquer supprimer sur une salle | Salle disparaît |
| CINE-06 | Règle exclusion "jours" | Sélectionner "Par jours", valeur 7 | Sauvegardé, thème gagnant exclu 7 jours après finalisation |
| CINE-07 | Règle exclusion "soirées" | Sélectionner "Par soirées", valeur 3 | Thème exclu ~90 jours après finalisation |
| CINE-08 | Règle exclusion "aucune" | Sélectionner "Aucune exclusion" | Thème disponible immédiatement à la prochaine soirée |

---

### Module 3 — Gestion des thèmes

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| THEME-01 | Importer depuis le catalogue | Cliquer "Catalogue", importer "Western" | Thème ajouté avec genres et mots-clés |
| THEME-02 | Catalogue masque les doublons | Ré-ouvrir le catalogue | "Western" ne figure plus dans la liste |
| THEME-03 | Créer thème avec genres | Nouveau thème, cocher "Action" et "Aventure" | Badges genres affichés sur la carte |
| THEME-04 | Créer thème sans genres | Nouveau thème, seulement des mots-clés | Aucun badge genre, mots-clés affichés |
| THEME-05 | Activer / désactiver | Cliquer "Désactiver" sur un thème | Thème exclu des soirées suivantes |

---

### Module 4 — Création de soirée

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| CREA-01 | Cinéma avec une salle | Créer une soirée | Aucun sélecteur de salle affiché |
| CREA-02 | Cinéma avec plusieurs salles | Créer une soirée | Sélecteur de salle affiché, première sélectionnée par défaut |
| CREA-03 | Changer de salle | Sélectionner une autre salle | Salle mise en évidence |
| CREA-04 | Création basique | Remplir le formulaire, sans propositions | Soirée créée en phase `theme_vote` |
| CREA-05 | Avec propositions | Activer "propositions", saisir "2 jours" | Soirée créée, durée correctement parsée |
| CREA-06 | Durée invalide | Saisir "abc" dans le champ durée | Bouton "Créer" désactivé, « Format non reconnu » |

---

### Module 5 — Vote de thème

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| VOTE-T01 | Accès page publique | Ouvrir `/s/{slug}` | Affiche les soirées du cinéma |
| VOTE-T02 | Badge salle | Cinéma avec plusieurs salles | Badge salle visible sur chaque soirée |
| VOTE-T03 | Premier vote | Cliquer sur un thème | Toast succès, bouton désactivé |
| VOTE-T04 | Double vote (même session) | Re-cliquer un thème | Toast erreur « Déjà voté » |
| VOTE-T05 | Finaliser (sans égalité) | Admin : cliquer "Finaliser le thème" | Thème gagnant affiché, phase change |
| VOTE-T06 | Finaliser (avec égalité) | Votes égaux sur 2 thèmes | Un thème désigné au hasard |

---

### Module 6 — Récupération et curation des films

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| FILMS-01 | Récupérer (Découverte) | Thème avec genres, cliquer "Découverte" | Films récupérés, `used_discover: true` dans la réponse |
| FILMS-02 | Récupérer (Mots-clés) | Cliquer "Mots-clés" | Films récupérés depuis `/search/movie` |
| FILMS-03 | Thème sans genres → Découverte | Thème sans genre_ids, cliquer "Découverte" | Repli sur mots-clés automatique |
| FILMS-04 | Supprimer un film (avant vote) | Cliquer × sur un film | Film retiré de la liste |
| FILMS-05 | Ajouter un film (avant vote) | Cliquer "Ajouter", chercher, ajouter | Film ajouté à la liste |
| FILMS-06 | Curation après vote | Un participant vote, admin tente de supprimer | Erreur 409, modification impossible |
| FILMS-07 | Bandeau thème gagnant | Participant en phase film_vote | Bandeau "Thème de la soirée : …" affiché |

---

### Module 7 — Phase propositions

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| PROP-01 | Lancer les propositions | Admin : cliquer "Lancer les propositions" | Phase `film_proposal`, minuterie affichée |
| PROP-02 | Rechercher un film | Participant : saisir un terme, chercher | Résultats TMDb affichés |
| PROP-03 | Proposer un film | Cliquer "Proposer" sur un film | Film ajouté à la liste des propositions |
| PROP-04 | 3 propositions max | Proposer un 4ème film | Erreur « Limite atteinte » |
| PROP-05 | Film déjà proposé | Proposer un film déjà proposé | Erreur idempotente |
| PROP-06 | Clore avec propositions | Admin : clore les propositions | Films copiés → `sp_soiree_films`, phase `film_vote` |
| PROP-07 | Clore sans proposition | Aucune proposition, admin clore | Repli TMDb automatique, phase `film_vote` |

---

### Module 8 — Vote de film

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| VOTE-F01 | Affichage films | Ouvrir la page en `film_vote` | Films affichés avec poster, titre, durée |
| VOTE-F02 | Voter pour un film | Cliquer sur un film | Toast succès, bouton désactivé |
| VOTE-F03 | Double vote film | Re-cliquer | Erreur « Déjà voté » |
| VOTE-F04 | Finaliser le film | Admin : finaliser | Film gagnant affiché, phase `completed` |
| VOTE-F05 | Finaliser à égalité | Votes égaux sur 2 films | Un film désigné au hasard |
| VOTE-F06 | Exclusion après finalisation | Thème gagnant, règle "5 soirées" | `excluded_until` mis à jour sur le thème |

---

### Module 9 — Résultats

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| RES-01 | Page résultats | Phase `completed` | Film gagnant, titre, poster affiché |
| RES-02 | Lien bande-annonce | Cliquer sur la bande-annonce | Ouverture YouTube (si disponible) |
| RES-03 | Soirée passée sur page cinéma | Ouvrir `/s/{slug}` | Soirée dans "Soirées passées" avec film gagnant |

---

### Module 10 — Annulation et suppression

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| ANN-01 | Annuler une soirée | Admin : cliquer "Annuler" | Phase `cancelled`, badge rouge sur page publique |
| ANN-02 | Vote sur soirée annulée | Participant tente de voter | Interface en lecture seule |
| SUP-01 | Supprimer | Admin : supprimer la soirée | Soirée disparaît du dashboard |

---

### Module 11 — Configuration TMDb

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| TMDb-01 | Statut sans token | `TMDB_API_READ_ACCESS_TOKEN` absent | `/api/tmdb/status` → `{ configured: false }` |
| TMDb-02 | Statut avec token | `TMDB_API_READ_ACCESS_TOKEN` défini | `/api/tmdb/status` → `{ configured: true }` |

---

### Module 12 — Pages publiques

| ID | Scénario | Action | Résultat attendu |
|---|---|---|---|
| PUB-01 | Accueil | Ouvrir `/` | Page d'accueil avec champ code cinéma |
| PUB-02 | Code invalide | Saisir un slug inexistant | Page → 404 |
| PUB-03 | Roadmap | Ouvrir `/roadmap` | Page chargée, issues GitHub affichées ou état vide |
| PUB-04 | Documentation API | Ouvrir `/docs` | Page Redoc chargée avec l'OpenAPI spec |
| PUB-05 | Footer | Vérifier tous les liens du footer | GitHub, Docs, Roadmap, Contribuer, Crédits, Mentions légales, Confidentialité fonctionnels |
| PUB-06 | Crédits | Ouvrir `/credits` | Logo TMDb affiché, mention légale TMDb présente |
| PUB-07 | Mentions légales | Ouvrir `/legal` | Page chargée, éditeur Helixir affiché |
| PUB-08 | Confidentialité | Ouvrir `/privacy` | Page chargée, droits RGPD et lien CNIL présents |

---

## Cas limites à tester

- Soirée sans thème → action "Finaliser" doit retourner 400
- Soirée sans film → action "Finaliser film" doit retourner 400
- Finaliser thème sans vote (0 votes sur tous) → comportement cohérent
- Réseau coupé pendant un vote → pas de vote fantôme en DB
- Rechargement page pendant un vote en cours → état cohérent
- Curation : supprimer tous les films → re-récupérer fonctionne
- Thème exclu → absent de la liste des éligibles à la création de soirée suivante

## Outils de test recommandés

| Outil | Usage |
|---|---|
| Navigateur DevTools → Storage | Vérifier/modifier `sp_voter_id` dans localStorage |
| `curl` / Insomnia / Postman | Tester les routes API directement |
| Supabase SQL Editor | Vérifier l'état des tables directement |
| Network throttle (DevTools) | Tester les états de chargement |
| Incognito mode | Simuler un nouveau participant |

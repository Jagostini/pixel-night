# Référence API — Pixel Night

La documentation interactive complète est disponible sur **[/docs](/docs)** — rendue par
[Redoc](https://redocly.com/redoc/) à partir du fichier `public/openapi.yaml`.

## Accès rapide

| Méthode | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/api/soirees/{id}/vote-theme` | Non | Voter pour un thème |
| `POST` | `/api/soirees/{id}/vote-film` | Non | Voter pour un film |
| `POST` | `/api/soirees/{id}/propose-film` | Non | Proposer un film |
| `GET` | `/api/soirees/{id}/proposals` | Non | Lister les propositions |
| `POST` | `/api/soirees/{id}/finalize-theme` | ✅ | Désigner le thème gagnant |
| `POST` | `/api/soirees/{id}/finalize-film` | ✅ | Désigner le film gagnant + appliquer l'exclusion |
| `POST` | `/api/soirees/{id}/fetch-films` | ✅ | Récupérer les films (mots-clés TMDb) |
| `POST` | `/api/soirees/{id}/fetch-films-discover` | ✅ | Récupérer les films (genres TMDb Discover) |
| `GET` | `/api/soirees/{id}/films` | ✅ | Lister les films de la soirée |
| `POST` | `/api/soirees/{id}/films` | ✅ | Ajouter un film manuellement (curation) |
| `DELETE` | `/api/soirees/{id}/films` | ✅ | Supprimer un film (curation) |
| `POST` | `/api/soirees/{id}/start-proposals` | ✅ | Ouvrir la phase propositions |
| `POST` | `/api/soirees/{id}/close-proposals` | ✅ | Clore les propositions |
| `POST` | `/api/soirees/{id}/cancel` | ✅ | Annuler la soirée |
| `DELETE` | `/api/soirees/{id}/delete` | ✅ | Supprimer la soirée |
| `GET` | `/api/tmdb/search?query=` | Non | Rechercher des films |
| `GET` | `/api/tmdb/movie/{tmdbId}` | Non | Détails d'un film |
| `GET` | `/api/tmdb/status` | Non | Statut config TMDb |
| `PATCH` | `/api/soirees/{id}/update-settings` | ✅ | Mettre à jour le nombre de films avant le vote |

## Authentification

Les routes marquées ✅ requièrent une session organisateur (cookie Supabase `sb-access-token`
posé automatiquement après connexion sur `/auth/login`).

Réponse en cas d'accès non authentifié :
```json
HTTP 401
{ "error": "Non autorise" }
```

## Détail des routes de curation films

### `POST /api/soirees/{id}/fetch-films-discover`

Récupère des films depuis TMDb Discover en utilisant les `genre_ids` du thème gagnant.

- Interroge `/discover/movie` avec les genres + `vote_count.gte=100` + `vote_average.gte=6`
- Récupère 5 pages aléatoires parmi les 10 premières pour de la variété
- Repli automatique sur la recherche par mots-clés si aucun genre n'est configuré
- Enrichit chaque film (réalisateur, durée, bande-annonce YouTube)

**Réponse** :
```json
{ "success": true, "count": 18, "used_discover": true }
```

### `POST /api/soirees/{id}/films`

Ajoute un film manuellement à la liste. Bloqué si des votes existent déjà.

**Corps** :
```json
{ "tmdb_id": 550 }
```

**Codes** : `200` succès · `409` votes déjà enregistrés · `404` film introuvable sur TMDb

### `DELETE /api/soirees/{id}/films`

Supprime un film de la liste. Bloqué si des votes existent déjà.

**Corps** :
```json
{ "film_id": "uuid-de-sp_soiree_films" }
```

**Codes** : `200` succès · `409` votes déjà enregistrés

## Format des erreurs

Toutes les erreurs suivent le format :
```json
{ "error": "Description de l'erreur" }
```

## Codes de statut utilisés

| Code | Signification |
|---|---|
| `200` | Succès |
| `400` | Paramètres invalides ou phase incorrecte |
| `401` | Non authentifié |
| `404` | Ressource introuvable |
| `409` | Conflit (doublon de vote, limite atteinte, votes déjà présents) |
| `500` | Erreur serveur interne |
| `502` | Erreur lors de l'appel TMDb |

## Voir la documentation complète

→ **[Ouvrir la documentation interactive Redoc](/docs)**

Le fichier source OpenAPI est disponible dans `public/openapi.yaml`.

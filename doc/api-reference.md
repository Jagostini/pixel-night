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
| `POST` | `/api/soirees/{id}/finalize-film` | ✅ | Désigner le film gagnant |
| `POST` | `/api/soirees/{id}/fetch-films` | ✅ | Récupérer les films depuis TMDb |
| `POST` | `/api/soirees/{id}/start-proposals` | ✅ | Ouvrir la phase propositions |
| `POST` | `/api/soirees/{id}/close-proposals` | ✅ | Clore les propositions |
| `POST` | `/api/soirees/{id}/cancel` | ✅ | Annuler la soirée |
| `DELETE` | `/api/soirees/{id}/delete` | ✅ | Supprimer la soirée |
| `GET` | `/api/tmdb/search?query=` | Non | Rechercher des films |
| `GET` | `/api/tmdb/movie/{tmdbId}` | Non | Détails d'un film |
| `GET` | `/api/tmdb/status` | Non | Statut config TMDb |
| `POST` | `/api/tmdb/save-token` | ✅ | Sauvegarder le token TMDb |

## Authentification

Les routes marquées ✅ requièrent une session organisateur (cookie Supabase `sb-access-token`
posé automatiquement après connexion sur `/auth/login`).

Réponse en cas d'accès non authentifié :
```json
HTTP 401
{ "error": "Non autorise" }
```

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
| `409` | Conflit (doublon de vote, limite atteinte) |
| `500` | Erreur serveur interne |
| `502` | Erreur lors de l'appel TMDb |

## Voir la documentation complète

→ **[Ouvrir la documentation interactive Redoc](/docs)**

Le fichier source OpenAPI est disponible dans `public/openapi.yaml`.

# Guide Administrateur Système — Pixel Night

## Variables d'environnement

### Fichier `.env.local` (développement)

```bash
# ── Supabase ──────────────────────────────────────────────────────
# Dashboard Supabase → Settings → API

NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...    # ⚠ Ne jamais exposer côté client

# ── TMDb ──────────────────────────────────────────────────────────
# themoviedb.org → Paramètres → API → API Read Access Token
TMDB_API_READ_ACCESS_TOKEN=eyJ...
```

> **Important** : `TMDB_API_READ_ACCESS_TOKEN` est la seule source pour le token TMDb.
> Il est résolu exclusivement depuis l'environnement serveur — il n'est jamais stocké en base de données.

### Variables requises / optionnelles

| Variable | Type | Requis | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✅ | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✅ | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | ✅ | Clé service role (jamais client) |
| `TMDB_API_READ_ACCESS_TOKEN` | Secret | ✅ | Token TMDb (API Read Access Token) |

## Configuration Supabase

### 1. Créer le projet

1. Aller sur [supabase.com](https://supabase.com) → New project
2. Choisir une région proche (ex: `eu-west-2` pour la France)
3. Récupérer les clés dans **Settings → API**

### 2. Configurer l'authentification

Dans **Authentication → Providers** :
- Activer **Email** (Email + Password)
- Désactiver "Confirm email" si vous souhaitez une inscription immédiate (développement)
- En production : activer la confirmation par email, configurer SMTP dans **Auth → SMTP Settings**

### 3. Exécuter les migrations SQL

Dans le **SQL Editor** de Supabase, exécuter dans l'ordre :

```sql
-- 1. Tables de base
-- → scripts/001_sp_create_tables.sql

-- 2. Politiques RLS
-- → scripts/002_sp_rls_policies.sql

-- 3. Trigger profil auto
-- → scripts/003_sp_profile_trigger.sql

-- 4. Phase film_proposal + durée
-- → scripts/004_sp_add_projection_proposals.sql

-- 5. Suppression de la colonne tmdb_token_encrypted
-- → scripts/005_sp_remove_tmdb_token.sql

-- 6. Table sp_salles
-- → scripts/006_sp_add_salles.sql

-- 7. Grants salles
-- → scripts/007_sp_grants_salles.sql
```

### 4. Créer le premier compte organisateur

1. Déployer l'application
2. Aller sur `/auth/sign-up`
3. Créer un compte — un enregistrement est automatiquement créé dans `sp_profiles` via le trigger

### 5. Politiques RLS importantes

Les politiques définies dans `002_sp_rls_policies.sql` :
- `sp_soirees` : lecture publique, écriture restreinte à `auth.uid() = created_by`
- `sp_theme_votes` / `sp_film_votes` : insertion via service role uniquement
- `sp_salles` : lecture/écriture restreinte au propriétaire

## Gestion du token TMDb

### Configuration

1. Obtenir un token sur [themoviedb.org](https://www.themoviedb.org/settings/api) → **API Read Access Token** (le long token Bearer)
2. Ajouter `TMDB_API_READ_ACCESS_TOKEN` dans les variables d'environnement Vercel (secret, tous environnements)

### Vérifier la configuration

`GET /api/tmdb/status` retourne :
```json
{ "configured": true }
// ou
{ "configured": false }
```

### Rotation du token TMDb

1. Générer un nouveau token sur themoviedb.org
2. Mettre à jour `TMDB_API_READ_ACCESS_TOKEN` dans les variables d'environnement Vercel
3. Redéployer

## Sauvegardes

Supabase effectue des sauvegardes automatiques quotidiennes (plan Pro) ou hebdomadaires (plan Free).

Tables critiques à sauvegarder :
- `sp_soirees` — historique des soirées
- `sp_salles` — configuration des cinémas
- `sp_themes` — catalogue de thèmes personnalisés
- `sp_profiles` — comptes organisateurs

Exporter manuellement via **Database → Backups** ou `pg_dump` via la connection string Supabase.

## Monitoring

- **Vercel** : logs de build et runtime dans le dashboard Vercel → Functions
- **Supabase** : logs des requêtes dans **Logs → API** et **Logs → Auth**
- **Vercel Analytics** : intégré via `@vercel/analytics/next` dans `app/layout.tsx`

## Limites de taux (rate limits)

| Service | Limite | Mitigation |
|---|---|---|
| TMDb API | ~40 req/s | `lib/tmdb-client.ts` : max 8 requêtes parallèles (p-limit) + retry automatique sur 429 |
| GitHub API (roadmap) | 60 req/h (sans auth) | ISR cache 5 min — 12 appels/h max |
| Supabase Free | 500 MB DB, 2 GB transfert/mois | Surveiller dans le dashboard Supabase |

## Liste de contrôle post-déploiement

```
□ NEXT_PUBLIC_SUPABASE_URL configurée
□ NEXT_PUBLIC_SUPABASE_ANON_KEY configurée
□ SUPABASE_SERVICE_ROLE_KEY configurée (secret Vercel)
□ TMDB_API_READ_ACCESS_TOKEN configurée (secret Vercel)
□ Toutes les migrations SQL exécutées (001 → 007)
□ Compte organisateur créé
□ GET /api/tmdb/status → { configured: true }
□ Soirée de test créée et complétée
```

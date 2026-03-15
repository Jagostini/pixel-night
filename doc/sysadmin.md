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
# Option A : token en clair (développement ou déploiement sans DB)
# themoviedb.org → Paramètres → API → API Read Access Token
TMDB_API_READ_ACCESS_TOKEN=eyJ...

# Option B : token chiffré en base (production recommandée)
# Générer : openssl rand -hex 32
ENCRYPTION_KEY=<64-chars-hex>
```

> **Priorité** : si `TMDB_API_READ_ACCESS_TOKEN` est défini ET non vide, il est utilisé en priorité.
> Sinon, le système cherche un token chiffré dans `sp_salles.tmdb_token_encrypted` et le déchiffre avec `ENCRYPTION_KEY`.

### Variables requises / optionnelles

| Variable | Type | Requis | Description |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Public | ✅ | URL projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public | ✅ | Clé publique Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret | ✅ | Clé service role (jamais client) |
| `TMDB_API_READ_ACCESS_TOKEN` | Secret | ⚡ | Token TMDb en clair |
| `ENCRYPTION_KEY` | Secret | ⚡ | Clé AES-256 hex 64 chars |

⚡ = au moins une des deux doit être présente pour que les fonctionnalités TMDb fonctionnent.

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

-- 5a. Phase cancelled
-- → scripts/005_sp_add_cancelled_phase.sql

-- 5b. Token TMDb chiffré
-- → scripts/005_sp_add_tmdb_token.sql

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

### Approche recommandée en production

1. Générer `ENCRYPTION_KEY` : `openssl rand -hex 32`
2. Ajouter `ENCRYPTION_KEY` dans les variables d'env Vercel (secret)
3. Ne **pas** définir `TMDB_API_READ_ACCESS_TOKEN` en production
4. L'organisateur saisit son token TMDb dans **Admin → Paramètres** → stocké chiffré en DB

### Vérifier la configuration

`GET /api/tmdb/status` retourne :
```json
{ "configured": true, "source": "database" }
// ou
{ "configured": true, "source": "env" }
// ou
{ "configured": false, "source": "none" }
```

### Rotation du token TMDb

1. Générer un nouveau token sur themoviedb.org
2. Le saisir dans **Admin → Paramètres**
3. L'ancien token est remplacé (UPDATE sur `sp_salles.tmdb_token_encrypted`)

### Rotation de la clé de chiffrement

⚠ Si `ENCRYPTION_KEY` change, le token chiffré en DB devient illisible.

Procédure de rotation :
1. Récupérer le token TMDb actuel (le noter avant rotation)
2. Changer `ENCRYPTION_KEY` dans Vercel
3. Redéployer
4. Re-saisir le token dans **Admin → Paramètres**

## Sauvegardes

Supabase effectue des sauvegardes automatiques quotidiennes (plan Pro) ou hebdomadaires (plan Free).

Tables critiques à sauvegarder :
- `sp_soirees` — historique des soirées
- `sp_salles` — contient le token TMDb chiffré
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
| TMDb API | ~40 req/10s | Algorithme batch : toutes les requêtes fetch-films sont séquentielles par query |
| GitHub API (roadmap) | 60 req/h (sans auth) | ISR cache 5 min — 12 appels/h max |
| Supabase Free | 500 MB DB, 2 GB transfert/mois | Surveiller dans le dashboard Supabase |

## Liste de contrôle post-déploiement

```
□ NEXT_PUBLIC_SUPABASE_URL configurée
□ NEXT_PUBLIC_SUPABASE_ANON_KEY configurée
□ SUPABASE_SERVICE_ROLE_KEY configurée (secret Vercel)
□ ENCRYPTION_KEY configurée (secret Vercel, 64 chars hex)
□ Toutes les migrations SQL exécutées (001 → 007)
□ Compte organisateur créé
□ Token TMDb saisi dans Admin → Paramètres
□ GET /api/tmdb/status → { configured: true }
□ Soirée de test créée et complétée
```

# Guide Sécurité — Pixel Night

## Modèle de menaces

### Acteurs et niveaux de confiance

| Acteur | Niveau de confiance | Accès |
|---|---|---|
| Organisateur authentifié | Élevé | Admin panel, toutes les actions de gestion |
| Participant anonyme | Faible | Vote et propositions uniquement |
| Visiteur non authentifié | Nul | Pages publiques en lecture |
| Attaquant externe | Hostile | Aucun accès prévu |

### Scénarios de menace

| Scénario | Probabilité | Mitigation en place |
|---|---|---|
| Double vote | Moyenne | `voter_id` unique par soiree en DB + contrainte `UNIQUE` |
| Prise de contrôle admin | Faible | Auth Supabase + RLS, session cookie httpOnly |
| Exfiltration token TMDb | Faible | AES-256-GCM en DB, clé hors DB |
| Injection SQL | Faible | ORM Supabase (requêtes paramétrées) |
| XSS | Faible | React escape natif, CSP headers Vercel |
| CSRF | Faible | Tokens Supabase + SameSite cookies |
| Scraping votes concurrents | Possible | Contrainte UNIQUE DB (idempotent) |

## Authentification

### Supabase Auth

- **Mécanisme** : Email + Password, sessions JWT
- **Stockage** : cookies `httpOnly`, `SameSite=Lax`, `Secure` (HTTPS)
- **Rafraîchissement** : `proxy.ts` gère le refresh automatique des tokens via `@supabase/ssr`
- **Logout** : invalide la session côté Supabase + supprime les cookies

### Vérification côté serveur

Chaque route admin effectue :

```typescript
const { data: { user } } = await authSupabase.auth.getUser()
if (!user) return NextResponse.json({ error: "Non autorise" }, { status: 401 })
```

`getUser()` valide le JWT auprès de Supabase (appel réseau) — pas de décodage local non sécurisé.

## Autorisation — Row Level Security (RLS)

Les tables Supabase utilisent des politiques RLS pour restreindre les accès.

### Pourquoi le service role est utilisé pour les votes

Les participants sont **anonymes** — ils n'ont pas de compte Supabase. RLS ne peut pas les
authentifier via `auth.uid()`. Les route handlers de vote utilisent donc le **service role**
(clé `SUPABASE_SERVICE_ROLE_KEY`) qui bypass RLS.

La logique de sécurité est alors implémentée dans le code du route handler :
1. Vérifier que `voter_id` n'a pas déjà voté (`SELECT ... WHERE voter_id = ?`)
2. Insérer le vote
3. La contrainte `UNIQUE(soiree_id, voter_id)` en DB est le dernier filet de sécurité

### Politiques RLS par table

| Table | Lecture | Écriture | Notes |
|---|---|---|---|
| `sp_soirees` | Publique | `auth.uid() = created_by` | |
| `sp_themes` | Publique | `auth.uid() = created_by` | |
| `sp_soiree_films` | Publique | Service role | |
| `sp_soiree_film_proposals` | Publique | Service role | |
| `sp_theme_votes` | Service role | Service role | Pas de lecture directe |
| `sp_film_votes` | Service role | Service role | |
| `sp_salles` | `auth.uid() = created_by` | `auth.uid() = created_by` | |
| `sp_profiles` | `auth.uid() = id` | `auth.uid() = id` | |

## Chiffrement du token TMDb

### Algorithme

**AES-256-GCM** via Web Crypto API (`crypto.subtle`) — standard industrie, authentifié.

```
ENCRYPTION_KEY (32 octets hex) → CryptoKey AES-GCM
IV aléatoire (12 octets) généré à chaque chiffrement
Ciphertext = AES-GCM-Encrypt(plaintext, key, iv)
Stocké = JSON.stringify({ iv: base64(iv), ct: base64(ciphertext) })
```

### Propriétés de sécurité

- **IV unique** par chiffrement → deux chiffrements du même token produisent des valeurs différentes
- **Authentification** : AES-GCM détecte toute modification du ciphertext (tamper detection)
- **Clé hors DB** : `ENCRYPTION_KEY` n'est jamais stockée en base — une compromission DB seule ne suffit pas
- **Pas de dérivation de clé** : la clé est directement utilisée — choisir une clé suffisamment forte (256 bits = `openssl rand -hex 32`)

### Ce que AES-GCM ne protège pas

- Si l'attaquant accède à la fois à la DB **et** à `ENCRYPTION_KEY`, le token est déchiffrable
- Protection contre : compromission DB seule, accès lecture non autorisé aux logs

### Génération de la clé

```bash
openssl rand -hex 32
# Exemple : a3f8c2d1e4b7a9f0c3d2e1f4b8a7c9d0e2f1c3d4e5f6a7b8c9d0e1f2a3b4c5d6
```

## Anonymat des votants

- Identifiant `voter_id` : UUID v4 généré côté client, stocké dans `localStorage`
- Aucune donnée personnelle associée : pas d'IP, pas de fingerprint, pas de cookie traceur
- Lier un vote à une personne réelle est **impossible** sans accès physique au navigateur
- Limitation : vider le localStorage ou naviguer en privé permet techniquement de voter deux fois

## Sécurité des variables d'environnement

| Variable | Exposition | Risque si compromise |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Publique (bundle client) | Faible — URL publique |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Publique (bundle client) | Faible — limitée par RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Serveur uniquement | **Critique** — bypass RLS complet |
| `ENCRYPTION_KEY` | Serveur uniquement | **Élevé** — déchiffrement token TMDb |
| `TMDB_API_READ_ACCESS_TOKEN` | Serveur uniquement | Moyen — utilisation TMDb abusive |

### Bonnes pratiques

- Ne jamais commiter `.env.local` (vérifier `.gitignore`)
- Utiliser les secrets Vercel pour les variables sensibles
- Rotation périodique de `SUPABASE_SERVICE_ROLE_KEY` si compromission suspectée
- Rotation de `ENCRYPTION_KEY` avec re-chiffrement du token (voir doc/sysadmin.md)

## Protection contre les abus

### Double vote

Deux mécanismes en cascade :
1. `SELECT` avant insert dans le route handler → réponse `409` immédiate
2. Contrainte `UNIQUE(soiree_id, voter_id)` en DB → `error.code === "23505"` → `409`

### Propositions de films

- Max 3 propositions par `voter_id` par soirée — vérifiée côté serveur
- Validation TMDb optionnelle : le détail du film est récupéré depuis TMDb avant insertion

### Rate limiting

Pas de rate limiting applicatif actuellement. En production, Vercel Pro inclut un WAF basique.
Pour un rate limiting applicatif, envisager `@upstash/ratelimit` avec Redis Upstash.

## Headers de sécurité

Vercel applique automatiquement :
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

Pour ajouter des headers custom (`Content-Security-Policy`), modifier `next.config.mjs` :

```javascript
const nextConfig = {
  async headers() {
    return [{
      source: "/(.*)",
      headers: [{
        key: "Content-Security-Policy",
        value: "default-src 'self'; img-src 'self' image.tmdb.org data:; script-src 'self' 'unsafe-inline' cdn.jsdelivr.net cdnjs.buymeacoffee.com"
      }]
    }]
  }
}
```

## Audit de sécurité rapide

```bash
# Dépendances vulnérables
pnpm audit

# Variables d'env non commités
git log --all --full-history -- .env*

# Vérifier l'absence de secrets dans le code
grep -r "eyJ" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules
```

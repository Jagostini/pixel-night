# Guide DevOps — Pixel Night

## Hébergement

Pixel Night est déployé sur **Vercel** avec une intégration Git directe.

## Déploiement Vercel

### Configuration initiale

1. Importer le dépôt GitHub dans Vercel
2. Framework : **Next.js** (détection automatique)
3. Build command : `pnpm build` (ou `next build`)
4. Output directory : `.next`
5. Node.js version : **20.x**

### Variables d'environnement Vercel

Dans **Project Settings → Environment Variables** :

| Variable | Environnement | Type |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Production, Preview, Development | Plain text |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production, Preview, Development | Plain text |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | **Secret** |
| `ENCRYPTION_KEY` | Production | **Secret** |
| `TMDB_API_READ_ACCESS_TOKEN` | Development uniquement | **Secret** |

> Les variables `NEXT_PUBLIC_*` sont exposées au bundle client — ne jamais y mettre de secrets.

### Branches et environnements

| Branche Git | Environnement Vercel | URL |
|---|---|---|
| `main` | Production | `pixel-night.vercel.app` (ou domaine custom) |
| `feat/*`, `fix/*` | Preview | `pixel-night-<hash>.vercel.app` |
| Local | Development | `localhost:3000` |

> **Attention** : les PR preview partagent les variables d'env de Preview. Utiliser un projet Supabase de staging si vous voulez isoler complètement les données.

## CI/CD

### Pipeline actuel (Vercel natif)

```
Push Git → Vercel déclenche le build automatiquement
    │
    ├── pnpm install
    ├── pnpm build (next build)
    ├── Lint check (eslint)
    └── Deploy (si build OK)
```

### Ajouter les tests en CI (GitHub Actions)

Créer `.github/workflows/ci.yml` :

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm test --run
```

### Protection de la branche `main`

Dans **GitHub → Settings → Branches → Branch protection rules** :
- ✅ Require a pull request before merging
- ✅ Require status checks to pass (ajouter le job `test` une fois CI configuré)
- ✅ Require linear history

## Build et performances

### Analyse du bundle

```bash
ANALYZE=true pnpm build
```

Installez d'abord `@next/bundle-analyzer` si nécessaire.

### Métriques de build

Surveiller dans les logs Vercel :
- Taille du bundle First Load JS (cible < 100 kB pour les pages publiques)
- Temps de build (cible < 60s)
- Routes statiques vs dynamiques

### ISR (Incremental Static Regeneration)

La page `/roadmap` utilise ISR avec `revalidate = 300` (5 min) :
- Première visite → rendu serveur, mis en cache
- Visites suivantes → sert le cache
- Toutes les 5 min → revalidation en arrière-plan

La page `/docs` (Redoc) est `force-static` — générée une seule fois au build.

## proxy.ts (anciennement middleware.ts)

```typescript
// proxy.ts — à la racine du projet
export async function proxy(request: NextRequest) { ... }
export const config = { matcher: [...] }
```

Ce fichier gère le rafraîchissement des cookies de session Supabase SSR à chaque requête.
Il remplace `middleware.ts` (déprécié dans Next.js 16) — ne pas renommer.

## Domaine custom

1. Dans Vercel → Project → Settings → Domains → Add
2. Ajouter les entrées DNS chez votre registrar :
   - `A` ou `CNAME` vers les IPs Vercel
3. HTTPS automatique via Let's Encrypt (Vercel gère)

## Monitoring et alertes

### Vercel Analytics

Intégré nativement via `@vercel/analytics/next` dans `app/layout.tsx`.
Accessible dans le dashboard Vercel → Analytics.

### Logs en production

```bash
# Via Vercel CLI
npx vercel logs --follow

# Ou dans le dashboard : Project → Functions → View logs
```

### Alertes Supabase

Dans le dashboard Supabase → **Advisors → Performance** pour détecter les requêtes lentes.

## Rollback

```bash
# Via Vercel CLI
npx vercel rollback [deployment-url]

# Ou dans le dashboard : Project → Deployments → Promote précédent déploiement
```

## Checklist déploiement initial

```
□ Repo GitHub connecté à Vercel
□ Toutes les variables d'env configurées (voir doc/sysadmin.md)
□ Node.js 20.x configuré dans Vercel
□ Build réussi localement (pnpm build)
□ Domaine custom configuré (si applicable)
□ Migrations SQL exécutées sur Supabase production
□ Test de smoke : créer une soirée, voter, finaliser
□ GET /api/tmdb/status → { configured: true }
```

## Mise à jour des dépendances

```bash
pnpm update --interactive --latest
pnpm audit
```

Vérifier en priorité : `next`, `@supabase/ssr`, `@supabase/supabase-js`.

> **ESLint** : rester sur la version **9** — ESLint 10 est incompatible avec `eslint-plugin-react` 7.x.

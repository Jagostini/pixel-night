# Pixel Night

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-FF813F?style=flat&logo=buy-me-a-coffee&logoColor=white)](https://www.buymeacoffee.com/agostinij86)
[![License: MIT + Commons Clause](https://img.shields.io/badge/License-MIT%20%2B%20Commons%20Clause-blue.svg)](./LICENSE)
[![Open Source](https://img.shields.io/badge/open--source-contributions%20welcome-brightgreen)](https://github.com/Jagostini/pixel-night/issues)

Application web de soirées cinéma collaboratives. Les participants votent ensemble pour choisir un thème puis un film — sans compte, sans friction.

## Fonctionnement

Une soirée se déroule en plusieurs phases :

1. **Vote thème** — chaque participant vote pour son thème préféré parmi une sélection aléatoire
2. **Propositions de films** *(optionnel)* — si activé, les participants peuvent proposer jusqu'à 3 films sur le thème gagnant pendant une durée définie par l'organisateur (ex : « 2 jours », « 1h30 »)
3. **Vote film** — les films proposés (ou récupérés automatiquement depuis TMDb) sont soumis au vote
4. **Terminée** — le film gagnant est annoncé

Les participants n'ont pas besoin de compte. Un identifiant anonyme est stocké dans leur navigateur pour garantir l'unicité du vote.

L'organisateur peut également **annuler** une soirée à tout moment.

## Documentation

| Audience | Document |
|---|---|
| 🏛 Architecte | [doc/architecture.md](./doc/architecture.md) |
| 💻 Développeur | [doc/developer.md](./doc/developer.md) |
| 🎨 UX Designer | [doc/ux-design.md](./doc/ux-design.md) |
| ⚙️ Administrateur système | [doc/sysadmin.md](./doc/sysadmin.md) |
| 🚀 DevOps | [doc/devops.md](./doc/devops.md) |
| 🔒 Sécurité | [doc/security.md](./doc/security.md) |
| 🧪 Testeur / QA | [doc/testing.md](./doc/testing.md) |
| 📡 Référence API | [doc/api-reference.md](./doc/api-reference.md) — [/docs](/docs) (Redoc interactif) |
| 🎬 Organisateur | [doc/guide-organisateur.md](./doc/guide-organisateur.md) |
| 🍿 Participant | [doc/guide-participant.md](./doc/guide-participant.md) |
| 🗺 Feuille de route | [doc/roadmap.md](./doc/roadmap.md) — [/roadmap](/roadmap) (live) |

→ **[Sommaire complet de la documentation](./doc/index.md)**

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS 4 + Shadcn UI (Radix UI) |
| Base de données | Supabase (PostgreSQL + Auth + RLS) |
| Films | TMDb API |
| Tests | Vitest |
| Hébergement | Vercel |

## Démarrage rapide

```bash
# 1. Cloner et installer
git clone https://github.com/Jagostini/pixel-night.git
cd pixel-night
pnpm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir .env.local avec vos clés Supabase et TMDb (voir doc/sysadmin.md)

# 3. Initialiser la base de données
# Exécuter dans l'ordre dans le SQL Editor de Supabase :
# scripts/001_sp_create_tables.sql
# scripts/002_sp_rls_policies.sql
# scripts/003_sp_profile_trigger.sql
# scripts/004_sp_add_projection_proposals.sql
# scripts/005_sp_add_cancelled_phase.sql
# scripts/005_sp_add_tmdb_token.sql
# scripts/006_sp_add_salles.sql
# scripts/007_sp_grants_salles.sql

# 4. Lancer
pnpm dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

```bash
# Supabase (obligatoires)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# TMDb — au moins une des deux options :
# Option A : token en clair dans l'env (développement / déploiement simple)
TMDB_API_READ_ACCESS_TOKEN=

# Option B : token chiffré en base (recommandé en production)
# Générer avec : openssl rand -hex 32
ENCRYPTION_KEY=
```

Si `TMDB_API_READ_ACCESS_TOKEN` est défini, il est utilisé en priorité.
Sinon, le token est lu depuis `sp_salles.tmdb_token_encrypted` et déchiffré avec `ENCRYPTION_KEY`.

## Tests

```bash
pnpm test
```

Les tests couvrent : utilitaires TMDb, parseur de durée, chiffrement AES-256-GCM, résolution du token, logique de départage des votes.

## Structure du projet

```
app/
├── admin/          # Tableau de bord organisateur (auth requise)
│   ├── soirees/    # Créer et gérer les soirées
│   ├── salles/     # Gérer les salles de cinéma
│   ├── themes/     # Gérer le catalogue de thèmes
│   └── parametres/ # Configuration TMDb (token chiffré)
├── api/            # Routes API (votes, finalisation, TMDb, propositions)
├── auth/           # Connexion / inscription
├── docs/           # Documentation API interactive (Redoc)
├── roadmap/        # Feuille de route (GitHub Issues, ISR)
└── s/[slug]/       # Pages publiques de vote et résultats

components/         # Composants React
lib/
├── supabase/       # Clients Supabase (server, client, admin)
├── types.ts        # Types TypeScript partagés (SoireePhase, etc.)
├── tmdb.ts         # Utilitaires TMDb (URLs, headers)
├── tmdb-token.ts   # Résolution du token TMDb (env var ou DB chiffré)
├── encryption.ts   # Chiffrement AES-256-GCM (Web Crypto API)
├── duration.ts     # Parseur durée texte → minutes (« 2 jours », « 1h30 »)
└── voter.ts        # Identifiant votant anonyme (localStorage)
scripts/            # Scripts SQL d'initialisation (à exécuter dans l'ordre)
doc/                # Documentation complète (voir doc/index.md)
public/
└── openapi.yaml    # Spécification OpenAPI 3.0
__tests__/          # Tests unitaires (Vitest)
```

## Contribuer

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour le guide complet d'installation et les conventions.

Si vous souhaitez proposer une fonctionnalité importante, ouvrez d'abord une [issue](https://github.com/Jagostini/pixel-night/issues) pour en discuter.

Suivez la [feuille de route](/roadmap) pour voir ce qui est prévu.

## Changelog

Voir [CHANGELOG.md](./CHANGELOG.md).

## Licence

[MIT + Commons Clause](./LICENSE) — Usage libre pour vos propres soirées, contributions encouragées. La revente ou la commercialisation du logiciel nécessite un accord préalable.

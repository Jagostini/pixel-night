# Pixel Night

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-support-FF813F?style=flat&logo=buy-me-a-coffee&logoColor=white)](https://www.buymeacoffee.com/agostinij86)

Application web de soirées cinéma collaboratives. Les participants votent ensemble pour choisir un thème puis un film — sans compte, sans friction.

## Fonctionnement

Une soirée se déroule en deux phases :

1. **Vote thème** — chaque participant vote pour son thème préféré parmi une sélection aléatoire
2. **Vote film** — le thème gagnant est utilisé pour chercher des films sur TMDb, les participants votent pour leur film préféré

Les participants n'ont pas besoin de compte. Un identifiant anonyme est stocké dans leur navigateur pour garantir l'unicité du vote.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 16 (App Router) + TypeScript |
| UI | Tailwind CSS + Shadcn UI (Radix UI) |
| Base de données | Supabase (PostgreSQL + Auth + RLS) |
| Films | TMDb API |
| Hébergement | Vercel |

## Démarrage rapide

```bash
# 1. Cloner et installer
git clone https://github.com/<owner>/pixel-night.git
cd pixel-night
npm install

# 2. Configurer les variables d'environnement
cp .env.example .env.local
# Remplir .env.local avec vos clés Supabase et TMDb

# 3. Initialiser la base de données
# Exécuter dans l'ordre dans le SQL Editor de Supabase :
# scripts/001_sp_create_tables.sql
# scripts/002_sp_rls_policies.sql
# scripts/003_sp_profile_trigger.sql

# 4. Lancer
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

## Structure du projet

```
app/
├── admin/          # Tableau de bord organisateur (auth requise)
│   ├── soirees/    # Créer et gérer les soirées
│   ├── themes/     # Gérer le catalogue de thèmes
│   └── parametres/ # Configuration TMDb
├── api/            # Routes API (votes, finalisation, TMDb)
├── auth/           # Connexion / inscription
└── soiree/[id]/    # Pages publiques de vote et résultats

components/         # Composants React
lib/                # Utilitaires, clients Supabase, types
scripts/            # Scripts SQL d'initialisation
```

## Variables d'environnement

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TMDB_API_READ_ACCESS_TOKEN=
```

Voir `.env.example` pour les détails.

## Contribuer

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour le guide complet d'installation et les conventions.

Si vous souhaitez proposer une fonctionnalité importante, ouvrez d'abord une issue pour en discuter.

## Licence

[MIT + Commons Clause](./LICENSE) — Usage libre pour vos propres soirées, contributions encouragées. La revente ou la commercialisation du logiciel nécessite un accord préalable.

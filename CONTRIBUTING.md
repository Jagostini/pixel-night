# Contribuer à Pixel Night

Merci de l'intérêt que vous portez à Pixel Night ! Ce guide vous explique comment installer le projet localement et soumettre vos contributions.

## Table des matières

- [Code de conduite](#code-de-conduite)
- [Avant de commencer](#avant-de-commencer)
- [Installation locale](#installation-locale)
- [Architecture du projet](#architecture-du-projet)
- [Flux de travail pour contribuer](#flux-de-travail-pour-contribuer)
- [Conventions de code](#conventions-de-code)
- [Base de données](#base-de-données)
- [Variables d'environnement](#variables-denvironnement)

---

## Code de conduite

Ce projet est régi par la licence [MIT + Commons Clause](./LICENSE). En contribuant, vous acceptez que vos contributions soient publiées sous cette même licence. Toute contribution est la bienvenue, qu'il s'agisse d'un correctif de bug, d'une amélioration de l'UX ou d'une nouvelle fonctionnalité.

Si vous envisagez une contribution significative (nouvelle fonctionnalité, refactorisation majeure), ouvrez d'abord une **issue** pour en discuter avant de commencer à coder.

---

## Avant de commencer

Assurez-vous d'avoir installé :

- [Node.js](https://nodejs.org/) >= 20
- [npm](https://www.npmjs.com/) ou [pnpm](https://pnpm.io/)
- Un compte [Supabase](https://supabase.com/) (gratuit)
- Un compte [TMDb](https://www.themoviedb.org/) pour l'API de films (gratuit)

---

## Installation locale

### 1. Cloner le dépôt

```bash
git clone https://github.com/<votre-fork>/pixel-night.git
cd pixel-night
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configurer Supabase

1. Créez un nouveau projet sur [supabase.com](https://supabase.com)
2. Dans le SQL Editor de Supabase, exécutez les scripts dans l'ordre suivant :
   - `scripts/001_sp_create_tables.sql` — Crée toutes les tables
   - `scripts/002_sp_rls_policies.sql` — Configure les politiques de sécurité (RLS)
   - `scripts/003_sp_profile_trigger.sql` — Configure le trigger de profil auto

### 4. Configurer TMDb

1. Créez un compte sur [themoviedb.org](https://www.themoviedb.org/)
2. Allez dans **Paramètres → API** et générez un **API Read Access Token**

### 5. Variables d'environnement

Copiez le fichier d'exemple et remplissez-le :

```bash
cp .env.example .env.local
```

Renseignez ensuite les valeurs dans `.env.local` (voir la section [Variables d'environnement](#variables-denvironnement)).

### 6. Lancer le serveur de développement

```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

### 7. Créer un compte admin

Sur la page d'accueil, allez sur `/auth/sign-up` pour créer votre compte organisateur. Une fois inscrit, vous avez accès au tableau de bord admin sur `/admin`.

---

## Architecture du projet

```
pixel-night/
├── app/                    # Pages et routes (Next.js App Router)
│   ├── admin/              # Interface organisateur (authentifiée)
│   │   ├── soirees/        # Gestion des soirées
│   │   ├── themes/         # Gestion des thèmes
│   │   └── parametres/     # Configuration TMDb
│   ├── api/                # Routes API
│   │   ├── soirees/[id]/   # Vote, finalisation, récupération de films
│   │   └── tmdb/           # Proxy pour l'API TMDb
│   ├── auth/               # Pages de connexion/inscription
│   └── soiree/[id]/        # Pages publiques de vote et résultats
├── components/
│   ├── ui/                 # Composants Shadcn UI (ne pas modifier directement)
│   └── *.tsx               # Composants métier de l'application
├── lib/
│   ├── supabase/           # Clients Supabase (server, client, admin, middleware)
│   ├── types.ts            # Types TypeScript partagés
│   ├── tmdb.ts             # Utilitaires pour l'API TMDb
│   └── voter.ts            # Gestion de l'ID votant anonyme (localStorage)
├── scripts/                # Scripts SQL pour initialiser la base de données
└── hooks/                  # Hooks React personnalisés
```

### Flux de données

```
Participant anonyme           Organisateur (authentifié)
       │                               │
       ▼                               ▼
/soiree/[id]              /admin/soirees/[id]
       │                               │
       ├── Vote thème ──► POST /api/soirees/[id]/vote-theme
       ├── Vote film  ──► POST /api/soirees/[id]/vote-film
       │                               │
       │                    ├── Finaliser thème ──► POST /api/.../finalize-theme
       │                    ├── Récupérer films ──► POST /api/.../fetch-films ──► TMDb
       │                    └── Finaliser film  ──► POST /api/.../finalize-film
       │
       └── Résultats ──► /soiree/[id]/resultats
```

### Phases d'une soirée

```
planned ──► theme_vote ──► film_vote ──► completed
```

- **planned** : La soirée est créée mais les votes ne sont pas encore ouverts
- **theme_vote** : Les participants votent pour leur thème préféré
- **film_vote** : Le thème gagnant est sélectionné, les films sont récupérés depuis TMDb, les participants votent pour un film
- **completed** : Le film gagnant est sélectionné, la soirée est terminée

---

## Flux de travail pour contribuer

1. **Forkez** le dépôt sur GitHub
2. **Créez une branche** à partir de `main` :
   ```bash
   git checkout -b feat/ma-nouvelle-fonctionnalite
   # ou
   git checkout -b fix/correction-du-bug
   ```
3. **Faites vos modifications** en respectant les conventions ci-dessous
4. **Testez** votre code localement
5. **Committez** avec un message clair :
   ```bash
   git commit -m "feat: ajouter le support des sous-thèmes"
   ```
6. **Poussez** votre branche et **ouvrez une Pull Request** vers `main`

### Convention de nommage des commits

Ce projet suit [Conventional Commits](https://www.conventionalcommits.org/) :

| Préfixe | Usage |
|---------|-------|
| `feat:` | Nouvelle fonctionnalité |
| `fix:` | Correction de bug |
| `refactor:` | Refactorisation sans changement de comportement |
| `style:` | Changements purement cosmétiques |
| `docs:` | Documentation uniquement |
| `chore:` | Maintenance, dépendances, config |

---

## Conventions de code

### TypeScript

- Tout le code est en TypeScript strict
- Les types partagés sont dans `lib/types.ts`
- Évitez `any` — utilisez des types précis ou `unknown`

### Composants React

- Composants fonctionnels avec hooks
- Les composants UI génériques sont dans `components/ui/` (générés par Shadcn, évitez de les modifier directement)
- Les composants métier sont à la racine de `components/`

### Supabase

- Utilisez le bon client selon le contexte :
  - `lib/supabase/server.ts` → Server Components, Route Handlers, Server Actions
  - `lib/supabase/client.ts` → Client Components
  - `lib/supabase/admin.ts` → Contournement du RLS (uniquement pour les routes API qui nécessitent d'écrire au nom d'un utilisateur anonyme)

### Styles

- Tailwind CSS uniquement (pas de CSS-in-JS, pas de modules CSS)
- Suivez les conventions de classes de Shadcn UI

---

## Base de données

Toutes les tables sont préfixées `sp_` (Soirée Pixelisée).

| Table | Description |
|-------|-------------|
| `sp_profiles` | Profils des organisateurs |
| `sp_themes` | Catalogue des thèmes disponibles |
| `sp_soirees` | Les soirées (événements) |
| `sp_soiree_themes` | Thèmes proposés pour chaque soirée |
| `sp_soiree_films` | Films récupérés depuis TMDb pour chaque soirée |
| `sp_theme_votes` | Votes de thème des participants |
| `sp_film_votes` | Votes de film des participants |

Les scripts SQL sont dans `scripts/` et doivent être exécutés dans l'ordre numérique.

Si vous ajoutez ou modifiez des tables, créez un nouveau script SQL numéroté (ex: `004_sp_...sql`) avec les instructions `ALTER TABLE` ou `CREATE TABLE` nécessaires.

---

## Variables d'environnement

| Variable | Description | Où la trouver |
|----------|-------------|---------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase | Dashboard Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique Supabase | Dashboard Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé de service (accès admin, **ne jamais exposer côté client**) | Dashboard Supabase → Settings → API |
| `TMDB_API_READ_ACCESS_TOKEN` | Token d'accès en lecture TMDb | themoviedb.org → Settings → API |

---

## Questions ?

Ouvrez une [issue](https://github.com/<owner>/pixel-night/issues) ou une discussion sur GitHub. Toute contribution, même mineure, est appréciée.

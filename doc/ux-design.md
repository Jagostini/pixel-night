# Guide UX Design — Pixel Night

## Philosophie de design

**Zéro friction pour les participants.** Pas de compte, pas d'inscription — un lien suffit.
L'organisateur gère tout, les participants votent en quelques secondes.

**Minimalisme opinioné.** Interface sombre (thème cinéma), actions claires, une seule chose
à faire par écran.

## Système de design

### Composants UI

Pixel Night utilise **shadcn/ui** (Radix UI) avec Tailwind CSS 4.

- Composants dans `components/ui/` — auto-générés, ne pas modifier directement
- Configuration dans `components.json`
- Tokens de couleur définis dans `styles/globals.css` (variables CSS Tailwind)

### Palette de couleurs

| Token | Usage |
|---|---|
| `background` | Fond principal — sombre (`#1a1625` environ) |
| `foreground` | Texte principal |
| `primary` | Accent — actions principales, liens actifs |
| `muted` | Texte secondaire, placeholders |
| `muted-foreground` | Labels, métadonnées |
| `border` | Séparateurs, contours de cartes |
| `card` | Fond des cartes et panneaux |
| `accent` | Hover, état actif |

### Typographie

- Police principale : **Geist** (Next.js Google Fonts)
- Police mono : **Geist Mono** (codes, slugs)
- Tailles : système Tailwind standard

## Parcours utilisateurs

### Parcours Participant

```
Accueil (/)
    │
    ├── Saisit le code de la salle (ex: "cine-des-potes")
    │
    ▼
Page salle (/s/{slug})
    │
    ├── [Phase theme_vote]
    │     └── Affiche les thèmes → Clique sur un thème → Vote enregistré → Confirmation
    │
    ├── [Phase film_proposal]
    │     ├── Voit le thème gagnant
    │     ├── Recherche un film (TMDb) → Propose (max 3)
    │     └── Voit les propositions des autres participants
    │
    ├── [Phase film_vote]
    │     └── Affiche les films → Clique sur un film → Vote enregistré → Confirmation
    │
    └── [Phase completed]
          └── Affiche le film gagnant + résultats détaillés
```

### Parcours Organisateur

```
Connexion (/auth/login)
    │
    ▼
Dashboard (/admin)
    │
    ├── Créer une soirée (/admin/soirees/nouvelle)
    │     ├── Titre, date, nombre de thèmes/films
    │     ├── Activer les propositions ? (+ durée : "2 jours", "1h30"...)
    │     └── → Soirée créée en phase "planned"
    │
    ├── Gérer la soirée (/admin/soirees/{id})
    │     │
    │     ├── [planned] → Lancer le vote thème
    │     ├── [theme_vote] → Finaliser le thème (désigne le gagnant)
    │     │                → OU lancer les propositions (si activé)
    │     ├── [film_proposal] → Clore les propositions
    │     ├── [film_vote] → Finaliser le film
    │     └── [Toute phase] → Annuler / Supprimer
    │
    └── Paramètres (/admin/parametres) → Configurer token TMDb
```

## Inventaire des écrans

| Route | Audience | Phase(s) | Description |
|---|---|---|---|
| `/` | Participant | Toutes | Accueil : saisie du code salle |
| `/s/{slug}` | Participant | Toutes | Page principale de vote |
| `/auth/login` | Organisateur | — | Connexion |
| `/auth/sign-up` | Organisateur | — | Inscription |
| `/admin` | Organisateur | — | Dashboard soirées |
| `/admin/soirees/nouvelle` | Organisateur | — | Création soirée |
| `/admin/soirees/{id}` | Organisateur | Toutes | Gestion soirée |
| `/admin/salles` | Organisateur | — | Gestion salles |
| `/admin/themes` | Organisateur | — | Catalogue thèmes |
| `/admin/parametres` | Organisateur | — | Config TMDb |
| `/roadmap` | Tous | — | Feuille de route (GitHub Issues) |
| `/docs` | Développeur | — | Documentation API (Redoc) |

## États et feedback utilisateur

### Toasts (Sonner)

- Succès : vert, position bottom-right
- Erreur : rouge
- Info : neutre

Exemples :
- « Vote enregistré ! »
- « Connexion réussie ! »
- « Erreur lors de la recherche »

### États de chargement

- Boutons : spinner inline pendant l'action
- Listes de films : skeleton (Tailwind `animate-pulse`)
- Recherche TMDb : indicateur de chargement + état "aucun résultat"

### États vides

- Aucun résultat de recherche : « Aucun résultat pour '{terme}' »
- Erreur de recherche : « Erreur lors de la recherche »
- Aucune proposition : message explicatif

## Identifiant votant anonyme

L'identifiant est un UUID v4 généré au premier accès et stocké dans `localStorage`
sous la clé `sp_voter_id`. Aucune donnée personnelle n'est collectée.

**Conséquences UX :**
- Vider le localStorage = perte de l'ID = possibilité de voter à nouveau (edge case accepté)
- Navigation privée = nouvel ID à chaque session
- Pas de "vous avez déjà voté" si l'ID est perdu

## Accessibilité

- Composants Radix UI : gestion ARIA, focus, clavier nativement
- Contrastes : vérifier `primary` sur `background` (ratio WCAG AA minimum 4.5:1)
- Images TMDb : attribut `alt` avec titre du film
- Navigation clavier : tous les éléments interactifs focusables

## Responsive

- Layout : `max-w-5xl mx-auto px-4`
- Grilles films : `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`
- Footer : colonne mobile, ligne desktop
- Breakpoints Tailwind standards : `sm` (640px), `md` (768px), `lg` (1024px)

## Composants métier notables

| Composant | Description |
|---|---|
| `film-proposal-search.tsx` | Recherche TMDb avec états erreur/vide/chargement |
| `soiree-phase-badge.tsx` | Badge coloré selon la phase |
| `site-footer.tsx` | Footer avec liens GitHub, docs, roadmap |
| `site-header.tsx` | En-tête avec navigation admin conditionnelle |

## Points d'attention UX

1. **Durée des propositions** : champ texte libre (`"2 jours"`, `"1h30"`) + aperçu en direct (« Durée : 1h30 »). Si format non reconnu → bouton désactivé.
2. **Thème gagnant en cas d'égalité** : tirage au sort côté serveur. L'UI ne montre pas l'égalité — elle annonce directement le gagnant.
3. **Repli TMDb automatique** : si la phase propositions se clôt sans proposition, les films sont récupérés automatiquement depuis TMDb. L'organisateur voit `fallback: true` dans la réponse API mais l'expérience participant est transparente.
4. **Annulation** : un badge "Annulée" rouge s'affiche sur la page publique. Pas de vote possible.

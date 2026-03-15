# Feuille de route — Pixel Night

La feuille de route en temps réel est disponible sur **[/roadmap](/roadmap)** — synchronisée
avec les [issues GitHub](https://github.com/Jagostini/pixel-night/issues).

## Comment contribuer

- **Suggérer une fonctionnalité** : [Ouvrir une issue](https://github.com/Jagostini/pixel-night/issues/new?template=feature_request.md)
- **Signaler un bug** : [Ouvrir une issue](https://github.com/Jagostini/pixel-night/issues/new?template=bug_report.md)
- **Contribuer au code** : Voir [CONTRIBUTING.md](../CONTRIBUTING.md)

## Labels GitHub utilisés

| Label | Signification |
|---|---|
| `enhancement` | Nouvelle fonctionnalité ou amélioration |
| `bug` | Comportement incorrect |
| `in-progress` | En cours de développement |
| `good first issue` | Bon point d'entrée pour un nouveau contributeur |
| `help wanted` | Contribution externe bienvenue |
| `documentation` | Amélioration de la documentation |
| `wontfix` | Ne sera pas traité |

## Fonctionnalités livrées

Voir le [CHANGELOG](../CHANGELOG.md) pour l'historique complet des versions.

### v1.0 — Fondations

- Vote de thème anonyme
- Vote de film anonyme (films récupérés depuis TMDb)
- Interface organisateur (auth Supabase)
- Gestion du catalogue de thèmes

### v1.1 — Améliorations

- Phase de propositions de films par les participants
- Annulation et suppression de soirées
- Gestion des salles (`sp_salles`)
- Soirées associées à une salle
- Identifiant votant par salle

### v1.2 — Sécurité et UX

- Chiffrement AES-256-GCM du token TMDb en base
- Durée des propositions en texte libre (« 2 jours », « 1h30 »)
- Feedback utilisateur amélioré (erreurs de recherche, états vides)
- Correction redirect post-login
- Documentation complète (`doc/`)
- Page feuille de route synchronisée GitHub
- Documentation API interactive (Redoc + OpenAPI)
- Footer open source (GitHub, docs, roadmap)
- Proxy Next.js (migration middleware → proxy)

## Idées pour la suite

> Ces idées sont indicatives — elles pourront évoluer selon les contributions et retours.

- Notifications en temps réel (Supabase Realtime) pour les votes en direct
- Support multi-langues (i18n)
- Export PDF des résultats de soirée
- Historique public des soirées passées d'une salle
- Intégration QR code pour partager le lien participant
- Mode "blind vote" : les participants ne voient pas les votes des autres en temps réel
- Statistiques organisateur : films les plus votés, thèmes préférés
- Support des sous-thèmes ou thèmes composés

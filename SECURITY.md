# Politique de sécurité — Pixel Night

## Versions supportées

| Version | Support sécurité |
|---------|-----------------|
| `main` (dernière) | ✅ Oui |
| Versions antérieures | ❌ Non |

Seule la branche `main` reçoit des correctifs de sécurité. Il n'y a pas de maintenance des versions précédentes.

## Signaler une vulnérabilité

**Ne pas créer d'issue GitHub publique pour une vulnérabilité de sécurité.**

Merci d'envoyer un rapport privé via l'une de ces deux méthodes :

1. **GitHub Private Security Advisory** (recommandé) :
   [github.com/Jagostini/pixel-night/security/advisories/new](https://github.com/Jagostini/pixel-night/security/advisories/new)

2. **Email** : contacter le mainteneur via le profil GitHub [@Jagostini](https://github.com/Jagostini)

### Ce qu'il faut inclure

- Description de la vulnérabilité et de son impact potentiel
- Étapes pour la reproduire (proof of concept si possible)
- Versions / environnements concernés
- Suggestion de correctif si vous en avez une

## Ce à quoi vous pouvez vous attendre

- **Accusé de réception** : sous 72 heures
- **Évaluation** : sous 7 jours — confirmation ou rejet de la vulnérabilité
- **Correctif** : dès que possible selon la criticité
- **Crédit** : votre nom sera mentionné dans le changelog et les release notes, sauf si vous préférez rester anonyme

## Périmètre

Ce projet est une application web Next.js / Supabase. Les vulnérabilités pertinentes incluent notamment :

- Contournement des politiques RLS Supabase
- Injection dans les routes API (paramètres non validés)
- Exposition de données entre soirées ou entre utilisateurs
- Problèmes liés au chiffrement du token TMDb
- Élévation de privilèges (accès admin sans authentification)

Sont hors périmètre : vulnérabilités des dépendances tierces non directement exploitables dans ce projet, social engineering, attaques physiques.

## Merci

Les signalements responsables contribuent directement à la qualité et à la sécurité du projet. Merci de prendre le temps de nous les communiquer.

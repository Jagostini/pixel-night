# Guide Organisateur — Pixel Night

Ce guide s'adresse aux **organisateurs** : les personnes qui créent et animent les soirées
cinéma. Pas besoin de compétences techniques.

## Créer votre compte

1. Aller sur `/auth/sign-up`
2. Renseigner votre email et un mot de passe
3. Vous êtes connecté — vous accédez au tableau de bord `/admin`

## Configurer le token TMDb (une seule fois)

TMDb (The Movie Database) fournit les informations sur les films. Vous devez configurer
votre token une fois pour toutes.

1. Créer un compte gratuit sur [themoviedb.org](https://www.themoviedb.org/)
2. Aller dans **Paramètres → API** → copier l'**API Read Access Token** (commence par `eyJ...`)
3. Dans Pixel Night : aller dans **Admin → Paramètres**
4. Coller le token et cliquer "Enregistrer"
5. Le token est chiffré et sauvegardé — vous n'aurez pas à le ressaisir

> Le token est stocké chiffré dans la base de données. Il n'est jamais visible en clair.

## Configurer votre cinéma

Lors de votre première connexion, un cinéma est automatiquement créé. Vous pouvez le
configurer depuis **Admin → Paramètres**.

### Nom et code d'accès

- **Nom** : nom affiché sur la page publique (ex : "Ciné des potes")
- **Code du cinéma** (slug) : le code court que les participants saisissent pour rejoindre
  (ex : `cine-des-potes`). Ce code doit être unique et sans espaces.

Partagez l'URL `/s/cine-des-potes` ou le code par message, email ou QR code.

### Gérer les salles

Un cinéma peut avoir **plusieurs salles**. Chaque soirée est associée à une salle.

Dans **Admin → Paramètres → Mes salles** :
- Ajouter ou supprimer des salles
- Nommer chaque salle (optionnel, ex : "Grande salle", "Salle 2")
- Définir la capacité en nombre de places (optionnel)

> Si vous n'avez qu'une seule salle, elle est sélectionnée automatiquement à la création
> d'une soirée. Avec plusieurs salles, vous choisissez la salle lors de la création.

### Règle d'exclusion des thèmes

Configurez comment le thème gagnant d'une soirée est mis en attente avant de réapparaître :

| Mode | Comportement |
|---|---|
| **Aucune exclusion** | Le thème peut revenir à la prochaine soirée |
| **Par nombre de soirées** | Le thème est exclu pendant N soirées (calcul : N × 30 jours) |
| **Par nombre de jours** | Le thème est exclu pendant exactement N jours |

La règle s'applique automatiquement dès la finalisation du film gagnant.

## Gérer les thèmes

Les thèmes sont proposés aléatoirement parmi votre catalogue lors de la création d'une soirée.

### Importer depuis le catalogue

Pixel Night inclut un catalogue de **30 thèmes pré-configurés** (Western, Science-Fiction,
Horreur, Comédie romantique, etc.), chacun avec des genres TMDb pour la découverte automatique.

1. Aller dans **Admin → Thèmes**
2. Cliquer **Catalogue**
3. Les thèmes déjà présents dans votre liste sont masqués
4. Cliquer **Importer** sur les thèmes souhaités

### Créer un thème personnalisé

1. Cliquer **Nouveau thème**
2. Saisir le nom du thème
3. (Optionnel) Cocher les **genres TMDb** correspondants — utilisés par le moteur Découverte
4. (Optionnel) Saisir des **mots-clés** séparés par des virgules — utilisés par la recherche classique

> Exemple : thème "Western" → genres : Western ; mots-clés : `western, cowboy, far west`

### Activer / désactiver un thème

Chaque thème peut être activé ou désactivé. Seuls les thèmes actifs (et non exclus) sont
éligibles lors de la création d'une soirée.

## Créer une soirée

1. Tableau de bord → **Nouvelle soirée**
2. Si votre cinéma a plusieurs salles, sélectionner la salle
3. Remplir les informations :
   - **Date** (optionnel) : date de la projection
   - **Heure de projection** (optionnel) : heure de début
   - **Nombre de thèmes** : combien de thèmes sont proposés au vote
   - **Nombre de films** : combien de films sont soumis au vote final
   - **Durée du vote** (optionnel) : durée en minutes, vide = illimité
   - **Permettre les propositions ?** : si coché, les participants pourront proposer leurs propres films
4. Cliquer **Créer la soirée**

La soirée est créée en phase `planned` — personne ne peut encore voter.

## Déroulement d'une soirée

### Étape 1 : Vote thème

1. Dans le panel admin, cliquer **Lancer le vote thème** (ou la soirée démarre directement en `theme_vote`)
2. Les participants voient les thèmes proposés et votent
3. Quand vous êtes prêt, cliquer **Finaliser le thème**
4. Le thème gagnant est désigné (tirage au sort en cas d'égalité)

### Étape 2 : Récupérer les films

Après la finalisation du thème, récupérez les films depuis TMDb :

- **Découverte (genres)** — utilise les genres TMDb associés au thème pour une sélection variée
  (5 pages aléatoires parmi les 10 premières). Recommandé si le thème a des genres configurés.
- **Mots-clés** — recherche classique par les mots-clés du thème.

### Étape 2b : Curation des films (optionnel)

Avant que les votes ne commencent, vous pouvez ajuster la liste des films :

- **Supprimer un film** : cliquer la croix sur la carte du film
- **Ajouter un film** : cliquer "Ajouter un film" → rechercher sur TMDb → ajouter

> La curation est **verrouillée dès le premier vote** : vous ne pouvez plus modifier
> la liste une fois que des participants ont voté.

### Étape 3 (optionnel) : Propositions de films

> Cette étape n'existe que si vous avez activé les propositions à la création.

1. Cliquer **Lancer les propositions**
2. Saisir la durée (ex : `2 jours`)
3. Les participants peuvent rechercher et proposer jusqu'à 3 films chacun
4. Quand la durée est écoulée (ou manuellement), cliquer **Clore les propositions**
5. Si personne n'a proposé de film, les films sont récupérés automatiquement depuis TMDb

### Étape 4 : Vote film

1. Les participants voient les films et votent pour leur préféré
2. Cliquer **Finaliser le film** quand vous êtes prêt
3. Le film gagnant est annoncé
4. Le thème gagnant est automatiquement exclu selon la règle configurée

### Fin

La soirée passe en `completed` — le film gagnant s'affiche pour tous les participants.

## Annuler une soirée

Si vous devez annuler : bouton **Annuler** dans le panel admin.
Les participants verront le statut "Annulée" sur la page de la soirée.

> L'annulation est irréversible. Vous pouvez supprimer la soirée si vous ne souhaitez plus
> la voir dans votre historique.

## FAQ

**Que se passe-t-il en cas d'égalité ?**
Un thème (ou film) est tiré au sort parmi les ex-æquo.

**Les participants ont besoin d'un compte ?**
Non. Ils votent de manière anonyme via un identifiant stocké dans leur navigateur.

**Peut-on voter depuis un mobile ?**
Oui, l'interface est responsive.

**Le token TMDb expire-t-il ?**
Les tokens TMDb n'expirent pas en principe. Si une erreur apparaît, vérifiez le token dans Admin → Paramètres.

**Peut-on modifier une soirée après création ?**
La liste des films est modifiable tant qu'aucun vote film n'a été enregistré.

**Quelle différence entre "Découverte" et "Mots-clés" ?**
La Découverte utilise les genres TMDb pour trouver des films populaires et variés.
Les Mots-clés font une recherche textuelle directe. Les deux peuvent être utilisés
et leurs résultats sont fusionnés.

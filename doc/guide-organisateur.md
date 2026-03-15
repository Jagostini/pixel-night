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

## Créer une soirée

1. Tableau de bord → **Nouvelle soirée**
2. Remplir les informations :
   - **Titre** (optionnel) : nom de la soirée
   - **Date** (optionnel) : date de la projection
   - **Nombre de thèmes** : combien de thèmes sont proposés au vote
   - **Nombre de films** : combien de films sont soumis au vote final
   - **Activer les propositions ?** : si coché, les participants pourront proposer leurs propres films avant le vote
   - **Durée des propositions** : durée pendant laquelle les propositions sont ouvertes. Exemples : `2 jours`, `1h30`, `30min`, `45`
3. Cliquer **Créer**

La soirée est créée en phase `planned` — personne ne peut encore voter.

## Partager le lien de vote

Chaque soirée a un **code de salle** (slug). Exemple : `cine-des-potes`.

Les participants accèdent à la soirée en saisissant ce code sur la page d'accueil,
ou en visitant directement `/s/cine-des-potes`.

> Partagez ce lien par message, email ou QR code.

## Déroulement d'une soirée

### Étape 1 : Vote thème

1. Dans le panel admin, cliquer **Lancer le vote thème**
2. Les participants voient les thèmes proposés et votent
3. Quand vous êtes prêt, cliquer **Finaliser le thème**
4. Le thème gagnant est désigné (tirage au sort en cas d'égalité)

### Étape 2 (optionnel) : Propositions de films

> Cette étape n'existe que si vous avez activé les propositions à la création.

1. Cliquer **Lancer les propositions**
2. Saisir la durée (ex : `2 jours`)
3. Les participants peuvent rechercher et proposer jusqu'à 3 films chacun
4. Quand la durée est écoulée (ou manuellement), cliquer **Clore les propositions**
5. Si personne n'a proposé de film, les films sont récupérés automatiquement depuis TMDb

### Étape 3 : Vote film

1. Les participants voient les films et votent pour leur préféré
2. Cliquer **Finaliser le film** quand vous êtes prêt
3. Le film gagnant est annoncé

### Fin

La soirée passe en `completed` — le film gagnant s'affiche pour tous les participants.

## Gérer les thèmes

Les thèmes sont proposés aléatoirement parmi votre catalogue.

1. Aller dans **Admin → Thèmes**
2. Ajouter des thèmes avec des **mots-clés** pour guider la recherche TMDb
   - Exemple : thème "Western" → mots-clés : `western`, `cowboy`, `far west`
3. Les thèmes déjà utilisés récemment sont exclus automatiquement (selon le paramètre `exclusion_soirees`)

## Annuler une soirée

Si vous devez annuler : bouton **Annuler** dans le panel admin.
Les participants verront le statut "Annulée" sur la page de la soirée.

> L'annulation est irréversible. Vous pouvez supprimer la soirée si vous ne souhaitez plus la voir dans votre historique.

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
Certaines informations sont modifiables en phase `planned`. Une fois le vote lancé, les modifications sont limitées.

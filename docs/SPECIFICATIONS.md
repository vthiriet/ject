# Ject — Spécifications

> Document vivant : il est mis à jour à chaque nouvelle fonctionnalité ou optimisation.
> Dernière mise à jour : 12/10/2026 (prototype V1).

## 1. Vision

Ject est une **inbox personnelle** : un endroit où l'on dépose très vite, en vrac,
tout ce qui passe par la tête (idées de projets, envies, listes de courses, retours
sur une app, recommandations culturelles…), puis que l'on **trie** ensuite vers des
projets.

Ject reprend d'abord les bases de Google Keep, puis corrige trois manques :

1. **La catégorisation** des notes doit être plus visible que dans Keep.
2. **Les illustrations** possibles sont trop limitées dans Keep.
3. **L'export vers Notion** : envoyer facilement une liste entière, ou seulement
   certains éléments d'une liste, vers Notion pour la gestion de projet.

**Besoin n°1** : sortir l'app et noter quelque chose **le plus vite possible**.

## 2. Utilisateurs et contexte

| Sujet | Décision |
|---|---|
| Utilisateurs | Une seule personne (le propriétaire) pour l'instant |
| Plateforme prioritaire | Android (téléphone) |
| Ordinateur | Accès par une adresse web (URL) dans le navigateur |
| Format | PWA, c'est-à-dire un site web installable sur l'écran d'accueil comme une app |
| Publication sur les stores | Non |
| Langue | Français |
| Échéance | Aucune |

## 3. Périmètre fonctionnel

### 3.0 Onglet Inbox et rangement

**Inbox** (onglet principal, ouvert au lancement) : uniquement des éléments **bruts**, en
attente d'être rangés.
- Bouton rond **+** en bas à droite (sur tous les onglets), comme Google Keep : on choisit
  **Texte** ou **Liste**, et la carte s'ouvre prête à écrire. Dans l'Inbox, c'est un
  élément à trier ; dans un autre onglet, la carte prend le type de l'onglet (et l'aire
  filtrée). Une carte laissée vide est supprimée à la fermeture.
- Un élément = un texte ou une liste (liens cliquables avec aperçu).
- Toucher un élément l'ouvre pour le modifier (sans épingle ni archivage) ; corbeille
  avec « Annuler ».
- Le partage Android (« Partager › Ject ») et le raccourci « Ajouter à l'inbox » arrivent ici.
- Pastille sur l'onglet : nombre d'éléments à ranger.

**Ranger** : bouton en haut de l'Inbox (tous les éléments) ou sur chaque élément. Les
éléments défilent un par un (« Ranger · 2 / 7 ») ; le détail est décrit en 3.0 bis.
Chaque ligne d'un élément rangé dans une liste devient une case à cocher.

### 3.0 bis Onglets Actions, Habitudes, Projets, Ressources

Inspiré de GTD (que faire de chaque élément) et de PARA (où il vit), en version simplifiée.

**Onglets, dans l'ordre :** Inbox · Actions · Habitudes · Projets · Ressources.
Ils remplacent l'onglet « Listes ». Le menu ☰ garde les Aires, les Archives, la Corbeille
et les Paramètres.

**Cartes :** dans chaque onglet, une carte est soit un **élément seul** (note texte), soit
une **liste** (plusieurs éléments à cocher), comme dans Keep. Couleurs, illustrations et
export Notion restent disponibles partout. L'onglet où se trouve la carte donne son type.

**Aires** (Santé, Maison, Finances…) : ce sont les libellés actuels, renommés. Une carte de
n'importe quel type peut appartenir à une ou plusieurs aires. Une rangée de pastilles permet
de filtrer par aire dans chaque onglet.

**Par type :**

| Type | Exemples | Information propre |
|---|---|---|
| Action | « Prendre RDV dentiste » ; liste « Courses » | **État** : à faire / en attente (de qui, facultatif) / un jour / fait |
| Habitude | « Courir » ; liste « Routine du matin » | **Régularité** : chaque jour, X fois par semaine, chaque semaine, chaque mois, ou texte libre |
| Projet | liste « Voyage Japon » (ses étapes) | **État** : actif / un jour / terminé (part dans les Archives). Les étapes ont les états des actions |
| Ressource | « Film : Dune 2 » ; liste « Films à voir » | Aucune |

Pour une liste, l'état ou la régularité se règle sur chaque élément. Une case cochée = fait.

**Type pressenti dans l'Inbox :** dans la carte d'un élément de l'Inbox, 4 pastilles
facultatives : Action · Habitude · Projet · Ressource. Sans choix, l'élément reste
« à trier ». Le type choisi s'affiche sur l'élément et est présélectionné au rangement.
Menu ⋮ › « Ranger dans… » range directement la carte telle quelle dans un onglet.

**Ranger :** pour chaque élément de l'Inbox :
1. choisir ou confirmer le **type** (prérempli si choisi à la saisie) ;
2. choisir la **destination** dans l'onglet correspondant : nouvelle carte, ajout à une
   liste existante, ou nouvelle liste.

Destinations proposées : « Carte seule dans … », « Nouvelle liste « nom » », puis les
listes existantes de ce type (les plus récentes d'abord, avec recherche). Pas de réglage
d'état, de régularité ni d'aire au rangement : ils se règlent ensuite dans la carte.

**Affichage par onglet :** Actions est découpé en sections À faire (listes et actions
seules) / En attente / Un jour / Faites ; Projets en Actifs / Un jour ; un projet
« Terminé » part dans les Archives (et redevient actif si on le désarchive). Les états et
régularités s'affichent sur les cartes (⏳ En attente, 💤 Un jour, 🔁 Chaque jour…).

**Cartes :** dans Actions, Habitudes et Ressources, chaque carte a une icône poubelle
(corbeille, avec « Annuler »).

**Bouton « précédent » du téléphone :** il revient à l'onglet affiché avant, et referme
d'abord ce qui est ouvert (carte — enregistrée comme avec ←, Ranger, Paramètres, menu ☰,
menu du +). Sur le premier écran, il quitte l'app.

**Éditeur :** sous le titre, le type de la carte et son réglage (état, régularité).
Une liste ouverte affiche un bouton **« Copier la liste »** (titre et éléments ☐ / ☑). Dans
une liste, chaque élément a un bouton ⏳ (ou 🔁 pour une habitude) pour régler son état
ou sa régularité. Menu ⋮ › « Déplacer vers… » pour changer de type.

**Données existantes :** les notes et listes créées avant cette version sont classées dans
**Ressources**. Les libellés deviennent les **aires**. Le réglage « À l'ouverture de Ject »
est retiré : Ject s'ouvre toujours sur l'Inbox. Raccourcis Android : « Ajouter à
l'inbox » et « Actions ».

### 3.1 V1 : prototype complet

**Notes et listes**
- Notes texte (titre + contenu), transformables en liste et inversement.
- Listes à cocher : les éléments cochés descendent en bas, dans une zone repliable.
- Liens cliquables avec aperçu (titre, image et site de la page liée).
- Couleurs de fond des notes (palette inspirée de Keep, 11 couleurs).
- **Illustration de fond** (bandeau en haut de la note) : une galerie intégrée de
  10 illustrations (courses, recettes, idées, projets, musique, films, lecture,
  voyage, fête, nature), plus **ses propres images importées**. Les images importées
  sont réduites automatiquement et rangées dans « ma galerie » pour être réutilisées.

**Organisation**
- Épingler une note en haut.
- Libellés (étiquettes), **bien mis en avant** :
  - chaque libellé a un **emoji** ;
  - une **rangée de pastilles** en haut de l'écran filtre d'un seul geste ;
  - les libellés s'affichent sur chaque carte ;
  - le menu latéral les liste avec le nombre de notes ;
  - une note créée pendant qu'un filtre est actif reçoit automatiquement ce libellé.
- Archiver une note.
- Corbeille : restauration possible, suppression définitive automatique après 7 jours.
- Bouton « Annuler » après un archivage ou une suppression.
- Recherche dans le titre, le contenu et les éléments de liste.
- Affichage en grille (mosaïque) ou en liste.
- Glisser-déposer pour réordonner les notes (appui long sur téléphone).

**Sortie des données**
- Copier une note dans le presse-papiers et utiliser le partage Android
  (« Partager vers… »).
- **Export vers Notion** d'une liste entière ou d'éléments choisis (voir §5).
- Export de toutes les données (sauvegarde) au format JSON et Markdown.

**Saisie rapide** (besoin n°1)
- Barre « Créer une note… » toujours visible en bas de l'écran du téléphone :
  un toucher, et le clavier s'ouvre aussitôt.
- Réglage « À l'ouverture de Ject » : afficher mes notes, ou ouvrir directement
  une nouvelle note ou une nouvelle liste.
- Dans une liste, « Entrée » crée l'élément suivant ; coller plusieurs lignes crée
  plusieurs éléments.
- Raccourcis sur l'icône Android (appui long) : « Nouvelle note » et « Nouvelle liste ».
- Ject apparaît dans le menu « Partager » d'Android : un lien ou un texte partagé
  depuis une autre app crée une note dans l'inbox.

**Technique**
- Fonctionne hors connexion, puis se synchronise au retour du réseau.
- Synchronisation entre le téléphone et l'ordinateur.
- Mode sombre : automatique (selon le système) ou choisi manuellement.

### 3.2 Gestion de projet : dans Notion pour le moment

Ject reste une inbox. Les projets se gèrent dans Notion, grâce à l'export (§5).
Ce qui suit décrit ce que serait la gestion de projet si elle arrivait un jour dans Ject :

- Un **projet** est un chantier à moyen ou long terme.
- Il contient des **tâches** avec échéance, priorité et statut.
- Vue **Kanban** : des colonnes par statut, avec des cartes que l'on déplace.
- Sous-tâches possibles ; projets dans des projets possibles.
- Un élément appartient à **un seul** projet.
- Passage de l'inbox vers un projet : bouton **« Déplacer vers… »**.

### 3.3 Plus tard

- Images dans les notes.
- Notes vocales.
- Partage d'une note avec d'autres personnes.
- Mise en forme du texte (gras, italique, titres).
- Raccourcis clavier sur ordinateur.
- Confidentialité renforcée (chiffrement).
- Repasse de design (avec Claude Design).

### 3.4 Exclu

- Rappels par date ou par lieu.
- Dessins à main levée.
- Import des notes Google Keep.

## 4. Choix techniques

| Brique | Choix | Pourquoi |
|---|---|---|
| Cadre du site | **Astro** | Demandé, et utile pour les « routes serveur » qui parlent à Notion (voir §5) |
| Interface interactive | **React**, intégré dans Astro | L'app est très interactive (glisser-déposer, édition en direct) ; React a les bibliothèques les plus fiables pour ça |
| Hébergement | **Vercel** | Demandé ; déploiement automatique à chaque envoi sur GitHub |
| Base de données en ligne | **Supabase** (PostgreSQL) | Demandé ; sert à synchroniser téléphone et ordinateur |
| Stockage local hors connexion | **IndexedDB** via la bibliothèque Dexie | Base de données intégrée au navigateur : l'app marche sans réseau |
| PWA | Service worker + manifeste | Installation sur Android, raccourcis, menu « Partager » |

**Principe « local d'abord »** : chaque action s'enregistre d'abord sur l'appareil
(instantané, même sans réseau), puis est envoyée à Supabase en arrière-plan.
En cas de modification de la même note sur deux appareils, la version la plus
récente l'emporte.

**Limite connue** : une PWA ne peut pas afficher de **widget** sur l'écran
d'accueil Android. Les raccourcis sur l'icône et le menu « Partager » le remplacent.

**Accès et sécurité** :
- Sans compte, Ject fonctionne entièrement sur l'appareil.
- La synchronisation demande une connexion par **lien magique envoyé par e-mail**,
  une seule fois par appareil (Supabase Auth).
- Chaque ligne de la base appartient à son utilisateur. Les règles RLS de Supabase
  empêchent toute autre personne de la lire.
- Les routes serveur (Notion, aperçu de liens) vérifient la connexion et l'adresse
  autorisée (`ALLOWED_EMAIL`).
- Après la première connexion, il est recommandé de désactiver les inscriptions
  dans Supabase.

**Aperçu des liens** : une route serveur lit le titre, l'image et le site de la page
liée. Le résultat est gardé en cache sur l'appareil.

**Synchronisation** : elle se lance au démarrage, au retour du réseau, au retour
sur l'app, toutes les 30 secondes, et peu après chaque modification.

## 5. Export vers Notion

- **Rôle** : Ject sert d'inbox, et les projets vivent dans Notion (pour le moment).
- **Connexion** : une **intégration interne Notion**. Sa clé secrète est stockée dans Vercel
  et n'est jamais visible dans le navigateur. Les appels passent par une route serveur
  Astro, car Notion refuse les appels directs depuis un navigateur.
- **Destination** : une **page** Notion, choisie à chaque export dans la liste des pages
  partagées avec l'intégration. La dernière page utilisée est proposée par défaut.
- **Format** :
  - les éléments d'une liste deviennent des **cases à cocher** ajoutées à la fin
    de la page, en gardant leur état coché ou non ;
  - le titre de la note peut être ajouté comme intertitre (option) ;
  - une note texte est envoyée sous forme de paragraphes.
- **Choix** : la liste entière, ou seulement les éléments sélectionnés.
- **Après l'export** :
  - liste entière ou note texte : la note est **archivée** avec la mention
    « Exportée vers Notion le … dans « page » » ;
  - éléments choisis : ils passent dans une section **« Exportés vers Notion »** de la
    liste, avec la page et la date. Quand il ne reste plus rien, la liste est archivée.
- Réservé à l'utilisateur connecté (adresse autorisée par `ALLOWED_EMAIL`).

## 6. Modèle de données

**Sur l'appareil (IndexedDB)** :
- **notes** : id, type (`text` ou `list`), titre, contenu, éléments de liste
  (id, texte, coché, mention d'export), couleur, illustration (`preset:<id>` ou
  `img:<id>`), épinglée, archivée, mise à la corbeille le, position, libellés,
  mention d'export Notion, créée le, modifiée le.
- **labels** : id, nom, emoji.
- **backgrounds** : images importées (réduites, format JPEG).
- **outbox** : éléments modifiés en attente d'envoi à Supabase.
- **previews** : aperçus de liens (cache local, non synchronisé).

**Sur Supabase** : une seule table `ject_records` (id, utilisateur, type, données
JSON, date de modification, supprimé, date d'arrivée sur le serveur).
Le schéma est dans `supabase/schema.sql`. Une suppression définitive laisse une
« pierre tombale », pour que les autres appareils suppriment aussi la note.
En cas de conflit, la modification la plus récente l'emporte.

## 7. Pistes pour la suite

- Réordonner les éléments d'une liste par glisser-déposer.
- Export vers une **base de données** Notion (une ligne par élément), en plus des pages.
- Gestion de projet dans Ject (Kanban, échéances, priorités, sous-tâches), si Notion
  ne suffit plus.
- Repasse de design avec Claude Design.

## 8. Historique

| Date | Changement |
|---|---|
| 12/10/2026 | Version initiale après le questionnaire de cadrage |
| 12/10/2026 | Décisions : projets dans Notion, connexion par lien magique, export en cases à cocher vers une page choisie, illustrations importables. Prototype V1 complet. |
| 12/10/2026 | Guide d'installation précisé (clé Notion, variables Vercel, adresses de test). Branche par défaut remise sur `main`. |
| 12/10/2026 | Publication via GitHub Actions (la liaison Git de Vercel échoue). Version de test : ject-preview-vthiriets-projects.vercel.app. |
| 12/10/2026 | Deux onglets : Inbox (éléments bruts + bouton Ranger) et Listes (façon Keep). |
| 12/10/2026 | Inbox : le texte saisi est remis en place si l'enregistrement échoue ; les erreurs inattendues s'affichent à l'écran. |
| 12/10/2026 | Plan de l'organisation Actions / Habitudes / Projets / Ressources avec aires et états (à valider). |
| 12/10/2026 | Onglets Actions, Habitudes, Projets, Ressources ; types à la saisie ; rangement en 3 temps ; états, régularités et aires. |
| 12/10/2026 | Paramètres › Diagnostic : version chargée, état de la base locale, essai d'ajout, dernières erreurs. |
| 12/10/2026 | Base du navigateur bloquée : délai maximal de 4 s, message explicatif au démarrage et dans le diagnostic. |
| 12/10/2026 | Bouton + (Texte / Liste) à la place de la zone de saisie permanente de l'Inbox et des barres « Nouvelle … » des onglets. |
| 12/10/2026 | Bouton + : Inbox ou un type ; page de création (Unique / Liste, nouvelle / existante, précisions). |
| 13/10/2026 | Retours bêta : + revient à Texte / Liste ; Ranger sans précisions ni aires ni icône ; poubelle sur les cartes Actions, Habitudes, Ressources ; « Copier la liste » ; barres du téléphone aux couleurs du thème affiché. |
| 13/10/2026 | App installée : barre de navigation Android en noir (couleurs du manifeste). |
| 13/10/2026 | Bouton « précédent » du téléphone : retour à l'onglet d'avant, fermeture des cartes et fenêtres ouvertes. |

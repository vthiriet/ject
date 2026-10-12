# Ject — Spécifications

> Document vivant : il est mis à jour à chaque nouvelle fonctionnalité ou optimisation.
> Dernière mise à jour : 12/10/2026 (version initiale, après le questionnaire de cadrage).

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

### 3.1 V1 : prototype complet

**Notes et listes**
- Notes texte (titre + contenu).
- Listes à cocher : les éléments cochés descendent en bas, dans une zone repliable.
- Liens cliquables avec aperçu (titre, image et site de la page liée).
- Couleurs de fond des notes (palette inspirée de Keep).

**Organisation**
- Épingler une note en haut.
- Libellés (étiquettes), **bien mis en avant** : filtre rapide en haut de l'écran
  et affichage des libellés sur chaque carte.
- Archiver une note.
- Corbeille : suppression définitive automatique après 7 jours, comme Keep.
- Recherche dans le titre, le contenu et les éléments de liste.
- Affichage en grille (mosaïque) ou en liste.
- Glisser-déposer pour réordonner les notes.

**Sortie des données**
- Copier une note dans le presse-papiers et utiliser le partage Android
  (« Partager vers… »).
- **Export vers Notion** d'une liste entière ou d'éléments choisis (voir §5).
- Export de toutes les données (sauvegarde) au format JSON et Markdown.

**Saisie rapide** (besoin n°1)
- À l'ouverture, l'app est immédiatement prête à écrire.
- Raccourcis sur l'icône Android (appui long) : « Nouvelle note » et « Nouvelle liste ».
- Ject apparaît dans le menu « Partager » d'Android : un lien ou un texte partagé
  depuis une autre app crée une note dans l'inbox.

**Technique**
- Fonctionne hors connexion, puis se synchronise au retour du réseau.
- Synchronisation entre le téléphone et l'ordinateur.
- Mode sombre : automatique (selon le système) ou choisi manuellement.

### 3.2 Gestion de projet (voir les questions ouvertes)

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

## 4. Choix techniques (proposition)

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

## 5. Export vers Notion

- Connexion par une **intégration interne Notion** : une clé secrète, créée une
  fois dans les réglages Notion et stockée dans Vercel. Elle n'est jamais visible
  dans le navigateur.
- Les appels à Notion passent par une route serveur Astro, car Notion refuse les
  appels directs depuis un navigateur.
- Depuis une liste, on peut :
  - exporter **la liste entière** ;
  - **sélectionner des éléments** puis les exporter.
- La destination exacte (page ou base de données Notion) et la correspondance des
  champs restent à préciser (voir les questions ouvertes).

## 6. Modèle de données (première version)

- **note** : id, type (`note` ou `liste`), titre, contenu, couleur, épinglée,
  archivée, supprimée le, position, projet, créée le, modifiée le.
- **element_liste** : id, note, texte, coché, position.
- **libelle** : id, nom, couleur ou emoji.
- **note_libelle** : lien entre une note et ses libellés (une note peut en avoir plusieurs).
- **projet** : id, projet parent, nom, description, statut.
- **tache** : id, projet, tâche parente, titre, statut, priorité, échéance, position.
- **export_notion** : id, note ou élément exporté, identifiant Notion, date
  (pour savoir ce qui a déjà été envoyé).

## 7. Questions ouvertes

1. Les projets et le Kanban sont-ils gérés **dans Ject**, ou **dans Notion** (Ject
   se limitant alors à l'inbox et à l'export) ?
2. Le projet fait-il partie du prototype V1 ?
3. Comment protéger l'accès aux données sans compte (voir §4) ?
4. Destination et format de l'export Notion.
5. Que recouvre « illustrations » ?

## 8. Historique

| Date | Changement |
|---|---|
| 12/10/2026 | Version initiale après le questionnaire de cadrage |

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
  élément à trier ; dans un autre onglet, la carte prend le type de l'onglet (et la catégorie
  filtrée). Une carte laissée vide est supprimée à la fermeture.
- Un élément = un texte ou une liste (liens cliquables avec aperçu).
- Toucher un élément l'ouvre pour le modifier (sans épingle ni archivage) ; corbeille
  avec « Annuler ».
- Le partage Android (« Partager › Ject ») et le raccourci « Ajouter à l'inbox » arrivent ici.
- Pastille sur l'onglet : nombre d'éléments à ranger.

**Ranger** : « Tout ranger » en haut de l'Inbox, ou le bouton « Ranger » de chaque carte (le
seul bouton visible). Les cartes défilent une par une (« Ranger · 2 / 7 ») ; le détail est
décrit en 3.0 bis. Chaque ligne d'une carte rangée dans une liste devient une case à cocher.

**Archiver** : glisser la carte vers la gauche (fond « Archiver » révélé) ; notification
« Archivée » avec « Annuler ».

**Sélection multiple** : appui long sur une carte (doigt ou souris). La carte est cochée dès
que l'appui long est reconnu, sans attendre de relâcher. Toucher une autre carte la coche ou
la décoche ; ✕ ou le bouton retour du téléphone quittent la sélection. Barre de sélection :
« N sélectionnées », « Fusionner » (dès 2 cartes : elles deviennent une liste, dans l'ordre
affiché, « Annuler » possible) et « Ranger » (une seule fenêtre « Ranger N cartes » : un type et
une destination pour toutes). Pas de glisser-déposer dans l'Inbox.

### 3.0 bis Onglets Actions, Habitudes, Projets, Ressources

Inspiré de GTD (que faire de chaque élément) et de PARA (où il vit), en version simplifiée.

**Onglets, dans l'ordre :** Inbox · Actions · Habitudes · Projets · Ressources.
Ils remplacent l'onglet « Listes ». Le menu ☰ garde les Catégories, les Archives, la Corbeille
et les Réglages.

**Cartes :** dans chaque onglet, une carte est soit un **élément seul** (note texte), soit
une **liste** (plusieurs éléments à cocher), comme dans Keep. Couleurs, illustrations et
export Notion restent disponibles partout. L'onglet où se trouve la carte donne son type.

**Catégories** (Santé, Maison, Finances…) : ce sont les libellés actuels, renommés. Une carte de
n'importe quel type peut appartenir à une ou plusieurs catégories. Une rangée de pastilles permet
de filtrer par catégorie dans chaque onglet.

**Par type :**

| Type | Exemples | Information propre |
|---|---|---|
| Action | « Prendre RDV dentiste » ; liste « Courses » | **Prioritaire** (flamme) ou non |
| Habitude | « Courir » ; liste « Routine du matin » | **Rythme**, objectif, à éviter, moment (voir 3.0 ter) |
| Projet | liste « Voyage Japon » (ses étapes) | Aucune (pas de statut) |
| Ressource | « Film : Dune 2 » ; liste « Films à voir » | Aucune |

Plus de statuts (à faire, en attente, un jour, fait, actif, terminé) dans Actions et Projets :
une case cochée = fait ; un projet fini s'archive.

**Type pressenti dans l'Inbox :** dans la carte d'un élément de l'Inbox, 4 pastilles
facultatives : Action · Habitude · Projet · Ressource. Sans choix, l'élément reste
« à trier ». Le type choisi s'affiche sur l'élément et est présélectionné au rangement.
Menu ⋮ › « Ranger dans… » range directement la carte telle quelle dans un onglet.

**Ranger :** pour chaque élément de l'Inbox :
1. choisir ou confirmer le **type** (prérempli si choisi à la saisie) ;
2. choisir la **destination** dans l'onglet correspondant : nouvelle carte, ajout à une
   liste existante, ou nouvelle liste.

Destinations proposées, dans l'ordre : « Carte seule dans … », puis la barre de recherche
(qui propose « Nouvelle liste « nom » ») et les listes existantes de ce type (les plus récentes d'abord, avec recherche). Pas de réglage
d'état, de régularité ni de catégorie au rangement : ils se règlent ensuite dans la carte.

**Affichage par onglet :** Actions est découpé en sections À faire (listes et actions
seules) / En attente / Un jour / Faites ; Projets en Actifs / Un jour ; un projet
« Terminé » part dans les Archives (et redevient actif si on le désarchive). Les états et
régularités s'affichent sur les cartes (⏳ En attente, 💤 Un jour, 🔁 Chaque jour…).

**Cartes :** sur chaque carte (Inbox, Actions, Projets, Ressources) et dans la fiche d'une
habitude, une **coche ✓ « Archiver »** remplace la poubelle : la carte part dans les
Archives (« Annuler » possible). Dans les **Archives**, chaque carte propose
**Désarchiver** et **Supprimer** (corbeille, vidée après 7 jours).

**Bouton « précédent » du téléphone :** il revient à l'onglet affiché avant, et referme
d'abord ce qui est ouvert (carte — enregistrée comme avec ←, Ranger, Réglages, menu ☰,
menu du +). Sur le premier écran, il quitte l'app.

**Glisser-déposer** (Actions, Projets, Ressources ; appui long sur téléphone) :
lâcher une carte **au centre** d'une autre les fusionne en une liste (cadre jaune « Fusionner
en liste », « Annuler » possible) ; lâcher sur un **bord** la déplace avant ou après (pas dans
l'Inbox, triée par date).

**Éléments d'une liste** : dans une carte liste ouverte, la poignée ⋮⋮ à gauche de chaque
élément non coché permet de le glisser plus haut ou plus bas.

**Priorité des actions** (un seul niveau, depuis le 20/10/2026) : dans une action ouverte, la
flamme en haut à droite (à la place de l'épingle) la rend **« Prioritaire »** ; un second appui
retire la priorité ; message avec « Annuler ». **Depuis la liste** : au doigt, glisser une action
**vers la gauche** la rend prioritaire (ou retire la priorité) ; à la souris, une flamme
apparaît au survol de la carte. Astuce affichée une seule fois en haut d'Actions (au toucher).
Attention : dans l'Inbox, le même geste archive. Sur la liste, pas de bouton visible : une petite flamme
corail devant le texte des actions prioritaires, rassemblées dans la section « Prioritaires »
en haut, puis « Autres ». La carte change de section à la fermeture, jamais sous le doigt.
Les anciennes priorités 1 et 2 sont devenues « Prioritaire », la 3 une action normale.

**Saisie** : pas de champ titre pour un texte (sauf s'il en avait déjà un) ; bouton
**« Ajouter »** (nouvelle carte) ou **« OK »** en haut à droite pour valider, avec le message
« Ajouté à l'inbox » / « Ajouté ». Dans l'Inbox, pas de catégories ni d'export Notion. Le zoom de
l'app est désactivé.

**Éditeur :** sous le titre, le type de la carte et son réglage (état, régularité).
Une liste ouverte affiche un bouton **« Copier la liste »** (titre et éléments ☐ / ☑). Dans
une liste, chaque élément a un bouton ⏳ (ou 🔁 pour une habitude) pour régler son état
ou sa régularité. Menu ⋮ › « Déplacer vers… » pour changer de type.

**Données existantes :** les notes et listes créées avant cette version sont classées dans
**Ressources**. Les libellés deviennent les **catégories**. Le réglage « À l'ouverture de Ject »
est retiré : Ject s'ouvre toujours sur l'Inbox. Raccourcis Android : « Ajouter à
l'inbox » et « Actions ».

### 3.0 ter Onglet Habitudes (incitatif)

**Réglages d'une habitude** (dans la carte ouverte) :
- rythme : chaque jour · certains jours (lun…dim) · X fois par semaine · chaque semaine ·
  X fois par mois · chaque mois (jour conseillé facultatif) · X fois par an · chaque année ;
- objectif affiché facultatif (« 160 g », « 7 000 pas ») ;
- « à éviter » : cocher = période tenue ;
- moment facultatif (matin, journée, soir) ;
- « pas le week-end » pour une habitude quotidienne.
- Une carte **liste** est une **routine** : on coche ses étapes ; toutes cochées = une fois
  faite, et les étapes se décochent pour la fois suivante.
- Les semaines commencent le lundi ; les années le 1er janvier.
- **Remise à zéro automatique** : chaque coche est enregistrée à sa date. Une habitude
  quotidienne cochée aujourd'hui apparaît décochée le lendemain ; les compteurs repartent
  à 0 le lundi (semaine), le 1er du mois (mois) et le 1er janvier (année). L'historique est
  conservé.

**Affichage, par rythme** :
- **Aujourd'hui** : habitudes quotidiennes du jour, en simple rappel. Case facultative qui
  barre l'habitude pour la journée ; la toucher à nouveau la décoche.
- **Cette semaine** / **Ce mois-ci** / **Cette année** : bouton « +1 » en un geste, barre de progression
  « 2 / 3 », message d'encouragement (« Plus qu'une fois cette semaine ! », « Il reste
  2 jours pour 3 fois : on s'accroche ! »). Une fois l'objectif atteint, la carte descend en
  bas, barrée.
- **Pas aujourd'hui** (jour non concerné) et **En pause**, en bas.
- Habitude quotidienne : rond de 44 px ; faite = pastille corail avec une étoile (la toucher
  décoche). Habitude comptée : bouton rond « + » ; objectif atteint = pastille étoile ; une
  étoile par fois prévue (jusqu'à 7, au-delà une barre). L'étoile rebondit quand c'est fait.
- **Corriger une erreur** : « Annuler » dans la notification, ou « Retirer » dans la fiche
  détaillée (pas de bouton −1 sur la carte, décision 53).

**Motivation** :
- Chaque section (Aujourd'hui, Cette semaine, Ce mois-ci, Cette année) a sa barre de
  progression « X / Y » : habitudes tenues sur habitudes de la section.
- Pas de points ni de niveaux (retirés le 19/10/2026).
- Pas de série 🔥 ni de records (choix explicite).

**Bilans** (toucher l'en-tête d'une section, signalé par ›) :
- Aujourd'hui → bilan des quotidiennes : **Semaine** (grille de pastilles par habitude et par
  jour), **Mois** (calendrier, plus la case est corail plus les habitudes du jour sont tenues),
  **Année** (12 barres, une par mois).
- Cette semaine → bilan des hebdomadaires : **Mois** (une étoile par semaine, « 2/3 ») et
  **Année** (12 barres : part des semaines tenues).
- Ce mois-ci → bilan des mensuelles : **Année** (une ligne d'étoiles par habitude, « 8 / 10 »).
- En tête, un seul chiffre (taux ou « tenues / comptées »), sans comparaison en points avec la
  période précédente ; en dessous, « Par habitude ». Flèches ‹ › pour remonter dans le temps
  (pas au-delà de la période en cours).
- Ne comptent pas : les pauses, les jours non concernés, l'avant-création et l'avenir ; la
  période en cours ne compte que si elle est déjà tenue.

**Fiche détaillée** (toucher une habitude) : avancement, % de réussite (4 dernières semaines,
3 derniers mois ou 3 dernières années ; la période en cours ne compte que si elle est réussie ; les périodes en
pause sont ignorées), historique en barres, **corriger un jour** (n'importe quel jour passé, même ancien : « − » / « + » pour retirer ou ajouter une ou plusieurs fois), liste de tous les jours cochés (« Retirer une fois », avec « Annuler » ; 7 derniers jours, puis « Voir les autres »), **pause** jusqu'à
une date / « Reprendre », « Modifier », « Supprimer ».

**Rappels par notification** (habitudes de la semaine, du mois, de l'année ; pas les
quotidiennes) :
- date fixée (« chaque mois, le N ») : un rappel ce jour-là ; sinon début, milieu et veille de
  la fin de la période (semaine : lundi, jeudi, samedi ; mois : le 1er, le 15, l'avant-dernier
  jour ; année : 1er janvier, 1er juillet, 1er décembre) ;
- heure selon le moment : matin 9 h, journée 12 h, soir 18 h, sinon 9 h ;
- rien si l'habitude est déjà tenue sur la période, en pause ou archivée ; « à éviter » :
  seulement en fin de période (« As-tu tenu … ? ») ;
- une notification par heure : le détail pour une habitude (avec bouton « +1 », compté sans
  ouvrir Ject), un résumé « N habitudes à faire » pour plusieurs ;
- interrupteur « Rappels par notification » dans les réglages de chaque habitude ; activation,
  arrêt et essai dans Réglages › Rappels des habitudes ;
- technique : abonnement Web Push enregistré dans Supabase (`ject_push`), envoi par
  `/api/notify` appelé toutes les heures par une tâche Supabase (pg_cron), sans doublon
  (`ject_push_sent`). Installation : docs/INSTALLATION.md, étape 7.

**Pause générale** (vacances, maladie) : depuis l'en-tête, met toutes les habitudes en pause
jusqu'à une date ; les jours de pause ne comptent pas.

### 3.1 V1 : prototype complet

**Notes et listes**
- Notes texte (titre + contenu), transformables en liste et inversement.
- Listes à cocher : les éléments cochés descendent en bas, dans une zone repliable.
- Liens cliquables avec aperçu (titre, image et site de la page liée).
- Couleurs de fond des notes (palette inspirée de Keep, 11 couleurs).
- **Illustration de fond** (en filigrane, dans le coin bas droit de la carte, sous le texte ; décision 56) : une galerie intégrée de
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

### 3.x Charte graphique et design system

Identité propre à Ject (« léger, ludique, motivant »), conçue avec Claude Design. **Font foi** :
`docs/DECISIONS.md` (décisions numérotées), `CONTEXT.md` (lexique : « carte », « élément ») et
le dossier `design_handoff_charte_ject/` (maquettes, `tokens.css`, README de la refonte).

- Variables de la charte : `src/styles/tokens.css` (copie de `tokens.css`, clair et sombre).
  `src/styles/colors.css` fait le pont avec les anciens noms de variables, en attendant la fin
  de la refonte.
- Accent corail `#FF6A55` (seule couleur pleine) ; 7 couleurs de cartes : Papier, Soleil, Pêche,
  Pistache, Lagon, Ciel, Lilas. Les anciennes couleurs (Keep) s'affichent avec la plus proche.
- Polices hébergées dans l'app : Bricolage Grotesque (600, 800 : titres, boutons) et Figtree
  (400, 600, 700 : texte). Échelle de 6 tailles, aucune sous 13 px.
- Icônes Phosphor (au trait, pleines quand actives).
- Animations « rebond » : case cochée et étoile d'habitude (450 ms), compteur qui grossit
  (400 ms), nouvelle carte avec un ressort (380 ms), point du logo qui saute. Si le téléphone
  demande moins d'animations : simples fondus de 150 ms. Focus clavier : anneau de 3 px.
- Logo « ject. » (`public/icons/logo.svg`, version sombre `logo-sombre.svg`) et icône de
  l'application « j. » (fond corail, point crème), dessinés en vectoriel depuis Bricolage
  Grotesque 800.
- Refonte faite en 7 étapes (19/10/2026) : 1. fondations (couleurs, polices, icônes) ;
  2. navigation ; 3. cartes et éditeur ; 4. Inbox et rangement ; 5. Habitudes ; 6. Réglages,
  Notion, messages et textes ; 7. animations et finitions.

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
  (id, texte, coché, mention d'export), couleur, illustration (`emoji:<emoji>` ou
  `img:<id>`), épinglée, archivée, mise à la corbeille le, position, libellés,
  mention d'export Notion, type (`category`), état, réglages d'habitude (`habit`), journal
  des fois faites par jour (`habitLog`), pauses (`habitPauses`), étapes cochées
  (`habitSteps`), créée le, modifiée le.
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

- Inbox : « Coller une liste » (chaque ligne collée devient un élément distinct).
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
| 12/10/2026 | Réglages › Diagnostic : version chargée, état de la base locale, essai d'ajout, dernières erreurs. |
| 12/10/2026 | Base du navigateur bloquée : délai maximal de 4 s, message explicatif au démarrage et dans le diagnostic. |
| 12/10/2026 | Bouton + (Texte / Liste) à la place de la zone de saisie permanente de l'Inbox et des barres « Nouvelle … » des onglets. |
| 12/10/2026 | Bouton + : Inbox ou un type ; page de création (Unique / Liste, nouvelle / existante, précisions). |
| 13/10/2026 | Retours bêta : + revient à Texte / Liste ; Ranger sans précisions ni aires ni icône ; poubelle sur les cartes Actions, Habitudes, Ressources ; « Copier la liste » ; barres du téléphone aux couleurs du thème affiché. |
| 13/10/2026 | App installée : barre de navigation Android en noir (couleurs du manifeste). |
| 13/10/2026 | Bouton « précédent » du téléphone : retour à l'onglet d'avant, fermeture des cartes et fenêtres ouvertes. |
| 13/10/2026 | Texte agrandi dans une carte ouverte (titre 27 px, texte et éléments de liste 21 px, cases plus grandes). |
| 13/10/2026 | Ranger : « Carte seule » en premier, puis la recherche et les listes existantes. |
| 13/10/2026 | Poubelle des cartes à droite et centrée : même hauteur que les cartes Projets. |
| 13/10/2026 | Poubelle ajoutée aussi sur les cartes Projets. |
| 17/10/2026 | Habitudes incitatives : rythmes détaillés, +1 en un geste, progression, encouragements, points et niveaux, routines à étapes, fiche détaillée, rattrapage, pauses. |
| 17/10/2026 | Retours : glisser une carte au centre d'une autre pour fusionner en liste (bord = déplacer) ; priorité des actions (flamme 3/2/1) ; statuts retirés d'Actions et Projets ; Inbox sans aires ni export ; pas de zoom ; pas de titre pour un texte ; bouton « Ajouter » / « OK » dans une carte. |
| 17/10/2026 | Flammes de priorité numérotées (1, 2, 3) ; tri rouge → orange → jaune → gris. |
| 17/10/2026 | Coche « Archiver » à la place de la poubelle sur les cartes ; suppression depuis les Archives. |
| 17/10/2026 | Glisser-déposer des éléments au sein d'une liste (poignée ⋮⋮) ; Inbox : sélection multiple (appui long ou « Sélectionner ») pour ranger plusieurs éléments au même endroit. |
| 17/10/2026 | Inbox : l'appui long coche l'élément sans attendre que le doigt se lève. |
| 19/10/2026 | Habitudes : section « Cette année » (X fois par an, chaque année) ; bouton « −1 » pour corriger une erreur ; points et niveaux retirés, barre de progression dans chaque section. |
| 19/10/2026 | Refonte, étape 1 : couleurs, polices (Bricolage Grotesque, Figtree) et icônes (Phosphor) de la charte Ject ; 7 couleurs de cartes. |
| 19/10/2026 | Refonte, étape 2 : onglets dans une barre en bas ; bande du haut (menu, titre, recherche repliée, bouton « Aires ») ; tiroir (Archives, Corbeille, Aires, Réglages, affichage, synchro) ; le + ouvre directement une carte texte. |
| 19/10/2026 | Refonte, étape 3 : éditeur (× / « Ajouter » pour une nouvelle carte, ← seule sinon ; barre Liste, Couleur et illustration, Aires, Plus ; export Notion dans Plus) ; cases à cocher de la charte ; 7 pastilles de couleur ; illustrations = aplat + emoji incliné, créables (emoji + couleur), plus d'import d'image (les images déjà importées restent affichées). |
| 19/10/2026 | Refonte, étape 4 : Inbox avec un seul bouton « Ranger » par carte ; glisser vers la gauche pour archiver ; appui long = sélection seulement (plus de glisser-déposer dans l'Inbox), avec « Fusionner » et « Ranger » ; « Tout ranger » ; « Supprimer » en contour framboise. |
| 19/10/2026 | Refonte, étape 5 : Habitudes avec rond / étoile corail, bouton « + », une étoile par fois prévue ; « −1 » et éclats d'emoji retirés (corriger via « Annuler » ou « Retirer ») ; icône pause. |
| 19/10/2026 | Refonte, étape 6 : « Réglages » partout ; erreurs inattendues = message rassurant + « Voir le détail » (journal des erreurs dans Réglages › Diagnostic) ; export Notion sans connexion : bouton « Se connecter » ; restauration d'une sauvegarde sans confirmation (« N cartes ajoutées ») ; textes au lexique « carte », plus d'emoji dans l'interface. |
| 19/10/2026 | Refonte, étape 7 : animations (rebond, ressort, compteur, point du logo), fondus si moins d'animations ; logo et icône de l'application en vectoriel. |
| 20/10/2026 | Mémoire du navigateur bloquée : rechargement automatique une fois, puis message qui reste affiché avec « Réessayer » ; « Chargement… » au lieu d'un écran vide. Habitudes : ordre stable (cocher ne déplace plus la carte), trié par moment (matin, journée, soir) ; à la création, le nom d'abord, puis les réglages. |
| 20/10/2026 | Habitudes : corriger n'importe quel jour passé dans la fiche (« − » / « + »), liste de tous les jours cochés avec « Retirer une fois ». |
| 20/10/2026 | Actions : priorité ramenée à un seul niveau « Prioritaire » (flamme dans la carte ouverte, à la place de l'épingle) ; section « Prioritaires » ; plus de flamme grise sur chaque carte ; coche « Archiver » de 44 px ; anciennes priorités 1 et 2 → Prioritaire, 3 → normale. |
| 20/10/2026 | Actions : glisser une action vers la gauche = Prioritaire (au doigt) ; flamme au survol à la souris ; astuce affichée une fois. |
| 20/10/2026 | Rappels des habitudes par notification (début, milieu, veille de la fin, ou jour fixé ; 9 h / 12 h / 18 h ; pas si déjà tenue ; bouton « +1 »). |
| 21/10/2026 | Les « aires » s'appellent désormais « catégories » ; éléments cochés toujours visibles (barrés) dans les listes, sur la carte et dans la carte ouverte. |
| 21/10/2026 | Un élément coché passe en tête des éléments cochés (décoché : retour à la fin des éléments à faire) ; sélecteur de tous les emoji avec recherche en français pour créer une illustration. |
| 21/10/2026 | Bilans des habitudes : toucher l'en-tête d'une section (›) ouvre son bilan (quotidiennes : semaine, mois, année ; hebdomadaires : mois, année ; mensuelles : année). |
| 29/10/2026 | Illustration en filigrane : l'emoji passe en fond de la carte (coin bas droit, pâle) au lieu d'un bandeau au-dessus ; la carte ne grandit plus. Titre des cartes : coupure avec trait d'union au lieu d'une coupure au milieu d'un mot. |
| 29/10/2026 | Illustration = un emoji seul, sans couleur propre : la couleur est celle de la carte. « Autre emoji » applique l'emoji choisi directement ; vignettes de la galerie sur la couleur de la carte. Les cartes « Papier » existantes prennent une fois la couleur de leur ancienne illustration. |
| 29/10/2026 | Connexion : si l'envoi du lien échoue, la raison est notée dans Diagnostic ; message dédié quand trop de liens ont été demandés. |

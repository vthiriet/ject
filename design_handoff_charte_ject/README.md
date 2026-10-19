# Handoff : charte graphique, design system et revue UX de Ject

## Overview
Ject est une application web mobile (PWA) personnelle de prise de notes et d'organisation (inspirée des gestes de Google Keep). Cette livraison remplace l'apparence actuelle, empruntée à Keep, par une identité propre (« léger, ludique, motivant »), fournit un design system complet en clair et en sombre, et applique une revue UX en trois priorités : **noter vite > ranger > tenir ses habitudes**, plus les Réglages et l'export Notion.

Source des décisions : `docs/DECISIONS.md` (54 décisions numérotées). Lexique : `CONTEXT.md`. En cas de doute, ces deux fichiers font foi.

## Règles de travail dans le dépôt
- Dépôt : `vthiriet/ject`.
- **Créer une branche `design` à partir de `preview`.** Ne jamais pousser directement sur `preview` ni sur `main`.
- Copier `docs/DECISIONS.md` et `CONTEXT.md` à la racine du dépôt (mêmes chemins).

## About the Design Files
Les fichiers `.dc.html` de ce dossier sont des **références de design créées en HTML** : des maquettes qui montrent l'apparence et le comportement voulus, pas du code de production à copier. La tâche est de **les recréer dans le code existant** (React + TypeScript, Vite, Dexie, dnd-kit, Supabase), en suivant ses conventions. Ouvrir les fichiers dans un navigateur, avec `support.js` à côté et une connexion internet (polices et icônes chargées depuis des CDN pour les maquettes uniquement).

## Fidelity
**Haute fidélité** : couleurs, typographie, espacements, arrondis et états sont définitifs. Les recréer au pixel près. Exceptions : le logo et l'icône d'application sont des esquisses typographiques à redessiner en vectoriel.

## Design Tokens
Toutes les valeurs sont dans **`tokens.css`** (variables CSS clair + sombre). À intégrer dans `src/styles/` en remplacement de `colors.css` et des valeurs codées en dur.
- **Couleurs** : voir `tokens.css`. Seul le corail `#FF6A55` est plein à l'écran (bouton +, bouton principal, cases cochées, pastilles d'habitude). Texte/icônes posés sur le corail : `#2B0A05`.
- **Typographie** : Bricolage Grotesque (600, 800) pour logo, titres, titres de carte, boutons ; Figtree (400, 600, 700) pour le reste. 6 tailles seulement : 13 · 15 · 17 · 20 · 26 · 34 px. **Aucun texte sous 13 px.**
- **Espacements** : grille de 4 : 4 · 8 · 12 · 16 · 24 · 32. Carte : marge intérieure 12, écart entre cartes 12, écart interne 4. Page : marge 16.
- **Arrondis** : 6 (case) · 12 (champ, bouton) · 18 (carte) · 28 (fenêtre, bouton +) · 999 (filtres).
- **Ombres** : aucune sur les cartes. Bouton + : `0 6px 16px rgba(0,0,0,.2)`. Ligne en déplacement : `0 4px 12px rgba(0,0,0,.18)`.
- **Polices** : héberger dans l'app (sous-ensemble latin, graisses ci-dessus, `font-display: swap`, repli aux métriques ajustées). Emoji du contenu : Noto Color Emoji (Google Fonts, chargé par morceaux).
- **Icônes** : Phosphor, importées une par une en SVG (paquet `@phosphor-icons/react`), au trait par défaut, version pleine quand active. Remplacent `Icon.tsx` (Material).

## Screens / Views

### 1. Écran principal (App.tsx)
- **En haut, une seule bande** (hauteur ~56) : bouton menu (40 × 40) · titre de l'onglet (Bricolage 600, 20 px) · espace · icône recherche (s'ouvre en champ au toucher) · bouton « Aires » (icône entonnoir + libellé 13 px) qui ouvre le filtre des aires.
- **En bas, barre de 5 onglets** (fond `--barre-nav`, padding 10/2/14) : Inbox `tray-arrow-down`, Actions `check-circle`, Habitudes `star`, Projets `flag`, Ressources `bookmark-simple`. Chaque onglet : pastille 52 × 32 (arrondi 16) + libellé 13 px. Actif : pastille `--corail-doux`, icône pleine `--corail-texte`, libellé `--onglet-actif` gras 700. Inactif : `--texte-discret`, 500. Compteur de l'Inbox : pastille corail de 20 px de haut (arrondi 10, largeur minimale 20, padding horizontal 5, qui s'élargit en gélule dès 2 chiffres), posée en haut à droite de la pastille d'onglet (top −6 px), chiffre Figtree 13 px gras `#2B0A05`. Aucune exception au plancher de 13 px.
- **Tiroir** (Drawer.tsx) : Archives, Corbeille, Aires, Réglages, Affichage grille/liste, état de synchro. Lignes de 44 px.
- **Bouton +** (Fab.tsx) : 60 × 60, arrondi 28, bas-droite, 16 px au-dessus de la barre d'onglets. **Un appui ouvre directement une carte texte** (plus de menu Texte/Liste).
- **Fond de page** `--fond`. Cartes posées dessus sans bordure ni ombre.

### 2. Carte (NoteCard.tsx)
Fond = couleur de carte (7 couleurs, noms : Papier, Soleil, Pêche, Pistache, Lagon, Ciel, Lilas). Titre Bricolage 600 17 px `--encre`, texte Figtree 15 px `--texte`, métadonnées 13 px `--texte-discret`. Épinglée : icône punaise pleine `--corail-texte`. Sélectionnée : rond encre 22 px avec coche + anneau de focus.
**Illustration** : aplat de la couleur + emoji Noto incliné ±12°, taille `clamp(64px, 45cqw, 96px)` (carte en `container-type: inline-size`), débordement ~15 %, hauteur de bandeau 84–92 px. L'utilisateur crée une illustration en choisissant un emoji et une couleur (pas d'import d'image).

### 3. Éditeur (NoteEditor.tsx)
- **Barre du haut** — nouvelle carte : × à gauche, bouton principal « Ajouter » à droite. Carte existante : flèche ← seule (enregistrement automatique), puis épingler et archiver à droite. Une carte vide fermée est supprimée sans message.
- **Barre du bas, au-dessus du clavier** : bouton « Liste » (bascule texte ↔ liste ; les lignes déjà tapées deviennent des éléments ; actif : fond `--corail-doux`, libellé `--onglet-actif`) · Couleur et illustration · Aires · espace · Plus. **L'export Notion n'est que dans le menu Plus.**
- Texte d'aide du champ : « Écris ici… ».

### 4. Élément de liste
Case 18 × 18, arrondi 6. Vide : contour 2 px `--contour-case`. Cochée : fond corail + coche Phosphor bold 12 px `#2B0A05`. **Zone tactile de 32 × 32** ; lignes de 32 px. Toucher le texte le modifie (ne coche pas). Poignée `dots-six-vertical`, bouton × pour supprimer.

### 5. Inbox (InboxView.tsx)
- Chaque carte : un seul bouton visible **« Ranger »** (icône dossier + libellé 13 px, contour 1 px `--contour-champ`, hauteur 40).
- **Archiver = glisser la carte vers la gauche** (fond révélé `--piste`, icône archive + « Archiver »), notification « Archivée » avec « Annuler ». La coche n'archive plus.
- **Appui long = sélection uniquement** (plus de glisser-déposer ni de fusion par geste dans l'Inbox). Barre de sélection : × · « N sélectionnées » · « Fusionner » (dès 2) · « Ranger » (principal).
- En-tête : « N cartes à ranger » + « Tout ranger ».

### 6. Panneau de rangement (FileDialog.tsx)
Inchangé dans sa logique (1. C'est… / 2. Ranger dans…). « Supprimer » devient un bouton contour framboise (`--erreur`, 2 px).

### 7. Habitudes (HabitCard, HabitSheet, HabitSummary)
- **Quotidienne** : rond 44 px. À faire : contour 2 px `--contour-case`. Faite : pastille corail pleine + étoile Phosphor pleine `#2B0A05`.
- **Comptée** (semaine/mois/année) : bouton rond 44 px au contour avec « + » (ajoute une fois) ; quand l'objectif est atteint, il devient la pastille étoile. Progression : une étoile de 22 px par fois prévue (vide → pleine) **jusqu'à 7** ; au-delà, barre de progression (8 px, `--piste`, remplissage corail). Message d'encouragement 13 px.
- **Supprimer** : l'éclat d'emoji (✓ ✨ 🎉) et le bouton « −1 » de la carte. Corriger via « Annuler » (notification) ou « Retirer » (fiche).
- Fiche : « Archiver » avec l'icône archive ; ⏸ remplacé par l'icône Phosphor `pause`. Pas de série de jours d'affilée.

### 8. Réglages (Settings.tsx) et export Notion (NotionExport.tsx)
- L'écran s'appelle **« Réglages »** partout.
- Export Notion sans connexion : bouton « Se connecter » qui ouvre les Réglages.
- Restauration d'une sauvegarde : s'ajoute à l'existant, sans confirmation ; notification « N cartes ajoutées ».
- Section Diagnostic : afficher aussi le journal des erreurs (`logError`).

## Interactions & Behavior
- **Cocher** (case ou habitude) : rebond `scale .3 → 1.3 → .92 → 1`, 450 ms, `cubic-bezier(.3,1.6,.5,1)`.
- **Compteur / progression** : grossit à 1.25 puis revient, 400 ms.
- **Nouvelle carte** : apparaît avec un ressort (`scale .6 + translateY 30px → 1.05 → 1`), 380 ms.
- **Logo** : le point corail saute à chaque nouvelle carte (650 ms).
- **Pas de confettis.**
- **Mouvement réduit** (`prefers-reduced-motion`) : tout devient un fondu d'opacité de 150 ms.
- **Focus clavier** : `:focus-visible`, anneau 3 px `--focus`, décalé de 3 px. Jamais au toucher.
- **Suppression** : toujours un bouton contour framboise, jamais plein.
- **Erreurs inattendues** : notification « Un souci est survenu, tes cartes sont en sécurité. » + lien « Voir le détail » (journal `logError`). Plus de « Erreur : <message technique> » brut.
- **Notification temporaire** : fond `--notif-fond`, texte `--notif-texte` 15 px, action en `--notif-action` gras, hauteur 48, arrondi 12.

## Contenus à modifier (textes)
- « Créer une note… » → « Écris ici… »
- « Note archivée / désarchivée » → « Carte archivée / désarchivée » ; « Archivée ✓ » / « Archivé ✓ » → « Archivée »
- « Note placée dans la corbeille » → « Carte placée dans la corbeille »
- « Restaure la note pour la modifier » → « Restaure la carte pour la modifier »
- « Supprimer définitivement cette note ? » → « … cette carte ? » ; « Les notes de la corbeille… » → « Les cartes … »
- « Note copiée » → « Carte copiée » ; « Note Ject » → « Carte Ject »
- « Ajouté à ton inbox » → « Ajouté à ton Inbox »
- Inbox : « élément(s) à ranger » → « carte(s) à ranger » ; « Ranger cet élément » → « Ranger cette carte » ; « Ranger N éléments » → « Ranger N cartes » ; « N éléments rangés/supprimés » → « N cartes rangées/supprimées »
- Habitudes : « Routine terminée 🎉 » → « Routine terminée » ; « Habitude archivée ✓ » → « Habitude archivée »
- Réglages / Notion : « Paramètres » → « Réglages » ; « notes » → « cartes » (statut de synchro, import, Notion) ; fichier `ject-notes-….md` → `ject-cartes-….md` ; 📬, 📄, ☰ → icônes
- Composant `NoteCard` à renommer `Card` (lexique : « note » est abandonné).
- **Aucun emoji dans l'interface** ; les emoji ne viennent que du contenu de l'utilisateur (aires, illustrations).

## State Management
Pas de nouvel état métier. Changements locaux :
- Fab : supprimer l'état `open` du menu ; `onPick` → `onNew()` (carte texte).
- NoteEditor : action « Liste » = `convert()` existant, exposée dans la barre du bas.
- InboxView : retirer `onMerge` du glisser ; ajouter une action « Fusionner » sur la sélection (réutiliser `mergeNotes` en chaîne, annulable via `restoreNotes`) ; ajouter le glisser horizontal pour archiver.
- HabitCard : nouvel affichage des étoiles (`p.count`, `p.goal`) ; bouton « + » / étoile selon `p.done`.

## Accessibilité (WCAG 2.2 AA)
Tous les textes ≥ 4,5:1 (valeurs vérifiées dans les deux thèmes) ; contours de cases ≥ 3:1 ; zones tactiles ≥ 24 px (32 pour les cases, 44 pour les boutons) ; nom accessible (`aria-label`) sur chaque pastille de couleur ; icône toujours accompagnée d'un texte dans les messages.

## Assets
- Polices : Bricolage Grotesque, Figtree, Noto Color Emoji (Google Fonts, licence OFL).
- Icônes : Phosphor Icons (licence MIT).
- Logo « ject. » et icône d'application « j. » : esquisses, à dessiner en SVG (icône : fond corail `#FF6A55`, « j » `#2B0A05`, point crème `#FBFAF8` ; logo : « ject » `#1F1B18` + point `#FF6A55`, crème sur fond sombre).

## Files
- `tokens.css` — variables à intégrer.
- `docs/DECISIONS.md` — les 54 décisions (fait foi).
- `CONTEXT.md` — lexique.
- `Design System Ject.dc.html` — fondations + 15 composants, clair et sombre.
- `Charte Ject v2.dc.html` — charte (logo, couleurs, typographie, icônes, illustrations, animations).
- `UX 01 Creer une carte Ject.dc.html` (piste B2), `UX 02 Fermer editeur Ject.dc.html` (F2), `UX 03 Haut ecran Ject.dc.html` (H3), `UX 04 Ligne Inbox Ject.dc.html` (R2), `UX 05 Habitude comptee Ject.dc.html` (C3) — maquettes des choix retenus (la piste retenue est indiquée entre parenthèses ; les autres sont des alternatives écartées).
- `Animations Ject.dc.html` — démonstration interactive des animations (piste 15b).
- `support.js` — nécessaire pour ouvrir les maquettes.

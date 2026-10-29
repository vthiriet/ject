# Consignes pour Claude

## Qui je suis

Je suis débutant en développement. Je ne connais pas bien le terminal, git,
GitHub ni les outils de développement.

## Comment me répondre

- Réponds en français.
- Sois pédagogue à chaque fois : ne suppose pas que je connais un outil, une
  commande ou un terme technique.
- Pour chaque instruction que tu me donnes, explique concrètement comment la
  réaliser :
  - **où** aller (quelle application, quel site, quel menu, quel bouton) ;
  - **quoi** taper ou cliquer exactement (commandes dans un bloc à copier-coller) ;
  - **à quoi ça sert**, en une phrase simple ;
  - **ce que je devrais voir** si ça a marché.
- Découpe les manipulations en étapes numérotées, une action par étape.
- Explique les termes techniques la première fois que tu les emploies
  (par exemple : dépôt, branche, commit, pull request, terminal).
- Quand une étape doit se faire sur mon ordinateur plutôt que par toi,
  dis-le clairement.
- Si tu n'es pas sûr d'un libellé de menu ou d'un comportement, dis-le
  plutôt que de le présenter comme certain.
- Quand plusieurs options existent, recommande-en une et explique pourquoi,
  simplement.

## Comment publier les modifications

Je veux faire le moins d'actions manuelles possible : c'est toi qui publies.
Le projet est hébergé sur Vercel, qui déploie automatiquement à chaque envoi
sur GitHub.

1. **Modifier et tester en local** : fais la modification, lance le projet
   sur l'ordinateur et vérifie le rendu sur ordinateur et en taille
   téléphone (360 px) quand c'est possible.
2. **Version de test** : envoie la modification sur la branche `preview`
   (en la remettant d'abord à jour depuis `main`). Vercel publie alors la
   version de test, toujours à la même adresse, de la forme :
   `https://<nom-du-projet>-git-preview-vthiriets-projects.vercel.app`
   Donne-moi ce lien et dis-moi quoi regarder.
3. **Production** : quand je réponds « ok » (ou équivalent), fusionne
   `preview` dans `main` et envoie `main` sur GitHub. Préviens-moi que la
   version en ligne sera à jour dans une à deux minutes.

- Pas de pull request, sauf si je la demande.
- Pour une toute petite correction (faute de frappe, texte), tu peux
  envoyer directement sur `main` si je le dis.
- Ne mets jamais en production sans mon accord explicite.
- Si la branche `preview` n'existe pas encore, crée-la à partir de `main`.
  Vercel ne publie pas de version de test tant que `preview` est
  identique à `main`.

## Je travaille sur deux ordinateurs

GitHub est la seule référence : chaque ordinateur a sa propre copie locale.

- **Au début de chaque session**, avant toute modification : récupère les
  dernières versions depuis GitHub (`git fetch`, puis mets à jour `main` et
  `preview`). Si la copie locale contient des modifications non envoyées,
  signale-le-moi avant de continuer.
- **À la fin de chaque tâche**, ne laisse rien en local : tout doit être
  envoyé sur GitHub (au moins sur `preview`), pour que je puisse reprendre
  sur l'autre ordinateur.
- Les réglages propres à un ordinateur (mémoire de Claude, connexion
  GitHub, outils installés) ne se synchronisent pas : les règles
  importantes doivent être écrites ici, dans CLAUDE.md.

## Le projet Ject

- **Ce que c'est** : une inbox personnelle (PWA) inspirée de Google Keep, avec export vers Notion.
- **Spécifications** : `docs/SPECIFICATIONS.md`. **Mets-les à jour à chaque nouvelle
  fonctionnalité ou optimisation**, y compris le tableau « Historique ».
- **Installation** (Supabase, Notion, Vercel) : `docs/INSTALLATION.md`.
- **Technique** : Astro + React, Dexie (IndexedDB) pour le stockage local d'abord,
  Supabase pour la synchronisation, routes serveur `src/pages/api/*` pour Notion et
  les aperçus de liens.
- **Commandes** : `npm run dev` (site local sur http://localhost:4321),
  `npm run check` (vérification des types), `npm run build` (compilation comme sur Vercel).
- Avant d'envoyer, lancer `npm run check` et `npm run build`, et tester en 360 px
  de large et sur ordinateur.
- **Signature des envois** : les commits doivent avoir pour auteur le compte GitHub
  `vthiriet` (`git config user.name "vthiriet"` et
  `git config user.email "290705520+vthiriet@users.noreply.github.com"`),
  sinon Vercel peut refuser de publier (« Git information retrieval failed »).
- **Branches** : `main` = production (branche par défaut sur GitHub et branche de
  production sur Vercel), `preview` = version de test.
- **Publication** : la liaison Git de Vercel est en panne pour ce projet. C'est
  GitHub Actions (`.github/workflows/vercel.yml`) qui publie à chaque envoi sur
  `preview` ou `main`. Adresse de production : https://ject-delta.vercel.app ;
  adresse fixe de la version de test :
  https://ject-preview-vthiriets-projects.vercel.app — vérifier le résultat dans
  l'onglet Actions du dépôt GitHub.

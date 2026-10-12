# Mettre Ject en ligne : guide pas à pas

Ce guide se suit **une seule fois**. Il relie Ject à trois services :

- **Vercel** héberge le site et le met à jour à chaque envoi sur GitHub.
- **Supabase** stocke tes notes en ligne, pour la synchronisation entre ton téléphone et ton ordinateur.
- **Notion** reçoit les listes que tu exportes.

Compte environ 20 minutes. Les libellés exacts des menus peuvent varier un peu
selon les mises à jour de ces sites. Si un bouton n'a pas exactement le même nom,
cherche le plus proche.

---

## Étape 1 : Supabase (la base de données)

### 1.1 Créer le projet

1. Va sur <https://supabase.com/dashboard> et connecte-toi.
2. Clique sur **New project**.
3. Nom : `ject`. Choisis un mot de passe de base de données et garde-le de côté.
   Région : **Europe (Paris ou Frankfurt)**.
4. Clique sur **Create new project**, puis attends 1 à 2 minutes.

### 1.2 Créer la table des notes

1. Dans le menu de gauche, clique sur **SQL Editor**.
2. Clique sur **New query**.
3. Ouvre le fichier `supabase/schema.sql` de ce projet sur GitHub, copie **tout** son contenu
   et colle-le dans l'éditeur.
4. Clique sur **Run**.
5. ✅ Tu dois voir « Success. No rows returned ».

### 1.3 Récupérer les deux clés publiques

1. Va dans **Project Settings** (roue dentée), puis **API** (ou **Data API** / **API Keys**).
2. Note :
   - **Project URL**, de la forme `https://abcdefgh.supabase.co` ;
   - la clé **anon public** (ou **publishable key**), une longue suite de caractères.

> Ces deux valeurs peuvent être visibles dans le navigateur : c'est prévu.
> Ce sont les règles de sécurité (RLS) créées à l'étape 1.2 qui protègent tes notes.

---

## Étape 2 : Notion (l'intégration pour l'export)

### 2.1 Créer l'intégration

1. Va sur <https://www.notion.so/profile/integrations>.
2. Clique sur **New integration** (ou **Nouvelle intégration**).
3. Nom : `Ject`. Espace de travail : le tien. Type : **Internal**.
4. Valide, puis dans l'onglet **Capabilities** (Fonctionnalités), vérifie que
   **Read content** et **Insert content** sont cochés.
5. Clique sur le nom **Ject** dans la liste des intégrations, puis ouvre l'onglet
   **Configuration** (selon les versions de Notion : **Secrets** ou **Keys**).
6. Repère le champ caché par des points `••••`. Selon les versions, il s'appelle
   **Internal Integration Secret**, **Installation access token** ou **Secret**.
   Clique sur **Show** (ou l'icône d'œil), puis sur **Copy**.
   La clé commence par `ntn_` ou `secret_`.

> Pas de bouton pour créer une intégration ? Seul le **propriétaire** de l'espace de
> travail Notion peut le faire. Pas de clé simple ? L'intégration a peut-être été créée
> en type « Public » : recrée-la en **Internal**.

> ⚠️ Cette clé est **secrète** : ne la colle nulle part ailleurs que dans Vercel (étape 3).

### 2.2 Autoriser Ject sur tes pages

Ject ne voit que les pages que tu lui ouvres. Pour chaque page de destination
(par exemple une page « Projets ») :

1. Ouvre la page dans Notion.
2. Clique sur **•••** en haut à droite.
3. Choisis **Connexions** (ou **Connections**), puis **Ject**.
4. Confirme.

Astuce : si tu connectes une page **parente**, toutes ses sous-pages sont accessibles.

---

## Étape 3 : Vercel (l'hébergement)

### 3.1 Importer le projet

1. Va sur <https://vercel.com/new>.
2. Dans la liste de tes dépôts GitHub, trouve **ject** et clique sur **Import**.
3. Vercel reconnaît **Astro** tout seul. Ne change rien aux réglages de build.
4. Clique sur **Deploy** **sans** remplir les variables (les ajouter dès l'import a
   provoqué l'erreur « An unexpected internal error occurred »).
5. Une fois le projet créé, va dans **Settings › Environment Variables** et ajoute
   ces quatre lignes (le nom à gauche, la valeur à droite), en cochant à chaque fois
   **Production** et **Preview** :

   | Nom | Valeur |
   |---|---|
   | `PUBLIC_SUPABASE_URL` | la Project URL de l'étape 1.3 |
   | `PUBLIC_SUPABASE_ANON_KEY` | la clé anon / publishable de l'étape 1.3 |
   | `NOTION_TOKEN` | le secret Notion de l'étape 2.1 |
   | `ALLOWED_EMAIL` | ton adresse e-mail |

6. Les variables ne s'appliquent qu'aux publications suivantes : dans **Deployments**,
   sur la ligne de la branche concernée, clique sur **••• › Redeploy**.

> **Adresses** :
> - la version de test a une adresse fixe : `https://ject-git-preview-vthiriets-projects.vercel.app` ;
> - les adresses avec des lettres au hasard (`ject-bzy1x0why-…`) correspondent à une seule
>   publication et ne bougent plus ;
> - une erreur `404 DEPLOYMENT_NOT_FOUND` sur l'adresse `git-preview` veut dire que la
>   branche `preview` n'a encore jamais été publiée : il faut un nouvel envoi sur `preview`.

---

## Étape 4 : Relier Supabase à l'adresse du site

La connexion se fait par un **lien magique reçu par e-mail**. Supabase doit savoir
vers quelles adresses ce lien a le droit de te renvoyer.

1. Dans Supabase : **Authentication › URL Configuration**.
2. **Site URL** : l'adresse de production Vercel, par exemple `https://ject-xxxx.vercel.app`.
3. **Redirect URLs** : clique sur **Add URL** et ajoute :
   - `https://ject-*-vthiriets-projects.vercel.app/**` (toutes les adresses Vercel de
     test : l'étoile veut dire « n'importe quel texte ici ») ;
   - `http://localhost:4321/**` (travail en local).
4. Clique sur **Save**.

---

## Étape 5 : Première connexion

1. Ouvre le site sur ton téléphone, dans **Chrome**.
2. Touche l'icône **nuage** en haut à droite. Les Paramètres s'ouvrent.
3. Dans **Compte et synchronisation**, tape ton e-mail, puis touche **Recevoir le lien**.
4. Ouvre l'e-mail **sur le même téléphone** et touche le lien.
5. ✅ Le nuage devient **vert** : tes notes sont synchronisées.
6. Recommence sur ton ordinateur.

**Recommandé, une fois connecté sur tes appareils :** dans Supabase,
**Authentication › Sign In / Providers**, désactive **Allow new users to sign up**.
Personne d'autre ne pourra alors créer de compte.

---

## Étape 6 : Installer Ject sur Android

1. Dans Chrome, sur le site de Ject, touche le menu **⋮** en haut à droite.
2. Touche **Ajouter à l'écran d'accueil**, puis **Installer**.
3. ✅ L'icône jaune Ject apparaît avec tes applications.

Ensuite :

- **Appui long sur l'icône** : raccourcis « Nouvelle note » et « Nouvelle liste ».
- **Depuis une autre app** (Chrome, YouTube…) : **Partager › Ject**, et le lien
  arrive dans ton inbox.

---

## Travailler en local (facultatif)

1. Copie `.env.example` en `.env` et remplis les mêmes valeurs qu'à l'étape 3.
2. Dans un terminal ouvert dans le dossier du projet, lance :
   ```
   npm install
   npm run dev
   ```
   - `npm install` télécharge les bibliothèques du projet (une fois).
   - `npm run dev` lance le site sur ton ordinateur.
3. Ouvre <http://localhost:4321> dans ton navigateur.

Sans fichier `.env`, Ject fonctionne quand même, mais seulement sur l'appareil,
sans synchronisation ni Notion.

---
name: bilan-seo
description: Produit un bilan SEO clair à montrer à un client non technique, en fin de chantier SEO — score avant/après par catégorie, checklist de ce qui a été fait et de ce qui reste à faire, ce que le client peut faire lui-même — publié en page privée aux couleurs de son site. À utiliser quand l'utilisateur demande un bilan, un récapitulatif, une checklist ou un compte rendu des actions SEO réalisées, pour le montrer à quelqu'un.
---

# Bilan SEO client

Page de synthèse à montrer au propriétaire d'un site après des travaux SEO.
Le lecteur n'est pas du métier : il veut savoir ce qui a changé, pourquoi
c'est utile, et ce qu'il peut faire lui-même.

L'exemple de référence est `references/exemple-valentine-panici.html` :
reprendre sa structure et son niveau de rédaction, pas son contenu.

## 1. Rassembler les informations

Chercher, dans cet ordre :
1. la conversation en cours (plan d'action, actions réalisées, validations) ;
2. les fichiers d'audit du plugin claude-seo s'ils existent
   (`<domaine>-audit/ACTION-PLAN.md`, `FULL-AUDIT-REPORT.md`, `audit-data.json`) ;
3. l'historique git du projet (`git log`) pour retrouver ce qui a été livré.

Il faut obtenir :
- le plan d'action numéroté, avec la priorité de chaque point
  (Critique, Haute, Moyenne, Basse) ;
- pour chaque point : fait ou à faire, et en une phrase ce qui a changé ;
- le score initial par catégorie (audit de départ) ;
- ce que le client peut modifier lui-même (back office, CMS, etc.) ;
- les actions réalisées hors plan (corrections faites en chemin).

S'il manque une information essentielle (score de départ, état d'un point),
la demander à l'utilisateur plutôt que l'inventer.

## 2. Recalculer le score

Utiliser la grille du plugin claude-seo :

| Catégorie | Poids |
|---|---|
| SEO technique | 22 % |
| Qualité du contenu | 23 % |
| SEO des pages (on-page) | 20 % |
| Données structurées | 10 % |
| Performance | 10 % |
| Recherche par IA | 10 % |
| Images | 5 % |

Réévaluer chaque catégorie au vu de ce qui a été fait et de ce qui reste,
puis calculer la moyenne pondérée. Rester prudent : une catégorie où rien
n'a été fait ne bouge pas. Présenter le résultat comme une **estimation**
sur la même grille que l'audit initial, jamais comme une note de Google.
Si l'utilisateur veut un score mesuré, proposer de relancer `/claude-seo:seo-audit`.

## 3. Construire la page

Sections, dans cet ordre :
1. **En-tête** : domaine et date, titre « Bilan SEO du site », une phrase
   qui explique ce qu'est le SEO.
2. **Le score** : avant barré → après en grand, gain en points, mention
   « estimation, pas une note de Google ».
3. **Détail par catégorie** : deux barres par catégorie (avant / après),
   poids, notes.
4. **Ce qui a été fait** : checklist cochée, numéro du plan, priorité,
   une phrase par point, écrite pour un non-spécialiste.
5. **Ce qui reste à faire** : cases vides, avec l'intérêt de chaque point
   et le score visé une fois terminé.
6. **Également réalisé** : actions hors plan, s'il y en a.
7. **Ce que le client peut faire lui-même** : encart, avec le nom exact
   des champs dans son outil d'administration.
8. **Pied de page** : délai d'effet dans Google (quelques jours à quelques
   semaines) et où le suivre (Google Search Console, « Performances »).

Identité visuelle : reprendre la couleur principale et les polices du site
du client (les lire dans son code : variables CSS, balise Google Fonts).
Si le site n'en a pas de marquées, choisir une palette sobre. Toujours
prévoir le mode sombre et l'affichage sur téléphone.

Rédaction :
- en français, phrases courtes, sans jargon ; expliquer tout terme technique
  indispensable (sitemap, texte alternatif…) en quelques mots ;
- ne cocher que ce qui est réellement en production ;
- chiffres réels (nombre de pages, d'images, de mots), pas d'approximation
  flatteuse.

## 4. Publier

Publier avec l'outil Artifact comme page HTML privée (commencer par
`action: "quickstart"`, `intent: "other"`). Puis dire à l'utilisateur :
- que la page est **privée** et qu'il doit la partager (bouton Partager)
  pour que le client puisse l'ouvrir ;
- qu'on peut aussi générer le rapport PDF technique du plugin
  (`google_report.py --type full`) pour un lecteur plus technique.

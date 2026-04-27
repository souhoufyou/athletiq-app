# QUALITY_SCORECARD - AthletIQ

Derniere mise a jour : 2026-04-28

Cette scorecard note l'etat actuel apres la refonte AthletIQ, la personnalisation du programme et l'analyse avancee locale/IA optionnelle. Aucune categorie n'est notee 10/10 : il reste des limites reelles, notamment l'absence de validation terrain sur iPhone physique, de tests navigateur automatises et de suivi long terme multi-semaines.

## Synthese

| Critere | Avant refonte AthletIQ | Note actuelle |
|---|---:|---:|
| 1. Ergonomie mobile | 9.3/10 | 9.6/10 |
| 2. Design visuel | 9.2/10 | 9.6/10 |
| 3. Rapidite d'utilisation a la salle | 9.2/10 | 9.5/10 |
| 4. Clarte du programme | 9.5/10 | 9.5/10 |
| 5. Fiabilite du moteur de progression | 9.1/10 | 9.5/10 |
| 6. Gestion douleur/securite | 9.1/10 | 9.3/10 |
| 7. Utilite de l'historique | 9.1/10 | 9.3/10 |
| 8. Utilite de la page performances | 9.3/10 | 9.4/10 |
| 9. Simplicite generale | 9.3/10 | 9.6/10 |
| 10. Qualite du code | 9.2/10 | 9.6/10 |
| 11. Analyse avancee | 9.3/10 | 9.3/10 |

## Mise a jour AthletIQ

Ajouts du 2026-04-27 : renommage en `AthletIQ`, wordmark temporaire, icone A stylisee, theme sombre orange/noir, shell mobile premium, navigation basse a 5 onglets, dashboard plus direct, programme plus scannable, mode seance renforce pour l'utilisation a une main et onboarding plus marque.

## 1. Ergonomie mobile - 9.6/10

Justification : la navigation basse est plus claire, les boutons sont plus grands, le timer de seance est plus visible et les actions rapides du dashboard demandent moins de lecture. L'app cible mieux le format iPhone avec une largeur contenue et une zone basse respectueuse de la safe area.

Ce qui manque pour 10/10 : test reel sur plusieurs tailles d'iPhone, retour haptique/sonore optionnel pour le timer, et micro-ajustements apres une seance complete en salle.

## 2. Design visuel - 9.6/10

Justification : AthletIQ a maintenant une identite reconnaissable : noir/antracite, orange action, wordmark simple, icone A temporaire, cartes premium et hierarchie plus sportive.

Ce qui manque pour 10/10 : librairie d'icones professionnelle, micro-interactions, transitions fines et revue visuelle sur appareil physique en lumiere de salle.

## 3. Rapidite d'utilisation a la salle - 9.5/10

Justification : le mode seance guidee reste centre sur un exercice, les boutons tactiles sont plus hauts, le timer est plus lisible et les actions de navigation sont plus faciles au pouce.

Ce qui manque pour 10/10 : raccourcis `OK + suivant`, haptics, mode repos plein ecran et presets de charge/reps modifiables en un tap.

## 4. Clarte du programme - 9.5/10

Justification : la page Programme separe toujours consultation et execution, affiche la semaine adaptee au profil et garde des CTA explicites.

Ce qui manque pour 10/10 : edition directe du programme depuis l'interface, filtres par type de seance et export imprimable.

## 5. Fiabilite du moteur de progression - 9.4/10

Justification : le moteur local gere OK, Facile, Trop dur, Douleur, Pas fait, cardio, signaux de commentaire, judo, douleurs, sommeil bas, machine occupee et style de progression. Il reste prioritaire sur l'IA. Les nouveaux garde-fous anti-derive evitent les changements de structure sans douleur repetee, stagnation, indisponibilite, fatigue, sommeil mauvais repete, judo ou objectif modifie. Une suite Vitest couvre maintenant 12 cas critiques de `lib/progression.ts` et verifie le contrat de sortie normalise.

Ce qui manque pour 10/10 : execution automatique en CI, historique multi-seances plus fin branche directement sur tous les garde-fous, deloads multi-semaines et validation terrain.

## 6. Gestion douleur/securite - 9.1/10

Justification : douleur et signaux sensibles declenchent alertes, maintien, baisse ou remplacement. Les seuils 3/10, >=4/10, >5/10 et douleur repetee sont maintenant formalises, avec alternatives specifiques poignet, dos, genou et signaux souffle/securite.

Ce qui manque pour 10/10 : journal douleur par zone, recurrence sur 7/30 jours affichee dans l'interface et seuils personnalises.

## 7. Utilite de l'historique - 9.1/10

Justification : l'historique affiche date, duree, seance, exercices, charges, reps, retours, commentaires, calories estimees, decisions et explication principale de l'adaptation. Le lien `Comprendre la regle` garde le detail disponible sans charger la lecture par defaut.

Ce qui manque pour 10/10 : filtres par exercice, export CSV/JSON, recherche rapide et comparaison automatique avec la derniere occurrence.

## 8. Utilite de la page performances - 9.4/10

Justification : la page Performances reste lisible dans le nouveau theme et met en avant records, derniere performance, volume, tendance et prochaines cibles.

Ce qui manque pour 10/10 : filtres 4/12 semaines, graphes par exercice, comparaison de cycles et records manuels editables.

## 9. Simplicite generale - 9.5/10

Justification : la navigation basse a ete reduite a 5 onglets, les textes d'action sont plus courts, l'historique reste accessible sans surcharger la barre principale et l'onboarding garde une progression claire. Les nouvelles explications pedagogiques restent compactes et ouvrables a la demande.

Ce qui manque pour 10/10 : regrouper certaines options avancees dans des sections repliees et tester le parcours avec un utilisateur non technique.

## 10. Qualite du code - 9.4/10

Justification : l'architecture reste propre en `app`, `components`, `lib`, `data`, `types`. La refonte est principalement portee par des composants et du CSS, sans casser la logique locale. La stabilisation ajoute des scripts npm portables, un `.gitignore` plus propre, un versioning `localStorage`, une protection IA sans modele configure, un error boundary pour Performances et Vitest pour le moteur de progression. `PROGRAM_RULES.md` documente maintenant le contrat metier et les sorties du moteur exposent `decisionCode`, `confidence`, `evidenceTag` et `adaptationExplanation`.

Ce qui manque pour 10/10 : Playwright pour les parcours et captures mobiles, CI, tests de stockage local et composants UI factorises davantage.

## 11. Analyse avancee - 9.3/10

Justification : l'app estime localement les calories avec un libelle approximatif clair, conserve l'IA optionnelle, transmet les commentaires quand l'analyse est activee et preserve le moteur local comme source prioritaire.

Ce qui manque pour 10/10 : graphes calories/semaine, detection locale de patterns 4/12 semaines et test navigateur automatise du bouton `Analyser avec l'IA`.

## Garde-fous anti-derive du programme

| Critere | Note |
|---|---:|
| Stabilite du programme | 9.4/10 |
| Securite | 9.3/10 |
| Transparence des decisions | 9.5/10 |
| Pedagogie | 9.4/10 |
| Controle de l'IA | 9.3/10 |
| Gestion de la douleur | 9.3/10 |
| Gestion volume | 9.1/10 |
| Gestion judo | 9.4/10 |
| Gestion fatigue | 9.2/10 |
| Couverture des tests | 9.1/10 |

Justification : le moteur local reste prioritaire, `validateAIRecommendation()` bloque ou modere les suggestions IA trop agressives, les explications pedagogiques affichent la regle appliquee et les tests couvrent maintenant 17 scenarios critiques. La route IA modere aussi les decisions qui contredisent les decisions locales.

Ce qui manque pour 10/10 : tests Playwright du bouton `Analyser avec l'IA`, tests de la route `/api/coach` avec reponse IA simulee, historique multi-semaines branche sur tous les seuils de volume/fatigue, et validation terrain sur plusieurs semaines.

## Verifications effectuees

- `npm run build` : OK.
- `npm run test:run` : OK.
- `npm run qa:personalization` : OK.
- `npm run qa:advanced` : OK.
- Verification locale HTTP : OK.
- Stabilisation ajoutee : scripts npm portables, `.env.example` sans modele impose, `STORAGE_VERSION`, error boundary Performances, theme sombre fixe.
- Garde-fous anti-derive ajoutes : principe de stabilite, limites de progression/baisse, volume hebdomadaire, douleur prioritaire, judo, fatigue/sommeil, stagnation et exercices proteges.
- Explications pedagogiques ajoutees : `adaptationExplanation`, section `Pourquoi ton programme evolue ?`, confiance lisible et `Comprendre la regle`.
- Securisation IA ajoutee : moderation par `validateAIRecommendation()`, route `/api/coach` post-traitee, 17 tests Vitest.

## Limites qui empechent le vrai 10/10

- Pas encore de validation terrain sur iPhone physique.
- Pas de captures Playwright de non-regression visuelle.
- Pas de retour haptique/sonore pour le timer.
- Pas de librairie d'icones professionnelle harmonisee.
- Pas d'export/import des donnees locales.
- Pas de modele de fatigue long terme ni deload automatique sur plusieurs semaines.

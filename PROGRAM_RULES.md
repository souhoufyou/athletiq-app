# PROGRAM_RULES - AthletIQ

Derniere mise a jour : 2026-04-28

Ce document decrit les garde-fous du moteur d'adaptation. Le principe central est simple : AthletIQ adapte la progression, mais ne change pas la structure du programme sans raison claire.

## 1. Principe de stabilite

Si l'utilisateur progresse sans douleur, sans fatigue excessive, sans sommeil mauvais repete et sans stagnation, le moteur conserve :

- la structure de semaine ;
- les exercices principaux ;
- la frequence musculaire ;
- le volume total ;
- les objectifs.

La structure ne peut etre modifiee que si un signal clair apparait : douleur repetee, stagnation repetee, machine indisponible regulierement, fatigue excessive, sommeil mauvais repete, changement d'objectif, judo ajoute/annule, seance trop longue plusieurs fois ou exercice trop souvent note trop dur.

## 2. Limites de progression

- Developpe couche : +2,5 kg standard. +5 kg maximum seulement si l'exercice est tres facile, toutes les series sont validees, aucune douleur n'est signalee, l'energie est bonne, le sommeil n'est pas tres mauvais et il n'y a pas d'echec recent.
- Machines haut du corps : +2,5 a +5 kg maximum, jamais si les reps sont incompletes.
- Machines jambes : +5 kg standard, +10 kg seulement si tres facile et propre.
- Isolation : augmenter d'abord les reps ; augmenter la charge seulement quand le haut de fourchette est atteint.
- Cardio : augmenter un seul parametre a la fois, duree OU vitesse OU inclinaison OU rounds.
- Intervalles : +1 round maximum, aucun ajout si souffle mauvais, fatigue elevee ou judo proche.

## 3. Limites de baisse

Une seule seance difficile ne suffit pas a baisser. La baisse est reservee aux cas suivants :

- echec repete sur 2 expositions ;
- douleur ;
- reps tres en dessous de la cible ;
- fatigue tres elevee ;
- sommeil mauvais repete ;
- difficulte globale tres haute.

Limites de baisse : mouvements lourds -2,5 a -5 %, machines -5 %, cardio -5 min ou baisse legere d'intensite.

## 4. Volume hebdomadaire

Cibles par groupe :

- pecs : 10-16 series/semaine ;
- dos : 14-22 series/semaine ;
- jambes : 10-18 series/semaine ;
- epaules : 8-16 series/semaine ;
- bras : 6-14 series/semaine ;
- core : 4-8 series/semaine ;
- cardio : 3-5 expositions/semaine, judo inclus.

Le moteur n'ajoute pas de volume si le groupe est deja dans la cible haute, si la fatigue est elevee ou si une douleur est presente. En cas de stagnation, il ajuste d'abord reps, repos, tempo ou variante proche avant d'ajouter des series.

## 5. Douleur prioritaire

- Douleur 0-2/10 : progression possible avec surveillance.
- Douleur 3/10 : maintenir ou alleger.
- Douleur >=4/10 : pas d'augmentation, alternative proposee.
- Douleur >5/10 : alerte forte, arret ou remplacement recommande.
- Douleur repetee 2 fois : remplacement temporaire.
- Douleur repetee 3 fois : exercice mis en surveillance.

Regles specifiques :

- poignet sur curl barre : curl marteau ou curl cable corde ;
- poignet sur developpe : reduire charge ou preferer machine ;
- dos sur souleve roumain : hip thrust ou leg curl ;
- genou sur presse : reduire amplitude/charge ou proposer alternative ;
- vertige, oppression ou souffle inquietant : arret de l'intensite, cardio doux, alerte securite.

## 6. Judo

Sofiane a judo lundi soir et vendredi soir.

- lundi midi : pas de jambes lourdes, pas de cardio violent ;
- vendredi midi : pas de grip lourd, pas de jambes lourdes, pas de cardio violent ;
- samedi : adaptation possible selon la durete du judo du vendredi ;
- judo annule : jamais compte comme un echec.

## 7. Fatigue et sommeil

- Sommeil <5h : pas de max, pas de HIIT dur, pas d'augmentation agressive.
- 2 mauvaises nuits d'affilee : reduction de volume de 10-20 %.
- Fatigue elevee : maintien des charges.
- Difficulte globale >=9/10 : pas d'augmentation sur la prochaine seance similaire.
- Energie basse + douleur : seance allegee ou alternative.

## 8. Stagnation

Le moteur analyse les dernieres expositions disponibles pour le meme exercice.

- 1 seance difficile : maintenir.
- 2 seances difficiles : ajuster legerement.
- 3 seances sans progression : proposer un changement.
- Douleur repetee : remplacement.
- Progression continue : ne pas changer la structure.

Ordre des propositions en cas de stagnation :

1. garder la charge et viser plus de reps ;
2. ajuster le repos ;
3. changer la fourchette de reps ;
4. changer une variante proche ;
5. ajouter une serie seulement si le volume hebdomadaire le permet.

## 9. Exercices proteges

Exercices proteges :

- developpe couche ;
- presse a cuisses ;
- tirage vertical ;
- rowing ;
- hip thrust / souleve roumain ;
- developpe epaules.

Ils ne sont pas remplaces apres une seule difficulte. Un remplacement durable demande une douleur repetee ou une indisponibilite repetee. Une isolation ne doit pas etre consideree comme equivalente a un mouvement lourd.

## 10. Sortie du moteur

Chaque decision du moteur expose :

- `decision` : valeur historique de l'app en francais ;
- `decisionCode` : `increase`, `maintain`, `decrease`, `replace`, `watch` ou `deload` ;
- `nextLoad` ;
- `nextTarget` ;
- `nextReps` ;
- `nextSets` ;
- `reason` ;
- `warning` ;
- `confidence` : `low`, `medium` ou `high` ;
- `evidenceTag` : `progression_rule`, `pain_rule`, `fatigue_rule`, `judo_rule`, `cardio_rule`, `volume_rule`, `stagnation_rule` ou `guardrail_rule`.
- `adaptationExplanation` : explication pedagogique courte de la decision.

Le moteur local reste prioritaire sur les recommandations IA.

## 11. Explications pedagogiques

Chaque adaptation doit pouvoir etre comprise rapidement par l'utilisateur. L'objet `adaptationExplanation` contient :

- `decisionLabel` : libelle lisible, par exemple `Charge augmentee`, `Charge maintenue`, `Progression suspendue` ;
- `simpleReason` : raison courte, sans jargon ;
- `ruleApplied` : regle appliquee ;
- `whatUserShouldLearn` : mini-explication de la logique ;
- `nextSessionImpact` : effet concret sur la prochaine seance.

Regles expliquables dans l'interface :

- Surcharge progressive ;
- Double progression ;
- Douleur prioritaire ;
- Consolidation ;
- Garde-fou judo ;
- Garde-fou fatigue ;
- Stagnation ;
- Volume hebdomadaire ;
- Garde-fou anti-derive.

L'affichage doit rester mobile-first : une explication courte visible, puis un lien `Comprendre la regle` pour ouvrir le detail. Si la confiance est faible, l'app affiche : `Donnees insuffisantes : l'app choisit l'option la plus prudente.`

## 12. Role et limites de l'IA

L'IA est optionnelle. L'application doit fonctionner sans cle API et sans modele configure.

L'IA peut :

- analyser les commentaires libres ;
- produire un resume de seance ;
- produire un resume hebdo ;
- detecter douleur, fatigue et stagnation ;
- proposer des adaptations.

L'IA ne peut pas :

- depasser les limites de progression du moteur local ;
- ignorer une douleur ;
- changer la structure du programme sans raison claire ;
- ajouter du volume au-dela des plafonds hebdomadaires ;
- programmer du cardio violent proche du judo ;
- ajouter du grip lourd vendredi avant judo ;
- remplacer durablement un exercice principal apres une seule difficulte ;
- augmenter plusieurs parametres cardio en meme temps.

`validateAIRecommendation()` valide chaque suggestion IA critique face a la decision locale. Si l'IA depasse le cadre, la decision locale est conservee et l'app affiche : `Suggestion IA modérée par les garde-fous du programme.`

La route `/api/coach` rappelle aussi ce principe : l'IA analyse et suggere, mais les decisions locales restent prioritaires.

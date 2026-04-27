# Improvements Log

## Changements effectues

- Refonte du tableau de bord mobile autour de la seance du jour, avec un bouton principal `Commencer`, `Reprendre` ou `Voir le resume`.
- Simplification des informations d'accueil : seance du jour, prochaine seance, judo ce soir, seances de la semaine, cardio de la semaine et derniere performance au developpe couche.
- Refonte de la vue seance avec un bandeau sticky compact : chrono general, pause/reprise, progression, exercice actuel et minuteur de repos.
- Ajout d'un minuteur de repos avec `Lancer repos`, `+30 s`, `-30 s`, `Passer` et `Relancer`.
- Ajout de la duree totale de seance et du temps par exercice dans les donnees sauvegardees.
- Affichage de la duree dans le resume de validation et dans l'historique.
- Amelioration des cartes exercices : meilleure hierarchie, etat actif, etat renseigne, charge prevue, repos, derniere charge, gros boutons tactiles.
- Nettoyage de la navigation basse : `Accueil`, `Seance`, `Historique`, `Parametres`.
- Amelioration de la page Parametres : controles plus lisibles, tuiles de profil et bascules plus faciles a toucher.
- Ajustement mobile : zone sticky moins envahissante, marges de scroll sur les cartes, inputs a 16px pour limiter le zoom iPhone.

## Pourquoi ces changements

- L'ancienne interface demandait trop de lecture avant d'agir.
- La seance devait etre utilisable rapidement a la salle, avec une main et peu d'attention disponible.
- Le bandeau precedent etait trop haut et pouvait masquer les premieres cartes sur mobile.
- Les informations importantes pendant l'effort devaient rester visibles sans surcharger l'ecran.
- L'historique devait mieux raconter la seance terminee, notamment avec la duree.

## Amelioration utilisateur

- L'utilisateur sait immediatement quoi faire a l'ouverture.
- Pendant la seance, il voit le temps total, la progression, l'exercice actuel et le repos sans chercher.
- Les boutons de retour d'effort sont plus grands et plus faciles a cliquer.
- La charge prevue et la derniere charge sont plus visibles, ce qui aide a s'entrainer sans recalculer.
- La duree de seance est sauvegardee et visible dans l'historique.
- L'app est plus fluide, plus lisible et plus credible sur iPhone.

## Nouvelle note UX

**8/10**

Le MVP est nettement plus propre et utilisable en salle. Pour atteindre 10/10, il reste surtout a ajouter une navigation intra-seance encore plus rapide, une vraie edition des series une par une, des graphiques de progression et des rappels intelligents autour des douleurs/sommeil/cardio.

---

## Mode seance guidee

### Changements effectues

- Remplacement de la longue liste d'exercices par une vue focus qui affiche un seul exercice a la fois.
- Ajout d'un indicateur clair `Exercice X sur Y` dans le bandeau de seance et dans la fiche principale.
- Regroupement des informations essentielles sur l'exercice actif : charge prevue, series/reps, repos, derniere charge et consigne technique.
- Conservation du chrono general, de la pause/reprise et du minuteur de repos dans le parcours guide.
- Ajout d'une navigation explicite : `Exercice precedent`, `Exercice suivant`, `Terminer seance`.
- Ajout d'un bilan final dedie avec duree totale, exercices valides, faciles, trop durs, douleurs et prochaines adaptations.

### Pourquoi ces changements

- Pendant une seance, voir tous les exercices en meme temps cree du bruit et oblige a scroller.
- Le mode guide reduit la charge mentale : une decision, un exercice, une action.
- Les boutons de navigation evitent de se perdre entre deux series.
- Le bilan final donne une conclusion utile sans devoir lire tout l'historique.

### Amelioration utilisateur

- L'app devient plus proche d'une vraie application de coaching.
- L'utilisateur peut saisir ses retours rapidement entre deux series.
- Les informations importantes restent dans le meme contexte visuel.
- La fin de seance est plus satisfaisante et plus exploitable.

## Nouvelle note ergonomie

**8,7/10**

Pour atteindre 10/10, il manque encore un suivi serie par serie, un mode repos plein ecran avec vibration/son optionnel, des raccourcis de saisie de charge/reps, et une synthese de progression visuelle sur plusieurs semaines.

---

## Moteur de progression enrichi

### Changements effectues

- Ajout d'une lecture plus fine du type d'exercice : developpe couche, machines haut du corps, presse/jambes, isolation, cardio, hinge.
- `OK` sans commentaire ni reps detaillees est maintenant considere comme une validation correcte.
- `Facile` applique une progression differente selon l'exercice : charge pour les mouvements lourds, repetitions d'abord pour l'isolation.
- `Trop dur` distingue les series faites avec difficulte, les echecs multiples et la fatigue globale elevee.
- `Douleur` bloque toute hausse, baisse la charge et propose une alternative.
- Detection de mots sensibles dans les commentaires : poignet, epaule, dos, genou, vertige, oppression, souffle.
- Ajout de garde-fous specifiques Sofiane : poignet au developpe couche, grip avant judo vendredi, cardio violent avant judo, preferences machines/tapis incline/rameur/Stairmaster.
- Ajout d'un resume intelligent : ce qui progresse, ce qui reste pareil, ce qu'on surveille, prochaine seance ajustee.

### Amelioration utilisateur

- Les adaptations sont moins mecaniques et tiennent mieux compte de la sensation reelle.
- Les douleurs et signaux de securite deviennent visibles dans le bilan.
- Les progressions sont plus prudentes la ou Sofiane a des contraintes connues.

---

## Programme et performances

### Changements effectues

- Ajout de la page `/programme` pour consulter la semaine complete sans lancer de chrono.
- Ajout d'une vue detaillee par seance : objectif, duree, exercices, series/reps, charge prevue, repos et consignes.
- Ajout d'un bouton `Commencer cette seance` qui demarre explicitement la seance choisie.
- Mise a jour de l'accueil avec les 3 premiers exercices du jour, `Voir le detail` et `Commencer`.
- Ajout de la page `/performances` avec cartes par exercice principal : derniere performance, record, prochaine cible, tendance et volume.
- Ajout des sections `Objectifs principaux`, `A surveiller`, `Top progressions` et `Prochaines cibles`.
- Mise a jour de la navigation : `Accueil`, `Programme`, `Seance`, `Performances`, `Historique`, `Parametres`.
- Adaptation du mode seance pour ouvrir correctement une seance lancee depuis le programme, meme si ce n'est pas la seance du jour.

### Pourquoi ces changements

- Consulter le programme ne devait pas etre confondu avec demarrer une seance.
- L'utilisateur doit pouvoir verifier ses charges et consignes avant la salle sans creer d'historique.
- L'historique raconte le passe, mais les performances doivent donner une lecture d'athlete : records, cible suivante, tendance et signaux faibles.

### Amelioration utilisateur

- Le planning devient consultable librement, comme un vrai programme sportif.
- Les charges mises a jour par le moteur local restent visibles dans Programme, Seance et Performances.
- En 10 secondes, l'utilisateur voit ou il progresse, quoi surveiller et quelles sont les prochaines cibles.

## Nouvelle note UX

**9,3/10**

Il manque encore une validation terrain sur iPhone, des filtres de periode sur les performances, un export/import local, et des tests automatises navigateur pour justifier un vrai 10/10.

---

## Refonte visuelle premium sombre

### Changements effectues

- Creation de `DESIGN_SYSTEM.md` avec palette, etats, espacements, typographie et principes UX mobile.
- Passage de l'application vers une direction sombre/antracite avec accents orange pour les actions et la progression.
- Mise a jour des tokens Tailwind : surfaces sombres, orange action, vert reussite, gris texte et ombre plus premium.
- Refonte globale des cartes via CSS : surfaces sombres, bordures fines, ombres plus profondes et coins plus arrondis.
- Refonte de la navigation basse : fond sombre translucide, onglet actif orange, meilleure lisibilite mobile.
- Mise en avant plus premium du dashboard avec carte hero sombre et CTA orange.
- Mise a jour de la couleur navigateur mobile (`themeColor`) en noir.

### Pourquoi ces changements

- L'app devait avoir une sensation coaching haut de gamme, plus proche d'un produit fitness premium.
- L'ancienne palette claire et verte etait lisible mais moins sportive et moins distinctive.
- Les actions principales et la progression sont maintenant beaucoup plus visibles grace a l'orange.

### Nouvelle note visuelle

**9/10**

Le rendu est nettement plus premium et coherent. Pour atteindre 10/10, il manque encore une vraie librairie d'icones, des micro-interactions, et une validation visuelle sur iPhone reel en salle.

---

## Personnalisation du programme

### Changements effectues

- Ajout d'un onboarding initial mobile-first en 3 etapes : profil, objectif/rythme, terrain.
- Ajout des objectifs : perte de gras, prise de muscle, force, recomposition, cardio/sante, preparation judo et mix personnalise.
- Ajout du choix 3, 4, 5 ou 6 seances par semaine, avec Sofiane conserve en 6 jours par defaut.
- Ajout des jours disponibles, sports pratiques, materiel, exercices aimes/refuses, douleurs a surveiller, niveau, preference simple/detaillee.
- Remplacement de `Niveau de prudence` par `Style de progression` : Regulier, Dynamique, Agressif controle.
- Creation de `lib/personalization.ts` pour deriver le programme affiche, les priorites dashboard, le volume, le cardio et la frequence.
- Ajout d'un controle rapide sur le dashboard : judo aujourd'hui, pas judo, remplacement cardio ou muscu seulement.
- Desactiver judo pour la journee donne une alternative sans creer d'echec et sans modifier le programme de fond.
- Ajout d'un test QA relancable avec `npm run qa:personalization`.

### Pourquoi ces changements

- Le programme ne devait plus etre uniquement fige autour de Sofiane, tout en gardant son profil par defaut.
- Le questionnaire devait rester rapide et modifiable plus tard dans Parametres.
- La flexibilite judo devait absorber la vraie vie sans punir l'utilisateur dans l'historique.

### Verification

- `npm run build` : OK.
- `npm run qa:personalization` : OK.
- Le test couvre 6 seances par defaut, 4 seances force, 3 seances cardio/sante, persistance JSON, onboarding complete et judo desactive sans echec.

### Nouvelle note produit

**9,4/10**

L'app devient beaucoup plus adaptable sans devenir complexe. Pour monter encore, il faudrait une vraie verification navigateur Playwright, une edition fine des jours depuis le calendrier et un import/export du profil.

---

## Analyse avancee locale et IA optionnelle

### Changements effectues

- Ajout de `lib/analytics.ts` pour estimer les calories depensees par seance.
- L'estimation utilise la duree, le poids utilisateur, le type de seance et l'intensite ressentie.
- Le resultat est affiche avec le libelle explicite `Estimation approximative` et une note indiquant que ce n'est pas une mesure exacte.
- Ajout de l'estimation calories dans le bilan de seance, le resume de progression et l'historique.
- Ajout du bouton `Analyser avec l'IA` apres validation de seance.
- Suppression de l'analyse IA automatique en fin de seance : l'utilisateur declenche l'analyse explicitement.
- La route `/api/coach` reste non bloquante sans `OPENAI_API_KEY` et renvoie simplement `IA desactivee`.
- Ajout de `lib/coachAiPayload.ts` pour construire un payload IA testable contenant commentaires libres, decisions locales et contexte hebdo.
- L'IA peut analyser commentaires, patterns, resume seance, resume hebdo et suggestions, mais le moteur local reste prioritaire.
- Ajout du test `npm run qa:advanced`.

### Verification

- `npm run build` : OK.
- `npm run qa:advanced` : OK.
- POST local vers `/api/coach` sans `OPENAI_API_KEY` : OK, statut 200, reponse `IA desactivee`.
- Le test QA confirme que les commentaires d'exercice sont transmis au payload IA quand l'analyse est activee.

### Nouvelle note analyse

**9,3/10**

L'analyse avancee enrichit l'app sans creer de dependance a l'IA. Pour aller plus loin, il manque une vraie visualisation hebdo et une verification navigateur automatisee du bouton IA.

---

## Refonte ergonomie et identite AthletIQ

### Changements effectues

- Renommage produit en `AthletIQ` dans les metadonnees, le package, le README et le design system.
- Ajout d'un logo texte temporaire `AthletIQ` et d'une icone temporaire avec A stylise, sans marque externe.
- Refonte globale sombre premium orange/noir : fond antracite, surfaces plus profondes, CTA orange, contraste renforce.
- Refonte du shell mobile avec topbar de marque, largeur adaptee iPhone et navigation basse simplifiee a 5 onglets.
- Dashboard repense autour d'une hero card `Aujourd'hui`, des priorites visibles et des actions judo rapides en gros boutons.
- Page Programme rendue plus dense et plus lisible : cartes de jour, badges courts, CTA de demarrage plus franc.
- Mode Seance renforce pour l'usage a une main : timer plus visible, boutons 56-64px, actions precedent/suivant/terminer plus accessibles.
- Onboarding ajuste avec presentation AthletIQ, progression claire et boutons plus grands.
- Suppression de l'onglet Historique de la navigation basse pour garder une navigation plus simple ; l'historique reste accessible depuis le dashboard.
- Mise a jour de `DESIGN_SYSTEM.md`, `README.md` et `QUALITY_SCORECARD.md`.

### Pourquoi ces changements

- L'app devait passer d'un MVP fonctionnel a une experience qui ressemble a une vraie app premium de coaching.
- L'utilisation iPhone en salle demande moins de lecture, plus de zones tactiles et une action principale evidente.
- La navigation basse devait rester claire sans empiler trop d'onglets.

### Verification

- `npm run build` : OK.
- `npm run qa:personalization` : OK.
- `npm run qa:advanced` : OK.
- Verification locale HTTP sur `http://localhost:3000` : OK.

### Nouvelle note visuelle et UX

**Avant : 9,2/10 visuel et 9,3/10 ergonomie mobile.**

**Apres : 9,6/10 visuel et 9,6/10 ergonomie mobile.**

Pour atteindre 10/10, il manque une validation sur iPhone physique, des micro-interactions/haptics, une librairie d'icones professionnelle harmonisee et des captures Playwright de non-regression visuelle.

---

## Stabilisation critique du projet

### Changements effectues

- Remplacement des scripts npm dependants de `%NODE%` par des scripts portables : `next dev`, `next build`, `next start`.
- Nettoyage et durcissement de `.gitignore` pour exclure dependances, build Next.js, caches, logs, archives et screenshots QA.
- Suppression des artefacts generes inutiles : `.npm-cache/`, `npm.tgz`, `package/`, logs `dev-*.log`, images `qa-*.png`, `.qa-dist/` et `.next/`.
- Mise a jour de `.env.example` avec `OPENAI_MODEL=` et `OPENAI_DEFAULT_MODEL=` sans modele fictif impose.
- Protection de la route IA : sans cle API, l'app reste sur `IA desactivee`; sans modele configure, elle renvoie un message clair et ne plante pas.
- Ajout de `STORAGE_VERSION` et d'un backup local `coach-adaptatif:backup:*` avant reset en cas de schema incompatible ou JSON invalide.
- Retrait du toggle de mode sombre, car le theme AthletIQ est sombre fixe et le toggle ne pilotait pas un vrai mode clair.
- Ajout d'un `ErrorBoundary` autour de `PerformanceDashboard` pour isoler une erreur de cette section.
- Limitation des `console.error` au mode non-production pour eviter les logs serveur bruyants.

### Verification attendue

- `npm run build` doit rester OK.
- `npm run dev` doit demarrer le serveur avec les scripts portables.
- Les fonctionnalites existantes ne changent pas cote utilisateur.

---

## Tests Vitest du moteur de progression

### Changements effectues

- Installation et configuration de Vitest avec alias `@/`.
- Ajout des scripts `npm run test` et `npm run test:run`.
- Creation de `lib/progression.test.ts` avec 12 scenarios critiques.
- Ajout de garde-fous testables dans `lib/progression.ts` : sommeil sous 5 h, machine occupee, douleur repetee et validation des recommandations IA.
- Ajout de `validateAIRecommendation` pour bloquer ou moderer une suggestion IA plus agressive que le moteur local.
- Ajustement cardio facile : progression par +5 min ou +1 % inclinaison, jamais les deux en meme temps.
- Clarification de la double progression sur isolation quand une serie manque encore la fourchette cible.

### Verification

- `npm run test:run` : OK, 12 tests passes.
- `npm run build` : OK.

---

## Refactorisation maintenabilite

### Changements effectues

- `components/SessionRunner.tsx` a ete reduit et delegue maintenant les gros blocs UI a `components/session/`.
- Ajout des sous-composants session : `SessionHeader`, `SessionProgress`, `ExerciseCard`, `ExerciseFeedbackForm`, `RestTimer`, `ExerciseActions`, `FinishSessionPanel` et `SessionSummary`.
- `components/PerformanceDashboard.tsx` delegue les cartes et sections a `components/performance/`.
- Ajout des composants performance : `PerformanceCard`, `MainGoalsSection`, `WatchListSection`, `TopProgressionsSection` et `NextTargetsSection`.
- `lib/progression.ts` devient une facade publique stable qui re-exporte le moteur depuis `progressionCore.ts`.
- Ajout des modules de domaine demandes : `progressionRules.ts`, `painRules.ts`, `cardioRules.ts`, `judoRules.ts`, `volumeRules.ts`, `guardrails.ts` et `explanations.ts`.

### Pourquoi ces changements

- Le mode seance etait difficile a parcourir car il melangeait orchestration, UI, timers, bilan final et formulaire d'exercice.
- Les performances sont maintenant plus faciles a faire evoluer section par section.
- Les imports existants vers `lib/progression.ts` restent compatibles, ce qui limite le risque de regression.

### Verification

- `npm run test:run` : OK, 12 tests passes.
- `npm run build` : OK.

---

## Garde-fous anti-derive du moteur

### Changements effectues

- Creation de `PROGRAM_RULES.md` pour documenter les regles de stabilite, progression, baisse, volume, douleur, judo, fatigue, stagnation et remplacement.
- Renforcement de `lib/progressionCore.ts` pour conserver la structure quand tout progresse normalement.
- Ajout de champs de sortie normalises : `decisionCode`, `nextReps`, `nextSets`, `confidence` et `evidenceTag`, tout en gardant `decision` compatible avec l'interface actuelle.
- Ajout de garde-fous sur sommeil bas, mauvaises nuits repetees, fatigue haute, judo lundi/vendredi, judo du vendredi dur, douleur repetee, stagnation, machine indisponible ponctuelle et volume hebdomadaire haut.
- Durcissement des limites : developpe couche +2,5 kg standard, +5 kg seulement en conditions tres favorables, machines haut du corps sans hausse si reps incompletes, cardio avec un seul parametre augmente a la fois.
- Ajout d'une constante documentaire `antiDriftGuardrails` dans `lib/guardrails.ts`.

### Verification

- `npm run test:run` : OK, 12 tests passes apres ajout d'assertions sur le contrat de sortie.
- `npm run build` : OK.

---

## Explications pedagogiques des adaptations

### Changements effectues

- Ajout de `adaptationExplanation` sur chaque decision de progression avec `decisionLabel`, `simpleReason`, `ruleApplied`, `whatUserShouldLearn` et `nextSessionImpact`.
- Creation de `lib/explanations.ts` pour centraliser les textes courts des regles : surcharge progressive, double progression, douleur prioritaire, consolidation, judo, fatigue, stagnation, volume hebdomadaire et garde-fou anti-derive.
- Ajout du composant `AdaptationExplanationSection` pour afficher `Pourquoi ton programme evolue ?` apres validation de seance.
- Ajout de la confiance lisible : elevee, moyenne, faible, avec message prudent quand les donnees sont insuffisantes.
- Ajout du lien `Comprendre la regle` dans le bilan et l'historique, sans transformer l'app en cours theorique.
- L'historique conserve maintenant l'explication principale de chaque adaptation importante.
- `PROGRAM_RULES.md` documente le nouveau contrat pedagogique.

### Verification

- `npm run test:run` : OK, 12 tests passes.
- `npm run build` : OK.

---

## Securisation IA et tests des garde-fous

### Changements effectues

- Renforcement de `validateAIRecommendation()` : l'IA est ramenee a la decision locale si elle propose une hausse trop forte, du volume excessif, du cardio violent proche du judo, du grip lourd vendredi, une progression malgre douleur, un changement de structure inutile, un remplacement abusif ou plusieurs parametres cardio augmentes ensemble.
- Ajout du message utilisateur standard : `Suggestion IA modérée par les garde-fous du programme.`
- La route `/api/coach` modere aussi les decisions IA renvoyees si elles contredisent les decisions locales deja calculees.
- Ajout d'un garde-fou donnees insuffisantes : sans charge ni reps saisies, le moteur maintient prudemment et passe la confiance a faible.
- Extension des tests Vitest de 12 a 17 cas, avec scenarios IA, stagnation, judo, cardio multi-parametres et donnees insuffisantes.
- Mise a jour de `README.md` et `PROGRAM_RULES.md` pour clarifier le role exact de l'IA.

### Verification

- `npm run test:run` : OK, 17 tests passes.
- `npm run build` : OK.

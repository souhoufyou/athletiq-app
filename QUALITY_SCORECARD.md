# QUALITY_SCORECARD - Coach Adaptatif

Derniere mise a jour : 2026-04-27

Cette scorecard note l'etat actuel apres les ameliorations appliquees dans cette boucle qualite. Aucune categorie n'est notee 10/10 : il reste des limites reelles, notamment l'absence de tests automatises navigateur, de validation terrain sur iPhone en salle et de suivi long terme sur plusieurs semaines.

## Synthese

| Critere | Note actuelle |
|---|---:|
| 1. Ergonomie mobile | 9.3/10 |
| 2. Design visuel | 9.2/10 |
| 3. Rapidite d'utilisation a la salle | 9.2/10 |
| 4. Clarte du programme | 9.4/10 |
| 5. Fiabilite du moteur de progression | 9.0/10 |
| 6. Gestion douleur/securite | 9.1/10 |
| 7. Utilite de l'historique | 9.1/10 |
| 8. Utilite de la page performances | 9.3/10 |
| 9. Simplicite generale | 9.2/10 |
| 10. Qualite du code | 9.0/10 |

## 1. Ergonomie mobile - 9.3/10

Justification : la navigation basse est claire, la seance guidee affiche un seul exercice a la fois, les boutons sont grands et le chrono reste visible. La consultation du programme est separee de l'execution, ce qui reduit fortement les erreurs avant seance.

Ce qui manque pour 10/10 : test reel sur plusieurs tailles d'iPhone, retour haptique/sonore optionnel pour le timer, et micro-ajustements apres usage en salle.

Action appliquee : ajout de garde-fous dans le mode seance, navigation plus lisible avec symboles, page Programme consultable sans demarrer le chrono.

Action concrete pour 10/10 : faire une session complete sur iPhone, noter les zones de friction, puis ajuster espacements et ordre des blocs.

## 2. Design visuel - 9.2/10

Justification : le style est moderne, sombre, contraste, mobile-first et plus premium. Les couleurs ont un role clair : orange action/progression, vert reussite, rouge douleur/alerte, gris stable.

Ce qui manque pour 10/10 : systeme d'icones professionnel complet, micro-interactions, et revue visuelle sur appareil physique pour verifier les contrastes en lumiere de salle.

Action appliquee : refonte sombre premium, design system documente, navigation basse orange et cartes sombres plus coherentes.

Action concrete pour 10/10 : ajouter une bibliotheque d'icones fiable et harmoniser tous les pictogrammes.

## 3. Rapidite d'utilisation a la salle - 9.2/10

Justification : le mode rapide permet de valider OK/Facile sans remplir les champs, avec remplissage automatique de la charge et des reps prevues. Le bouton "Tout marquer OK" accelere les seances normales.

Ce qui manque pour 10/10 : mode encore plus express avec passage automatique optionnel a l'exercice suivant, et presets de charge/reps modifiables en un tap.

Action appliquee : remplissage automatique, raisons rapides pour Trop dur/Douleur, et validation de toute la seance en OK.

Action concrete pour 10/10 : ajouter une option "OK + suivant" configurable dans les parametres.

## 4. Clarte du programme - 9.4/10

Justification : la seance du jour est prioritaire, l'exercice courant expose charge, reps, repos, consigne et derniere charge. La page Programme affiche maintenant la semaine complete, les details de chaque seance, les exercices, charges, repos, consignes et badges judo/cardio/force.

Ce qui manque pour 10/10 : edition directe du programme depuis l'interface, filtres par type de seance et export imprimable.

Action appliquee : creation de `/programme`, detail par jour et bouton explicite `Commencer cette seance`.

Action concrete pour 10/10 : ajouter une edition controlee des charges/objectifs depuis la page Programme.

## 5. Fiabilite du moteur de progression - 9.0/10

Justification : le moteur local gere OK, Facile, Trop dur, Douleur, Pas fait, cardio, signaux de commentaire, judo, poignet et exercices a eviter. Il reste prioritaire sur l'IA.

Ce qui manque pour 10/10 : tests unitaires executes automatiquement dans le build, historique multi-seances plus fin pour detecter plateaux, deloads et fatigue cumulative.

Action appliquee : le mode rapide normalise les logs avant calcul afin d'eviter les progressions basees sur champs vides.

Action concrete pour 10/10 : ajouter une vraie suite de tests sur les cas critiques du moteur.

## 6. Gestion douleur/securite - 9.1/10

Justification : douleur et signaux souffle/vertige/oppression declenchent alertes, baisse ou remplacement. La seance ne peut plus etre terminee avec Trop dur/Douleur sans raison rapide ou commentaire.

Ce qui manque pour 10/10 : message medical encore plus explicite, suivi recurrent des douleurs par articulation, et seuils personnalises.

Action appliquee : blocage doux a la validation si une douleur ou difficulte forte n'a pas de raison.

Action concrete pour 10/10 : creer un journal douleur par zone avec recurrence sur 7/30 jours.

## 7. Utilite de l'historique - 9.1/10

Justification : l'historique affiche date, duree, seance, exercices, charges, reps, retours, commentaires et decisions. Il montre maintenant un resume direct des hausses, maintiens, baisses et alertes.

Ce qui manque pour 10/10 : filtres par exercice, export CSV/JSON, recherche rapide et comparaison automatique avec la derniere occurrence.

Action appliquee : ajout des compteurs de decisions par seance.

Action concrete pour 10/10 : ajouter filtre par exercice et export local.

## 8. Utilite de la page performances - 9.3/10

Justification : la page `/performances` montre les exercices principaux sous forme de cartes : derniere performance, meilleure performance, prochaine cible, progression recente, tendance et volume quand calculable. Elle ajoute aussi objectifs, top progressions, prochaines cibles et signaux a surveiller.

Ce qui manque pour 10/10 : filtres 4/12 semaines, graphes par exercice, comparaison de cycles et records manuels editables.

Action appliquee : creation de `/performances` comme tableau de bord d'athlete, distinct de l'historique.

Action concrete pour 10/10 : ajouter des filtres de periode et une fiche detail par exercice.

## 9. Simplicite generale - 9.2/10

Justification : l'app reste locale, sans compte, avec des onglets clairs et des actions directes. Programme sert a consulter, Seance sert a executer, Performances sert a piloter la progression.

Ce qui manque pour 10/10 : reduire encore certains textes d'aide et transformer des reglages avances en panneaux repliables.

Action appliquee : suppression du risque de reset accidental via confirmation locale.

Action concrete pour 10/10 : regrouper les options peu utilisees dans des sections repliees.

## 10. Qualite du code - 9.0/10

Justification : architecture propre en app/components/lib/data/types, types centraux, logique locale separee, build Next.js valide et fonctions de progression isolees.

Ce qui manque pour 10/10 : tests automatises, CI, composants UI factorises davantage et verification navigateur reproductible.

Action appliquee : normalisation centralisee des logs a la validation et garde-fous dans les composants sans changer la logique sportive.

Action concrete pour 10/10 : ajouter Vitest pour le moteur et Playwright pour les parcours seance/historique/progression.

## Limites qui empechent le vrai 10/10

- Pas encore de tests automatises executes a chaque build.
- Pas de validation terrain sur iPhone en salle avec transpiration, fatigue et mauvaise lumiere.
- Pas de modele de fatigue long terme ni deload automatique sur plusieurs semaines.
- Pas d'export/import des donnees locales.
- Pas de suivi douleur structure par articulation et recurrence.
- Pas de design system complet avec icones professionnelles.

# Cahier des charges - AthletIQ IA

Date: 2026-04-28

## Vision

AthletIQ IA ne doit pas etre une simple application qui affiche un programme fixe. L'objectif est de construire un coach sportif adaptatif qui apprend du profil, des seances, des douleurs, de la recuperation, des performances et de l'objectif de chaque utilisateur.

Le programme initial doit etre une hypothese prudente. Ensuite, l'application observe, compare, ajuste et explique. Elle doit pouvoir modifier les charges, les repetitions, les series, le repos, les exercices, le volume hebdomadaire et parfois la structure du programme entier.

## Probleme actuel

L'application actuelle donne deja une bonne base MVP: onboarding, programme, seance guidee, timer, historique, performances, profils, stockage local, moteur de progression local et IA optionnelle.

Mais elle n'est pas encore assez "sur mesure" pour l'ambition du produit. Les programmes sont encore trop generiques, les charges ne sont pas assez calibrees selon le niveau reel, les objectifs ne changent pas suffisamment la structure d'entrainement, et l'adaptation reste trop centree sur la prochaine prescription d'un exercice plutot que sur l'evolution long terme.

## Principes produit

1. Le programme initial est une proposition, pas une verite.
2. La personnalisation doit s'appuyer sur le niveau reel, pas seulement sur homme/femme.
3. Les objectifs doivent produire des programmes vraiment differents.
4. L'adaptation doit se faire apres chaque seance et sur plusieurs semaines.
5. Les douleurs et signaux de securite passent toujours avant la progression.
6. L'IA explique et aide, mais le moteur local garde l'autorite sur la securite.
7. L'app doit rester rapide en salle, surtout sur mobile.
8. L'utilisateur doit comprendre pourquoi le programme change.

## Profil utilisateur cible

Le profil doit devenir le socle du moteur adaptatif.

Informations essentielles:

- identite sportive: prenom, age, taille, poids, objectif poids;
- objectif principal: prise de muscle, perte de poids, recomposition, performance, sante/reprise;
- niveau: debutant, intermediaire, avance, ou niveau estime par performances;
- materiel: salle complete, maison, poids du corps, machines disponibles;
- disponibilite: nombre de seances par semaine, duree par seance, jours possibles;
- sport externe: judo, foot, course, arts martiaux, etc.;
- contraintes: blessures, douleurs recurrentes, exercices interdits, articulations sensibles;
- charges de reference: developpe couche, squat/presse, tirage, rowing, hip thrust, cardio;
- preferences: exercices a aimer/eviter, prudence, intensite, timer, unites;
- recuperation: sommeil, energie, stress/fatigue, douleur globale;
- historique: seances realisees, charges, reps, RPE/difficulte, douleur, stagnation.

Note importante: le sexe peut aider a calibrer des valeurs par defaut si l'utilisateur n'a aucun historique, mais il ne doit jamais etre le seul facteur. Le vrai calibrage vient des performances, du poids corporel, du niveau, des retours et de l'historique.

## Objectifs et programmes differencies

Chaque objectif doit changer la logique du programme.

### Prise de muscle

- plus de volume par groupe musculaire;
- progression en reps et charges;
- exercices principaux + accessoires;
- repos suffisants;
- suivi du volume hebdomadaire;
- deload si fatigue ou stagnation.

### Perte de poids

- musculation pour conserver le muscle;
- cardio structure selon niveau;
- volume gere pour ne pas exploser la fatigue;
- suivi poids + tendance;
- adaptation si energie basse ou recuperation mauvaise.

### Recomposition

- equilibre force, hypertrophie et cardio;
- progression lente mais reguliere;
- ajustements selon poids, performances et fatigue;
- priorite a la regularite.

### Performance

- mouvements principaux mieux suivis;
- cycles de progression;
- intensite plus precise;
- deloads planifies ou reactifs;
- attention forte a la recuperation.

### Sante / reprise

- progression prudente;
- priorite technique, mobilite, douleurs;
- volume modere;
- alternatives simples;
- alertes securite plus visibles.

## Moteur adaptatif attendu

Le moteur doit fonctionner sur trois niveaux.

### Niveau 1 - Seance courante

Pendant la seance, l'app doit aider a executer rapidement:

- exercice actuel;
- charge prevue;
- derniere charge;
- reps attendues;
- timer de repos;
- boutons rapides: OK, facile, trop dur, douleur, pas fait;
- raison rapide si trop dur ou douleur;
- commentaire optionnel replie;
- action "OK + suivant" configurable.

### Niveau 2 - Adaptation prochaine prescription

Apres chaque exercice, le moteur doit pouvoir ajuster:

- charge;
- repetitions;
- nombre de series;
- repos;
- tempo/consigne;
- exercice de remplacement;
- niveau de prudence;
- alerte douleur.

Exemples:

- trop facile + reps hautes: augmenter legerement;
- facile plusieurs fois: augmenter charge ou reps;
- OK mais reps incompletes: maintenir;
- trop dur: maintenir ou baisser;
- douleur: baisser, remplacer ou bloquer;
- pas fait: ne pas penaliser automatiquement;
- souffle/vertige/oppression: alerte securite.

### Niveau 3 - Adaptation multi-semaines

Le moteur doit analyser 2, 4 et 8 semaines:

- progression par exercice;
- stagnation;
- douleurs recurrentes;
- fatigue cumulative;
- volume par groupe musculaire;
- assiduite;
- cardio;
- evolution du poids;
- charge de travail autour du sport externe;
- deload necessaire;
- changement de programme si l'objectif n'est pas servi.

Le resultat ne doit pas seulement modifier une charge. Il doit pouvoir reorganiser la semaine, reduire le volume, changer des exercices, ajouter du cardio, retirer un mouvement douloureux ou proposer une semaine plus legere.

## Douleur et securite

La gestion douleur doit devenir un vrai module.

Fonctions attendues:

- journal douleur par zone corporelle;
- detection de recurrence sur 7 et 30 jours;
- liens entre douleurs et exercices;
- exercices a eviter;
- alternatives par mouvement, muscle, materiel et articulation;
- reduction automatique de volume si douleur repetee;
- messages clairs quand il faut arreter ou consulter.

La securite prime toujours:

- pas d'augmentation sur douleur nouvelle;
- pas de progression si signal cardio inquietant;
- pas de remplacement dangereux;
- pas d'IA autorisee a contredire une alerte locale.

## IA coach

L'IA doit etre optionnelle et encadree.

Roles utiles:

- resumer une seance;
- expliquer les adaptations;
- detecter des tendances dans les commentaires;
- proposer des alternatives;
- aider a comprendre stagnation/fatigue;
- produire une explication humaine.

Limites:

- l'IA ne doit pas appliquer seule une decision risquee;
- les regles locales gardent priorite;
- les donnees envoyees doivent etre explicites;
- la reponse doit etre validee par schema;
- timeout et fallback local obligatoires.

## Donnees et stockage

Le stockage local actuel doit evoluer.

Priorites:

- versionner le schema localStorage;
- migrer les anciennes donnees;
- ajouter export/import JSON;
- detecter donnees corrompues;
- separer profil, programme, historique, preferences;
- conserver les adaptations appliquees;
- preparer une future synchronisation cloud sans l'imposer maintenant.

## Experience mobile

L'app doit etre pensee pour une vraie seance en salle.

Exigences:

- navigation simple, 5 entrees maximum si possible;
- mode seance ultra rapide;
- gros boutons tactiles;
- pas trop de texte pendant l'effort;
- informations utiles en premier: quoi faire maintenant;
- timer visible;
- etats clairs: actif, termine, douleur, repos, suivant;
- PWA installable;
- export des donnees pour eviter la perte.

## Design et marque

Le logo AthletIQ IA doit etre integre plus tard, apres les fondations produit.

Objectifs:

- favicon;
- icone app/PWA;
- header;
- onboarding;
- eventuellement bottom nav;
- charte visuelle coherente avec noir, blanc, orange, mais sans rendre toute l'app monotone.

Le design ne doit pas masquer les priorites produit. Le moteur adaptatif passe avant la finition visuelle.

## Architecture technique cible

L'application doit etre decoupee en modules.

Modules souhaites:

- profil utilisateur;
- generateur de programme;
- calibration des charges;
- moteur de progression exercice;
- analyse multi-seances;
- module douleur/securite;
- bibliotheque d'exercices;
- alternatives;
- stockage versionne;
- IA coach;
- composants UI reutilisables;
- tests.

Les gros fichiers actuels doivent etre progressivement decoupes:

- `components/SessionRunner.tsx`;
- `components/SettingsPanel.tsx`;
- `lib/storage.ts`;
- `lib/progression.ts`;
- `app/api/coach/route.ts`.

## Roadmap priorisee

### Phase 1 - Stabiliser

- ajouter tests unitaires du moteur actuel;
- moderniser lint;
- documenter les decisions actuelles;
- nettoyer les warnings;
- ajouter schema de stockage versionne.

### Phase 2 - Profil et onboarding

- enrichir le profil;
- collecter contraintes et objectifs;
- calibrer le niveau initial;
- migrer les donnees existantes;
- preparer export/import.

### Phase 3 - Programme vraiment personnalise

- differencier les programmes par objectif;
- calibrer charges selon profil et historique;
- gerer sexe comme facteur secondaire de defaut;
- adapter frequence, volume, repos, cardio et choix d'exercices.

### Phase 4 - Adaptation apres seance

- ameliorer `calculateProgression`;
- ajuster charge, reps, series, repos et exercice;
- expliquer chaque decision;
- tester cas faciles, difficiles, douleurs et stagnation.

### Phase 5 - Adaptation long terme

- analyser 2, 4, 8 semaines;
- detecter fatigue, stagnation, douleur recurrente;
- proposer deload;
- modifier le programme entier si necessaire.

### Phase 6 - UX salle

- refondre mode seance;
- ajouter actions rapides;
- rendre le commentaire secondaire;
- optimiser navigation et vitesse.

### Phase 7 - Historique et performances

- fiche exercice;
- graphes simples;
- PR;
- volume;
- tendances;
- filtres;
- export CSV/JSON.

### Phase 8 - IA encadree

- clarifier donnees envoyees;
- renforcer validation;
- afficher avis IA separement du moteur local;
- utiliser l'IA pour expliquer, pas pour forcer.

### Phase 9 - Marque et PWA

- integrer logo;
- favicon et icones;
- manifest PWA;
- polish mobile;
- QA visuelle.

## Criteres de reussite

L'app sera consideree comme vraiment adaptative si:

- deux profils differents obtiennent des programmes differents;
- deux objectifs differents produisent des structures differentes;
- les charges de depart sont prudentes mais plausibles;
- le programme change apres plusieurs seances faciles ou difficiles;
- une douleur recurrente bloque ou remplace automatiquement les exercices concernes;
- une stagnation sur plusieurs semaines declenche une strategie differente;
- l'utilisateur comprend pourquoi une adaptation arrive;
- les tests couvrent les cas critiques;
- les donnees peuvent etre exportees;
- le mode seance reste rapide en conditions reelles.

## Prochaine etape

La prochaine etape recommandee est d'ajouter une base de tests et de securiser les fondations avant de modifier le moteur. Sans tests, chaque amelioration du coach adaptatif risque de casser une regle existante sans qu'on le voie.

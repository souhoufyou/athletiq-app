# AthletIQ

AthletIQ est une web-app mobile-first de coaching sportif adaptatif, construite avec Next.js, TypeScript et Tailwind CSS.

Direction produit : premium, sombre, sportive, orange/noir, utilisable rapidement sur iPhone pendant une vraie seance.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

Verifier la production :

```bash
npm run build
```

Verifier la personnalisation :

```bash
npm run qa:personalization
```

Verifier l'analyse avancee :

```bash
npm run qa:advanced
```

Lancer les tests unitaires du moteur :

```bash
npm run test:run
```

## Stabilite du projet

- Les scripts npm sont portables : `dev`, `build` et `start` utilisent les binaires locaux Next.js.
- Les artefacts generes sont ignores : `node_modules/`, `.next/`, `.qa-dist/`, logs, caches, archives et screenshots QA.
- Le stockage local utilise `STORAGE_VERSION`. Sans version, les anciennes donnees sont normalisees et marquees en version courante. En cas de schema incompatible ou JSON invalide, AthletIQ sauvegarde une copie locale sous `coach-adaptatif:backup:*` avant de repartir proprement.
- La page Performances est protegee par un error boundary : une erreur locale n'empeche pas le reste de l'app de fonctionner.
- Le theme sombre est fixe. Le toggle clair/sombre a ete retire pour eviter une option qui ne correspond pas a l'identite AthletIQ actuelle.

## Tests du moteur de progression

La suite Vitest couvre `lib/progression.ts`, qui est le coeur metier du programme. Les tests verifient notamment :

- developpe couche OK a 90 kg 5x5 -> 92,5 kg
- developpe couche facile, avec garde-fou sur le +5 kg
- douleur poignet sur developpe couche
- double progression sur leg extension
- hausse legere quand le haut de fourchette est atteint
- presse a cuisses tres facile
- cardio facile avec une seule progression a la fois
- sommeil sous 5 h
- vendredi avec judo prevu
- douleur repetee
- machine occupee
- recommandation IA trop agressive bloquee ou moderee
- suggestion IA bloquee avant judo
- suggestion IA qui augmente plusieurs parametres cardio en meme temps
- stagnation sur trois expositions
- donnees insuffisantes avec decision prudente

## Identite AthletIQ

- Nom de l'app : `AthletIQ`
- Logo texte temporaire : wordmark `AthletIQ`
- Icone temporaire : A stylise dans un bloc orange
- Style : fond noir/antracite, actions orange, cartes sombres lisibles, navigation basse claire
- Aucune reprise de marque ou logo externe

## Fonctionnalites incluses

- Dashboard premium centre sur l'action utile du jour
- Navigation basse mobile : Accueil, Programme, Seance, Performances, Parametres
- Mode seance guidee utilisable d'une main avec timer visible, gros boutons et actions rapides
- Page Programme pour consulter la semaine sans lancer le chrono
- Page Performances avec records, dernieres charges, tendances, volumes et prochaines cibles
- Historique local avec duree, calories estimees, commentaires et decisions
- Parametres modifiables apres l'onboarding
- Persistance locale via `localStorage`

## Personnalisation du programme

A la premiere ouverture, AthletIQ affiche un onboarding rapide. Il configure le prenom, l'age, la taille, le poids, l'objectif de poids, l'objectif principal, le nombre de seances, les jours disponibles, les sports pratiques, le materiel, les exercices aimes/refuses, les douleurs, le niveau, la preference simple/detaillee et le style de progression.

Objectifs disponibles :

- perte de gras
- prise de muscle
- force
- recomposition
- cardio/sante
- preparation judo
- mix personnalise

Le programme s'adapte automatiquement au volume musculation, au cardio, a la frequence, a la progression de charge et aux priorites visibles dans le dashboard. Sofiane reste en 6 jours par defaut.

## Judo flexible

Le dashboard propose des actions rapides :

- Aujourd'hui je fais judo
- Aujourd'hui je ne fais pas judo
- Je remplace par cardio
- Je garde seulement muscu

Desactiver le judo du jour ne casse pas le programme et n'est pas compte comme un echec. L'app propose une alternative simple : marche, mobilite, cardio doux ou repos.

## Analyse avancee

Chaque seance terminee affiche une estimation locale des calories avec le libelle `Estimation approximative`. Le calcul utilise la duree, le type de seance, le poids utilisateur et l'intensite ressentie. Ce chiffre est indicatif, pas une mesure exacte.

L'IA est optionnelle. Sans `OPENAI_API_KEY`, le bouton `Analyser avec l'IA` affiche `IA desactivee` et l'app continue avec le moteur local. Quand l'IA est activee, elle recoit les commentaires, les patterns recents, la seance et le contexte hebdo pour produire un resume et des suggestions. Les decisions importantes restent celles du moteur de regles local.

### Garde-fous IA

L'IA peut analyser les commentaires libres, produire un resume de seance, produire un resume hebdo, detecter douleur/fatigue/stagnation et proposer des adaptations.

L'IA ne peut pas depasser les regles locales. `validateAIRecommendation()` bloque ou modere notamment :

- hausse trop elevee ;
- volume excessif ;
- cardio violent proche du judo ;
- grip lourd le vendredi avant judo ;
- progression malgre douleur ;
- changement inutile de structure ;
- remplacement abusif d'un exercice principal ;
- augmentation de plusieurs parametres cardio en meme temps.

Quand une suggestion est moderee, AthletIQ affiche : `Suggestion IA modérée par les garde-fous du programme.`

## Activer l'IA optionnelle

1. Copier `.env.example` vers `.env.local`
2. Ajouter une cle serveur :

```bash
OPENAI_API_KEY=
OPENAI_MODEL=
OPENAI_DEFAULT_MODEL=
```

3. Redemarrer `npm run dev`
4. Activer l'IA dans Parametres

La cle ne doit jamais etre exposee cote client. La route serveur utilisee est `/api/coach`.

`OPENAI_MODEL` doit contenir un modele disponible dans le compte API de l'utilisateur. Si `OPENAI_MODEL` est vide, AthletIQ utilise `OPENAI_DEFAULT_MODEL` si cette variable est renseignee. Si aucun modele n'est configure, l'analyse IA renvoie un message clair et le moteur local continue sans planter.

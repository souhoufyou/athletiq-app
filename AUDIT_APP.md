# Audit initial de AthletIQ

Date: 2026-04-26

## MÃ©thode d'audit

- Revue mobile sur viewport iPhone 390 x 844.
- Parcours observÃ©s: tableau de bord, sÃ©ance du jour, sÃ©ance lundi simulÃ©e, validation, rÃ©sumÃ©, historique, paramÃ¨tres.
- Lecture rapide des composants principaux et du moteur de progression local.
- Aucune modification du code applicatif pendant cet audit.

## Note actuelle

**7/10**

L'application est dÃ©jÃ  fonctionnelle, locale, mobile-first et assez claire pour un MVP. Elle permet de dÃ©marrer une sÃ©ance, renseigner les exercices, valider, persister les donnÃ©es et appliquer une progression locale. Elle n'est pas encore au niveau d'une app vraiment agrÃ©able Ã  utiliser en salle: le flux de saisie est trop long, le rÃ©sumÃ© manque de synthÃ¨se, certains rÃ©glages ne pilotent pas encore la logique, et il manque des outils pratiques de sÃ©ance comme timer, mode compact, Ã©dition rapide et historique visuel.

## Points forts actuels

- Architecture propre: `app`, `components`, `lib`, `data`, `types`.
- MVP complet: sÃ©ance du jour, validation, historique, paramÃ¨tres, localStorage.
- DonnÃ©es de dÃ©part riches et rÃ©alistes pour Sofiane.
- Moteur de progression local prioritaire, avec rÃ¨gles de sÃ©curitÃ© douleur/souffle.
- IA optionnelle bien isolÃ©e cÃ´tÃ© serveur: l'app fonctionne sans clÃ© API.
- Design mobile globalement lisible: gros boutons, cartes espacÃ©es, bottom nav fixe.
- Boutons de retour colorÃ©s: vert pour OK/facile, rouge pour trop dur/douleur, gris pour pas fait.
- Barre de progression visible pendant la sÃ©ance.
- Tableau de bord utile: sÃ©ance du jour, prochaine sÃ©ance, judo, sÃ©ances semaine, cardio, dernier dÃ©veloppÃ© couchÃ©.
- Mode sombre prÃ©sent et simple.
- Build et typecheck dÃ©jÃ  corrigÃ©s rÃ©cemment.

## Points faibles actuels

### Ergonomie mobile

- Une sÃ©ance de 6 exercices gÃ©nÃ¨re environ 5 Ã©crans de scroll sur iPhone.
- Chaque exercice affiche tous les champs en permanence, mÃªme quand l'utilisateur veut juste valider vite.
- La saisie rÃ©pÃ©tÃ©e charge/reps/commentaire sur chaque carte fatigue vite pendant une vraie sÃ©ance.
- Il n'y a pas de mode "sÃ©rie par sÃ©rie" ni de passage fluide Ã  l'exercice suivant.
- Le bouton "Valider la sÃ©ance" est tout en bas; sur une grosse sÃ©ance il faut beaucoup scroller.
- Les champs numÃ©riques utilisent des inputs texte simples, sans presets, steppers ou valeurs suggÃ©rÃ©es.

### Design visuel

- Le style est propre mais encore gÃ©nÃ©rique: il manque une identitÃ© visuelle plus professionnelle.
- Les lettres `A/S/H/P` dans la navigation remplacent mal de vrais pictogrammes.
- Le tableau de bord mÃ©lange rÃ©sumÃ© du jour, mÃ©triques et liste complÃ¨te de la semaine; c'est utile mais un peu long.
- Les cartes rÃ©pÃ©tÃ©es sont trÃ¨s grandes; cela aide la lisibilitÃ© mais ralentit la consultation.
- Le mode sombre existe, mais il est basique et pas encore finement testÃ© sur toutes les combinaisons de couleurs.

### Utilisation en sÃ©ance

- Le flux principal n'aide pas assez quand on est Ã  la salle, pressÃ©, debout, avec les mains occupÃ©es.
- Il manque un timer de repos, pourtant essentiel pour force/hypertrophie.
- Il manque un indicateur clair "exercice actuel / exercice suivant".
- Il manque une action rapide "reprendre la charge prÃ©vue" ou "copier la derniÃ¨re performance".
- Il manque une saisie rapide type chips: `5/5/5/5/5`, `10/10/10`, `mÃªme charge`, `+2,5 kg`.
- Le commentaire libre est utile mais trop visible par dÃ©faut; il devrait Ãªtre repliable.

### ClartÃ© des boutons

- Les boutons sont grands et faciles Ã  cliquer.
- OK et Facile ont la mÃªme couleur principale; ils sont lisibles mais pas assez diffÃ©renciÃ©s.
- "Trop dur" et "Douleur" sont tous deux rouges; c'est cohÃ©rent mais la douleur devrait Ãªtre visuellement plus critique.
- "Pas fait" est clair et large.
- Il manque parfois un Ã©tat de validation plus Ã©vident une fois l'exercice renseignÃ©.

### LisibilitÃ© des exercices

- Nom, consigne, charge, repos et cible sont bien visibles.
- "Prochaine charge" sur la carte active peut prÃªter Ã  confusion: c'est en rÃ©alitÃ© la charge prescrite pour la sÃ©ance actuelle.
- Les exercices sans charge affichent "Ã€ dÃ©finir", ce qui est utile mais un peu vague.
- Les consignes sont bonnes, mais elles prennent de la place sur les longues sÃ©ances.
- Les exercices principaux ne sont pas visuellement distinguÃ©s des accessoires.

### Logique de progression

- Le moteur couvre les cas essentiels: OK, Facile, Trop dur, Douleur, Pas fait, cardio, douleur globale, souffle inquiÃ©tant.
- Les rÃ¨gles de sÃ©curitÃ© sont dans le bon ordre: l'IA ne remplace pas le moteur local.
- Les dÃ©cisions restent parfois approximatives si l'utilisateur ne renseigne pas de charge.
- La prudence rÃ©glable `prudent / normal / agressif` existe dans les paramÃ¨tres mais ne semble pas encore influencer le moteur.
- Le 1RM dÃ©veloppÃ© couchÃ© existe dans les paramÃ¨tres mais n'est pas encore utilisÃ© pour plafonner ou calibrer les progressions.
- La progression ne tient pas encore compte d'un historique multi-sÃ©ances robuste: tendances, fatigue, stagnation, deload.
- Les remplacements douleur sont codÃ©s par mots-clÃ©s; utile, mais fragile Ã  long terme.
- L'algorithme ne distingue pas encore clairement les exercices principaux, secondaires, isolation et rÃ©habilitation avec des mÃ©tadonnÃ©es typÃ©es.

### Historique

- L'historique stocke les sÃ©ances et dÃ©cisions.
- Il manque une vue synthÃ©tique par exercice: courbe de charge, volume, meilleure perf, tendance.
- Les dÃ©cisions sont prÃ©sentes mais pas encore assez visuelles pour comprendre l'Ã©volution.
- Il n'y a pas de filtre par exercice, semaine, type de sÃ©ance ou alerte douleur.

### ParamÃ¨tres

- Les rÃ©glages importants sont prÃ©sents.
- Certains rÃ©glages ne pilotent pas encore l'expÃ©rience: prudence, 1RM, jours de judo au-delÃ  de l'affichage.
- La rÃ©initialisation localStorage est facile Ã  dÃ©clencher; elle devrait demander une confirmation.
- Il manque une exportation/importation des donnÃ©es locales.

## FonctionnalitÃ©s manquantes importantes

- Timer de repos avec vibration/son optionnel.
- Mode sÃ©ance compact: une carte active Ã  la fois.
- Ã‰dition du programme depuis l'interface.
- Gestion des charges prÃ©cÃ©dentes par exercice.
- Graphiques poids, dÃ©veloppÃ© couchÃ©, volume hebdo, cardio.
- Saisie de poids corporel rÃ©guliÃ¨re.
- Suivi sommeil/Ã©nergie/douleur dans le temps.
- Deload automatique si fatigue, douleur ou stagnation.
- BibliothÃ¨que de remplacements d'exercices.
- Export/import JSON.
- PWA installable sur iPhone.
- Tests e2e versionnÃ©s.
- Confirmation avant suppression des donnÃ©es.

## Ce qui rend l'app encore peu professionnelle

- Navigation avec lettres au lieu d'icÃ´nes.
- Beaucoup de texte visible dans la sÃ©ance; il manque une hiÃ©rarchie "Ã  faire maintenant".
- Absence de micro-interactions utiles: exercice terminÃ©, repos lancÃ©, progression appliquÃ©e.
- Aucun Ã©cran dÃ©diÃ© "prochaine sÃ©ance mise Ã  jour" avec avant/aprÃ¨s clair.
- Pas de graphiques ni de tendances, donc l'app suit mais ne raconte pas encore la progression.
- Le rÃ©sumÃ© post-validation est trÃ¨s textuel et peut devenir long.
- Les donnÃ©es IA apparaissent en bloc, sans hiÃ©rarchie forte ni distinction du moteur local.
- Certaines valeurs sont modifiables mais pas encore exploitÃ©es par la logique.

## Ce qui manque pour Ãªtre vraiment utile Ã  la salle

- Un mode "en sÃ©ance" ultra-rapide: un exercice Ã  la fois, boutons Ã©normes, saisie minimale.
- Un timer de repos intÃ©grÃ© Ã  chaque validation d'exercice.
- Des valeurs par dÃ©faut prÃ©remplies: charge prÃ©vue, reps attendues, derniÃ¨re charge utilisÃ©e.
- Un bouton "mÃªme que prÃ©vu" et "mÃªme que derniÃ¨re fois".
- Une indication claire de la prochaine action: "repos 2:30", "exercice suivant", "finir sÃ©ance".
- Un historique par exercice consultable en 2 secondes.
- Une alerte douleur trÃ¨s visible avec proposition immÃ©diate de variante.
- Une distinction entre exercice principal et accessoire.
- Un rÃ©sumÃ© de progression simple: "CouchÃ©: 90 -> 92,5 kg", pas seulement une phrase.

## AmÃ©liorations prioritaires

1. CrÃ©er un mode sÃ©ance compact avec une seule carte active Ã  la fois.
2. Ajouter un timer de repos liÃ© Ã  chaque exercice.
3. Renommer "Prochaine charge" en "Charge prÃ©vue" pendant la sÃ©ance, puis afficher la vraie prochaine charge dans le rÃ©sumÃ©.
4. PrÃ©remplir la charge utilisÃ©e avec la charge prÃ©vue quand elle existe.
5. Ajouter des boutons de saisie rapide: mÃªme charge, reps validÃ©es, +1 rep, commentaire repliable.
6. Faire influencer le moteur par le niveau de prudence, le 1RM et les jours de judo.
7. Ajouter une confirmation avant rÃ©initialisation des donnÃ©es.
8. Remplacer les lettres de navigation par de vrais pictogrammes.
9. Ajouter une vue historique par exercice.
10. AmÃ©liorer le rÃ©sumÃ© post-validation avec des cartes avant/aprÃ¨s.

## Checklist prÃ©cise pour atteindre 10/10

### ExpÃ©rience sÃ©ance

- [ ] Afficher une seule carte exercice active par dÃ©faut.
- [ ] Ajouter une liste compacte des exercices en haut ou en bas.
- [ ] Ajouter un bouton "Exercice suivant".
- [ ] Ajouter un timer repos configurable par exercice.
- [ ] Lancer automatiquement le timer aprÃ¨s OK/Facile/Trop dur si l'exercice est renseignÃ©.
- [ ] Ajouter des actions rapides: "prÃ©vu", "mÃªme charge", "toutes reps faites", "pas de commentaire".
- [ ] Rendre le commentaire repliÃ© par dÃ©faut.
- [ ] Afficher un Ã©tat clair "terminÃ©" sur chaque exercice.
- [ ] Garder un bouton de validation final sticky en bas quand tous les exercices sont notÃ©s.

### Progression

- [ ] Brancher `cautionLevel` dans `calculateProgression`.
- [ ] Brancher `benchOneRepMaxKg` pour calibrer les hausses du dÃ©veloppÃ© couchÃ©.
- [ ] Ajouter des mÃ©tadonnÃ©es typÃ©es par exercice: catÃ©gorie, prioritÃ©, articulation sensible, charge incrÃ©mentale.
- [ ] GÃ©rer les jours de judo dans la progression de la veille/jour mÃªme.
- [ ] Ajouter une rÃ¨gle de deload aprÃ¨s douleur rÃ©pÃ©tÃ©e ou fatigue haute.
- [ ] Ajouter une rÃ¨gle de stagnation aprÃ¨s 2-3 maintiens.
- [ ] Stocker l'historique par exercice, pas seulement par sÃ©ance.
- [ ] Afficher l'avant/aprÃ¨s de chaque prescription aprÃ¨s validation.

### Tableau de bord

- [ ] RÃ©duire la liste semaine en aperÃ§u repliable.
- [ ] Ajouter une carte "Ã  faire maintenant".
- [ ] Afficher la prochaine sÃ©ance avec jour/date.
- [ ] Afficher les alertes douleur rÃ©centes.
- [ ] Afficher 2-3 tendances: poids, dÃ©veloppÃ© couchÃ©, cardio.

### Historique

- [ ] Ajouter filtres par exercice, sÃ©ance, semaine, alerte.
- [ ] Ajouter dÃ©tail exercice avec historique de charge/reps.
- [ ] Ajouter graphiques simples.
- [ ] Afficher les dÃ©cisions avec badges colorÃ©s.
- [ ] Ajouter export JSON.

### ParamÃ¨tres

- [ ] Ajouter confirmation avant reset localStorage.
- [ ] Ajouter import JSON.
- [ ] Ajouter Ã©dition du programme.
- [ ] Ajouter prÃ©fÃ©rences de timer et unitÃ©s.
- [ ] Clarifier que l'IA est optionnelle et secondaire.

### Design

- [ ] Remplacer `A/S/H/P` par icÃ´nes lisibles.
- [ ] Harmoniser les couleurs OK vs Facile et Trop dur vs Douleur.
- [ ] Tester le mode sombre sur toutes les pages.
- [ ] RÃ©duire les sections longues sur mobile.
- [ ] Ajouter des Ã©tats visuels: actif, terminÃ©, alerte, progression.
- [ ] Conserver des tailles tactiles de 48 px minimum.

### QualitÃ©

- [ ] Ajouter tests unitaires du moteur de progression.
- [ ] Ajouter tests e2e Playwright pour validation, persistance, douleur, IA dÃ©sactivÃ©e.
- [ ] Ajouter donnÃ©es de test contrÃ´lÃ©es.
- [x] Ajouter gestion d'erreurs localStorage minimale avec backup local.
- [x] Ajouter versioning de schÃ©ma localStorage.

## Stabilisation appliquee le 2026-04-27

- Scripts npm rendus portables.
- `.gitignore` nettoye pour exclure dependances, builds, caches, logs, archives et screenshots QA.
- `.env.example` corrige : aucun modele OpenAI fictif impose.
- Route IA protegee si `OPENAI_MODEL` est absent.
- Theme sombre fixe, toggle inutile retire.
- Error boundary ajoute autour de la page Performances.

## Conclusion

AthletIQ est un MVP solide et dÃ©jÃ  utilisable. Le coeur produit fonctionne: programme local, sÃ©ance du jour, validation, progression, historique, IA optionnelle. Pour passer de 7/10 Ã  10/10, le plus gros levier n'est pas d'ajouter plus d'IA, mais de rendre l'usage en salle beaucoup plus rapide: mode compact, timer, saisie rapide, historique par exercice et progression plus visuelle.

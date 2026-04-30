# Audit de Coach Adaptatif

Date: 2026-04-26

## Méthode d'audit

- Revue mobile sur viewport iPhone 390 x 844.
- Parcours observés: tableau de bord, séance du jour, séance lundi simulée, validation, résumé, historique, paramètres.
- Lecture rapide des composants principaux et du moteur de progression local.
- Aucune modification du code applicatif pendant cet audit.

## Note actuelle

**7/10**

L'application est déjà fonctionnelle, locale, mobile-first et assez claire pour un MVP. Elle permet de démarrer une séance, renseigner les exercices, valider, persister les données et appliquer une progression locale. Elle n'est pas encore au niveau d'une app vraiment agréable à utiliser en salle: le flux de saisie est trop long, le résumé manque de synthèse, certains réglages ne pilotent pas encore la logique, et il manque des outils pratiques de séance comme timer, mode compact, édition rapide et historique visuel.

## Points forts actuels

- Architecture propre: `app`, `components`, `lib`, `data`, `types`.
- MVP complet: séance du jour, validation, historique, paramètres, localStorage.
- Données de départ riches et réalistes pour Sofiane.
- Moteur de progression local prioritaire, avec règles de sécurité douleur/souffle.
- IA optionnelle bien isolée côté serveur: l'app fonctionne sans clé API.
- Design mobile globalement lisible: gros boutons, cartes espacées, bottom nav fixe.
- Boutons de retour colorés: vert pour OK/facile, rouge pour trop dur/douleur, gris pour pas fait.
- Barre de progression visible pendant la séance.
- Tableau de bord utile: séance du jour, prochaine séance, judo, séances semaine, cardio, dernier développé couché.
- Mode sombre présent et simple.
- Build et typecheck déjà corrigés récemment.

## Points faibles actuels

### Ergonomie mobile

- Une séance de 6 exercices génère environ 5 écrans de scroll sur iPhone.
- Chaque exercice affiche tous les champs en permanence, même quand l'utilisateur veut juste valider vite.
- La saisie répétée charge/reps/commentaire sur chaque carte fatigue vite pendant une vraie séance.
- Il n'y a pas de mode "série par série" ni de passage fluide à l'exercice suivant.
- Le bouton "Valider la séance" est tout en bas; sur une grosse séance il faut beaucoup scroller.
- Les champs numériques utilisent des inputs texte simples, sans presets, steppers ou valeurs suggérées.

### Design visuel

- Le style est propre mais encore générique: il manque une identité visuelle plus professionnelle.
- Les lettres `A/S/H/P` dans la navigation remplacent mal de vrais pictogrammes.
- Le tableau de bord mélange résumé du jour, métriques et liste complète de la semaine; c'est utile mais un peu long.
- Les cartes répétées sont très grandes; cela aide la lisibilité mais ralentit la consultation.
- Le mode sombre existe, mais il est basique et pas encore finement testé sur toutes les combinaisons de couleurs.

### Utilisation en séance

- Le flux principal n'aide pas assez quand on est à la salle, pressé, debout, avec les mains occupées.
- Il manque un timer de repos, pourtant essentiel pour force/hypertrophie.
- Il manque un indicateur clair "exercice actuel / exercice suivant".
- Il manque une action rapide "reprendre la charge prévue" ou "copier la dernière performance".
- Il manque une saisie rapide type chips: `5/5/5/5/5`, `10/10/10`, `même charge`, `+2,5 kg`.
- Le commentaire libre est utile mais trop visible par défaut; il devrait être repliable.

### Clarté des boutons

- Les boutons sont grands et faciles à cliquer.
- OK et Facile ont la même couleur principale; ils sont lisibles mais pas assez différenciés.
- "Trop dur" et "Douleur" sont tous deux rouges; c'est cohérent mais la douleur devrait être visuellement plus critique.
- "Pas fait" est clair et large.
- Il manque parfois un état de validation plus évident une fois l'exercice renseigné.

### Lisibilité des exercices

- Nom, consigne, charge, repos et cible sont bien visibles.
- "Prochaine charge" sur la carte active peut prêter à confusion: c'est en réalité la charge prescrite pour la séance actuelle.
- Les exercices sans charge affichent "À définir", ce qui est utile mais un peu vague.
- Les consignes sont bonnes, mais elles prennent de la place sur les longues séances.
- Les exercices principaux ne sont pas visuellement distingués des accessoires.

### Logique de progression

- Le moteur couvre les cas essentiels: OK, Facile, Trop dur, Douleur, Pas fait, cardio, douleur globale, souffle inquiétant.
- Les règles de sécurité sont dans le bon ordre: l'IA ne remplace pas le moteur local.
- Les décisions restent parfois approximatives si l'utilisateur ne renseigne pas de charge.
- La prudence réglable `prudent / normal / agressif` existe dans les paramètres mais ne semble pas encore influencer le moteur.
- Le 1RM développé couché existe dans les paramètres mais n'est pas encore utilisé pour plafonner ou calibrer les progressions.
- La progression ne tient pas encore compte d'un historique multi-séances robuste: tendances, fatigue, stagnation, deload.
- Les remplacements douleur sont codés par mots-clés; utile, mais fragile à long terme.
- L'algorithme ne distingue pas encore clairement les exercices principaux, secondaires, isolation et réhabilitation avec des métadonnées typées.

### Historique

- L'historique stocke les séances et décisions.
- Il manque une vue synthétique par exercice: courbe de charge, volume, meilleure perf, tendance.
- Les décisions sont présentes mais pas encore assez visuelles pour comprendre l'évolution.
- Il n'y a pas de filtre par exercice, semaine, type de séance ou alerte douleur.

### Paramètres

- Les réglages importants sont présents.
- Certains réglages ne pilotent pas encore l'expérience: prudence, 1RM, jours de judo au-delà de l'affichage.
- La réinitialisation localStorage est facile à déclencher; elle devrait demander une confirmation.
- Il manque une exportation/importation des données locales.

## Fonctionnalités manquantes importantes

- Timer de repos avec vibration/son optionnel.
- Mode séance compact: une carte active à la fois.
- Édition du programme depuis l'interface.
- Gestion des charges précédentes par exercice.
- Graphiques poids, développé couché, volume hebdo, cardio.
- Saisie de poids corporel régulière.
- Suivi sommeil/énergie/douleur dans le temps.
- Deload automatique si fatigue, douleur ou stagnation.
- Bibliothèque de remplacements d'exercices.
- Export/import JSON.
- PWA installable sur iPhone.
- Tests e2e versionnés.
- Confirmation avant suppression des données.

## Ce qui rend l'app encore peu professionnelle

- Navigation avec lettres au lieu d'icônes.
- Beaucoup de texte visible dans la séance; il manque une hiérarchie "à faire maintenant".
- Absence de micro-interactions utiles: exercice terminé, repos lancé, progression appliquée.
- Aucun écran dédié "prochaine séance mise à jour" avec avant/après clair.
- Pas de graphiques ni de tendances, donc l'app suit mais ne raconte pas encore la progression.
- Le résumé post-validation est très textuel et peut devenir long.
- Les données IA apparaissent en bloc, sans hiérarchie forte ni distinction du moteur local.
- Certaines valeurs sont modifiables mais pas encore exploitées par la logique.

## Ce qui manque pour être vraiment utile à la salle

- Un mode "en séance" ultra-rapide: un exercice à la fois, boutons énormes, saisie minimale.
- Un timer de repos intégré à chaque validation d'exercice.
- Des valeurs par défaut préremplies: charge prévue, reps attendues, dernière charge utilisée.
- Un bouton "même que prévu" et "même que dernière fois".
- Une indication claire de la prochaine action: "repos 2:30", "exercice suivant", "finir séance".
- Un historique par exercice consultable en 2 secondes.
- Une alerte douleur très visible avec proposition immédiate de variante.
- Une distinction entre exercice principal et accessoire.
- Un résumé de progression simple: "Couché: 90 -> 92,5 kg", pas seulement une phrase.

## Améliorations prioritaires

1. Créer un mode séance compact avec une seule carte active à la fois.
2. Ajouter un timer de repos lié à chaque exercice.
3. Renommer "Prochaine charge" en "Charge prévue" pendant la séance, puis afficher la vraie prochaine charge dans le résumé.
4. Préremplir la charge utilisée avec la charge prévue quand elle existe.
5. Ajouter des boutons de saisie rapide: même charge, reps validées, +1 rep, commentaire repliable.
6. Faire influencer le moteur par le niveau de prudence, le 1RM et les jours de judo.
7. Ajouter une confirmation avant réinitialisation des données.
8. Remplacer les lettres de navigation par de vrais pictogrammes.
9. Ajouter une vue historique par exercice.
10. Améliorer le résumé post-validation avec des cartes avant/après.

## Checklist précise pour atteindre 10/10

### Expérience séance

- [ ] Afficher une seule carte exercice active par défaut.
- [ ] Ajouter une liste compacte des exercices en haut ou en bas.
- [ ] Ajouter un bouton "Exercice suivant".
- [ ] Ajouter un timer repos configurable par exercice.
- [ ] Lancer automatiquement le timer après OK/Facile/Trop dur si l'exercice est renseigné.
- [ ] Ajouter des actions rapides: "prévu", "même charge", "toutes reps faites", "pas de commentaire".
- [ ] Rendre le commentaire replié par défaut.
- [ ] Afficher un état clair "terminé" sur chaque exercice.
- [ ] Garder un bouton de validation final sticky en bas quand tous les exercices sont notés.

### Progression

- [ ] Brancher `cautionLevel` dans `calculateProgression`.
- [ ] Brancher `benchOneRepMaxKg` pour calibrer les hausses du développé couché.
- [ ] Ajouter des métadonnées typées par exercice: catégorie, priorité, articulation sensible, charge incrémentale.
- [ ] Gérer les jours de judo dans la progression de la veille/jour même.
- [ ] Ajouter une règle de deload après douleur répétée ou fatigue haute.
- [ ] Ajouter une règle de stagnation après 2-3 maintiens.
- [ ] Stocker l'historique par exercice, pas seulement par séance.
- [ ] Afficher l'avant/après de chaque prescription après validation.

### Tableau de bord

- [ ] Réduire la liste semaine en aperçu repliable.
- [ ] Ajouter une carte "à faire maintenant".
- [ ] Afficher la prochaine séance avec jour/date.
- [ ] Afficher les alertes douleur récentes.
- [ ] Afficher 2-3 tendances: poids, développé couché, cardio.

### Historique

- [ ] Ajouter filtres par exercice, séance, semaine, alerte.
- [ ] Ajouter détail exercice avec historique de charge/reps.
- [ ] Ajouter graphiques simples.
- [ ] Afficher les décisions avec badges colorés.
- [ ] Ajouter export JSON.

### Paramètres

- [ ] Ajouter confirmation avant reset localStorage.
- [ ] Ajouter import JSON.
- [ ] Ajouter édition du programme.
- [ ] Ajouter préférences de timer et unités.
- [ ] Clarifier que l'IA est optionnelle et secondaire.

### Design

- [ ] Remplacer `A/S/H/P` par icônes lisibles.
- [ ] Harmoniser les couleurs OK vs Facile et Trop dur vs Douleur.
- [ ] Tester le mode sombre sur toutes les pages.
- [ ] Réduire les sections longues sur mobile.
- [ ] Ajouter des états visuels: actif, terminé, alerte, progression.
- [ ] Conserver des tailles tactiles de 48 px minimum.

### Qualité

- [ ] Ajouter tests unitaires du moteur de progression.
- [ ] Ajouter tests e2e Playwright pour validation, persistance, douleur, IA désactivée.
- [ ] Ajouter données de test contrôlées.
- [ ] Ajouter gestion d'erreurs localStorage.
- [ ] Ajouter versioning de schéma localStorage.

## Conclusion

Coach Adaptatif est un MVP solide et déjà utilisable. Le coeur produit fonctionne: programme local, séance du jour, validation, progression, historique, IA optionnelle. Pour passer de 7/10 à 10/10, le plus gros levier n'est pas d'ajouter plus d'IA, mais de rendre l'usage en salle beaucoup plus rapide: mode compact, timer, saisie rapide, historique par exercice et progression plus visuelle.

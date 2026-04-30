# Coach Adaptatif

Web-app mobile-first en Next.js, TypeScript et Tailwind CSS.

## Lancer le projet

```bash
npm install
npm run dev
```

Puis ouvrir `http://localhost:3000`.

Vérifier la production :

```bash
npm run build
```

## MVP inclus

- Détection automatique du jour de la semaine
- Séance prévue du jour
- Page Programme pour consulter toute la semaine sans lancer le chrono
- Page Mes performances pour suivre records, dernières charges, volumes, tendances et prochaines cibles
- Démarrage et suivi de séance
- Cartes d'exercices avec statut, charge, répétitions et commentaire
- Validation de séance
- Historique et paramètres
- Persistance locale via `localStorage`

## Utiliser la page Programme

La page `Programme` sert uniquement à consulter le planning sportif.

- Voir la séance du jour et les séances de toute la semaine
- Ouvrir le détail d'une séance avec exercices, séries, charges prévues, repos et consignes
- Démarrer explicitement une séance avec `Commencer cette séance`

Consulter le programme ne démarre pas le chrono et ne crée aucune entrée d'historique. Le chrono démarre seulement depuis le bouton `Commencer`.

## Utiliser la page Mes performances

La page `/performances` lit l'historique local et affiche un tableau de bord d'athlète :

- dernières performances et meilleurs records
- prochaine cible prévue par le programme ajusté
- volume calculé quand charge, séries et répétitions sont disponibles
- tendances : progression, stable, régression, douleur ou pas assez de données
- top progressions, signaux à surveiller et prochaines cibles importantes

Si aucune séance n'a encore été validée, la page affiche un état vide propre.

## Activer l'IA optionnelle

L'app fonctionne sans IA. Le moteur local reste prioritaire pour les décisions et alertes de sécurité.

1. Copier `.env.example` vers `.env.local`
2. Ajouter une clé serveur :

```bash
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
```

3. Redémarrer `npm run dev`
4. Activer l'IA dans Paramètres

La clé ne doit jamais être exposée côté client. La route serveur utilisée est `/api/coach`.
"# athletIQ" 

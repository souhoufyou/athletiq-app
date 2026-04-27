# DESIGN_SYSTEM - AthletIQ

Direction : application mobile-first sombre, sportive, premium, orientee coaching et performance. Aucun nom, logo ou element de marque externe n'est utilise.

## Identite

- Nom : `AthletIQ`
- Wordmark : texte simple `AthletIQ`, blanc, graisse forte
- Icone temporaire : A stylise noir sur carre orange
- Ton visuel : premium, direct, sportif, dense mais lisible
- Palette dominante : noir/antracite avec orange pour l'action

## Palette principale

- Fond app : `#06070a`
- Fond secondaire : `#0b0d11`
- Surface carte : `#111318` vers `#202329`
- Surface douce : `#151820`
- Texte principal : `#f8fafc`
- Texte secondaire : `rgba(248, 250, 252, 0.64)`
- Bordures : `rgba(255, 255, 255, 0.10)`

## Accents

- Orange action : `#ff4d00`
- Orange principal : `#ff7a18`
- Orange chaud : `#ff8a1f`
- Vert reussite : `#24c07a`
- Rouge douleur / alerte : `#ff4d4d`
- Gris stable : `#9aa3ad`

## Couleurs d'etat

- Reussite / OK / Facile : vert sur fond transparent.
- Progression / prochaine cible : orange vif sur fond orange transparent.
- Information : orange doux ou gris clair selon importance.
- Trop dur / douleur / alerte : rouge ou corail.
- Pas fait / stable / donnees insuffisantes : gris sur surface sombre.

## Ergonomie iPhone

- Largeur cible : experience optimisee autour de `390-430px`.
- Navigation basse : 5 onglets maximum, libelle court, icone visible, zone active large.
- Boutons tactiles : `48-64px` de hauteur, action principale plus grande.
- Mode seance : timer sticky visible, gros retours rapides, navigation precedente/suivante au pouce.
- Textes : courts, hierarchie forte, pas de paragraphes longs dans les zones d'action.
- Inputs : `16px` minimum pour eviter le zoom iOS.
- Safe area : la zone basse garde de l'espace pour le geste iPhone.

## Espacement

- Padding ecran mobile : `16px`
- Ecart vertical entre sections : `16px`
- Padding carte standard : `16px`
- Padding carte hero : `20px`
- Rayon cartes : `16-24px`
- Navigation basse : environ `70px` + safe area

## Typographie

- Police : system sans-serif moderne (`Inter`, `system-ui`, `Segoe UI`)
- Hero : `32-36px`, graisse `900`, letter-spacing `0`
- Titre section : `20-24px`, graisse `900`, letter-spacing `0`
- Titre carte : `16-20px`, graisse `900`, letter-spacing `0`
- Texte courant : `14-16px`, graisse `600`
- Labels / badges : `10-12px`, graisse forte, letter-spacing `0`

## Composants UI principaux

- Cartes : surface sombre, bordure fine, ombre noire, coins arrondis.
- Cartes hero : fond noir/antracite avec accent orange lineaire, CTA orange.
- Boutons primaires : degrade orange `#ff8a1f` vers `#ff4d00`, texte blanc.
- Boutons secondaires : surface sombre, bordure blanche faible, texte blanc.
- Badges : petites capsules contrastees, couleur d'etat claire.
- Inputs : fond `#0e1015`, bordure claire 10 %, focus orange.
- Navigation basse : fond sombre translucide, onglet actif orange.

## Pages

- Dashboard : premiere information = seance du jour + action rapide.
- Seance : une main, timer visible, retours rapides, peu de scroll pendant l'effort.
- Programme : planning scannable, detail seance clair, pas de lancement accidentel.
- Performances : cartes denses, records et prochaines cibles en priorite.
- Historique : lecture chronologique, duree, calories estimees, decisions locales.
- Parametres : profil modifiable sans refaire l'onboarding.
- Onboarding : court, mobile-first, progression visible, boutons larges.

## Principes UX

- Une action principale par bloc.
- Aucun chrono ne demarre sans clic explicite.
- Les retours de seance doivent rester faisables en moins de 5 secondes.
- Les alertes douleur doivent etre visibles et impossibles a confondre avec une progression.
- Les donnees importantes doivent tenir dans le premier viewport quand possible.
- L'app doit rester utilisable sans IA et sans compte.

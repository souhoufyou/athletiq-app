# DESIGN_SYSTEM - Coach Adaptatif

Direction : application mobile-first sombre, sportive, premium, orientee performance. L'image de reference sert uniquement d'inspiration d'ambiance : aucun nom, logo ou element de marque externe n'est repris.

## Palette principale

- Fond app : `#08090b`
- Fond secondaire : `#0d0f12`
- Surface carte : `#14161b` vers `#202329`
- Surface douce : `#1a1d22`
- Texte principal : `#f6f7f8`
- Texte secondaire : `rgba(246, 247, 248, 0.62)`
- Bordures : `rgba(255, 255, 255, 0.10)`

## Accents

- Orange action : `#ff5a00`
- Orange progression : `#ff7a18`
- Orange chaud / badge : `#ff9f1a`
- Vert reussite : `#24c07a`
- Rouge douleur / alerte : `#ff4d4d`
- Gris stable : `#9aa3ad`

## Couleurs d'etat

- Reussite / OK / Facile : vert sur fond vert transparent.
- Progression / prochaine cible : orange vif sur fond orange transparent.
- Information : orange doux ou gris clair selon importance.
- Trop dur / douleur / alerte : rouge ou corail, jamais orange pour eviter la confusion avec une progression.
- Pas fait / stable / donnees insuffisantes : gris sur surface sombre.

## Espacement

- Padding ecran mobile : `16px`, `24px` sur large mobile.
- Ecart vertical entre sections : `16px`.
- Padding carte standard : `16px`.
- Padding carte hero : `20px`.
- Boutons tactiles : `48-64px` de hauteur.
- Navigation basse : hauteur minimale `60px` + safe area iPhone.

## Typographie

- Police : system sans-serif moderne (`Inter`, `system-ui`, `Segoe UI`).
- H1 page : `30-32px`, graisse `900`.
- H2 section : `22-24px`, graisse `900`.
- Titre carte : `18-22px`, graisse `900`.
- Texte courant : `14-16px`, graisse `600`.
- Labels / badges : `10-12px`, uppercase, graisse `900`, sans letter-spacing force.

## Composants UI principaux

- Cartes : fond sombre degrade, bordure blanche 10 %, ombre noire douce, coins `16-24px`.
- Cartes hero : fond noir/antracite avec halo orange lineaire subtil, texte blanc, CTA orange.
- Boutons primaires : degrade orange `#ff7a18` vers `#ff4d00`, texte blanc, ombre orange faible.
- Boutons secondaires : surface sombre, bordure blanche faible, texte blanc.
- Badges : petites capsules contrastees, couleur d'etat claire.
- Inputs : fond `#101216`, bordure claire 10 %, focus orange.
- Graphiques : lignes/barres orange pour progression, vert pour hausse validee, gris pour stable, rouge pour alerte.
- Navigation basse : fond sombre translucide, actif en orange, icone et libelle visibles au pouce.

## Sections dashboard

- Le premier ecran doit mettre en avant l'action utile : seance du jour, charge principale, duree, puis CTA.
- Les mini-statistiques restent courtes : valeur forte, label discret.
- Les sections secondaires doivent rester scannables, pas decoratives.

## Etats vides

- Fond carte sombre.
- Titre direct : ce qui manque.
- Texte court : quelle action cree la donnee.
- Pas d'illustration obligatoire pour conserver la rapidite.

## Principes UX mobile

- Une action principale par bloc.
- Aucun demarrage de chrono sans clic explicite sur `Commencer`.
- Les retours de seance doivent rester utilisables en moins de 5 secondes.
- Les alertes douleur doivent etre visibles, sobres et impossibles a confondre avec une progression.
- Les donnees importantes doivent tenir dans le premier viewport quand possible.
- Priorite au contraste, aux gros boutons, et a la lisibilite en salle.


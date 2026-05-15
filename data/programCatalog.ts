import type { Exercise, ProgramTemplate } from "@/types/training";

function ex(
  id: string,
  name: string,
  target: string,
  rest: string,
  cue: string,
  plannedLoad?: string
): Exercise {
  return { id, name, target, rest, cue, plannedLoad };
}

export const PROGRAM_CATALOG: ProgramTemplate[] = [
  {
    id: "full-body-progression-3j",
    name: "Full Body Progression",
    description: "Programme 3 jours pour debutant ou reprise, centre sur les mouvements de base, la technique et une progression durable.",
    level: "debutant",
    primaryObjective: "recomposition",
    secondaryObjectives: ["sante", "force", "perte-gras"],
    frequency: 3,
    averageDuration: "45-60 min",
    requiredEquipment: ["salle-complete", "halteres-maison"],
    contraindications: ["douleur vive non exploree", "mouvement qui augmente une douleur articulaire"],
    tags: ["debutant", "recomposition", "sante", "force", "machines"],
    weeklyStructure: ["Full body A", "Repos ou marche", "Full body B", "Repos", "Full body C", "Marche douce", "Repos"],
    sessions: [
      {
        id: "fullbody-a",
        weekday: "monday",
        title: "Full body A",
        focus: "Base technique haut/bas du corps",
        duration: "45-55 min",
        intensity: "Modérée",
        exercises: [
          ex("fb-a-leg-press", "Presse a cuisses", "3 x 10-12", "90 s", "Amplitude controlee, bas du dos colle."),
          ex("fb-a-chest-press", "Chest press machine", "3 x 10-12", "90 s", "Omoplates stables, pousse sans verrouiller brutalement."),
          ex("fb-a-pulldown", "Tirage vertical", "3 x 10-12", "90 s", "Poitrine haute, tire les coudes vers les cotes."),
          ex("fb-a-leg-curl", "Leg curl", "2-3 x 12-15", "75 s", "Controle la descente."),
          ex("fb-a-core", "Pallof press", "2 x 10-12 par cote", "45 s", "Reste grand, bassin stable."),
          ex("fb-a-cardio", "Marche inclinee zone 2", "10-15 min", "Libre", "Souffle facile, conversation possible.")
        ]
      },
      {
        id: "fullbody-b",
        weekday: "wednesday",
        title: "Full body B",
        focus: "Charniere hanche, dos et epaules",
        duration: "45-55 min",
        intensity: "Modérée",
        exercises: [
          ex("fb-b-hip-thrust", "Hip thrust", "3 x 10-12", "90 s", "Pause en haut, contraction fessiers."),
          ex("fb-b-row", "Rowing machine poitrine appuyee", "3 x 10-12", "90 s", "Tire avec le dos sans hausser les epaules."),
          ex("fb-b-shoulder-press", "Developpe epaules machine", "2-3 x 10-12", "90 s", "Mouvement fluide, pas de douleur."),
          ex("fb-b-leg-extension", "Leg extension", "2-3 x 12-15", "75 s", "Contraction en haut, descente lente."),
          ex("fb-b-curl", "Curl cable", "2 x 12-15", "60 s", "Coudes fixes."),
          ex("fb-b-bike", "Velo facile", "10-15 min", "Libre", "Cadence reguliere.")
        ]
      },
      {
        id: "fullbody-c",
        weekday: "friday",
        title: "Full body C",
        focus: "Volume simple et consolidation",
        duration: "50-60 min",
        intensity: "Modérée",
        exercises: [
          ex("fb-c-goblet", "Goblet squat", "3 x 10-12", "90 s", "Talons au sol, buste solide."),
          ex("fb-c-incline-db", "Developpe incline halteres", "3 x 8-10", "90 s", "Descente controlee, poignets neutres."),
          ex("fb-c-row-cable", "Rowing poulie basse", "3 x 10-12", "90 s", "Tire les coudes en arriere."),
          ex("fb-c-rdl-db", "Souleve de terre roumain halteres", "3 x 10", "90 s", "Hanches en arriere, dos neutre."),
          ex("fb-c-lateral", "Elevations laterales", "2-3 x 12-15", "60 s", "Monte proprement, sans elan."),
          ex("fb-c-cardio", "Elliptique zone 2", "12-18 min", "Libre", "Rythme facile a tenir.")
        ]
      }
    ],
    progressionRules: {
      method: "technique-first",
      loadStepKg: { compoundUpper: 2.5, compoundLower: 5, isolation: 1 },
      notes: ["Valider la technique avant la charge.", "Ajouter des reps avant d'ajouter du poids."]
    },
    cardioRules: {
      allowedModalities: ["marche inclinee", "velo", "elliptique"],
      method: "duration-first",
      maxSingleChange: "duration",
      notes: ["Ajouter 2 a 5 minutes quand le souffle reste facile."]
    },
    replacementRules: {
      preferEquipment: ["salle-complete", "halteres-maison"],
      rules: ["Remplacer par le meme pattern moteur avec moins de contrainte articulaire."]
    },
    guardrails: {
      contraindications: ["pas d'echec volontaire", "stop si douleur vive"],
      deloadEveryWeeks: 5,
      painRules: ["Douleur articulaire persistante: baisser charge et choisir variante guidee."]
    }
  },
  {
    id: "upper-lower-recomposition-4j",
    name: "Upper / Lower Recomposition",
    description: "Programme 4 jours pour intermediaire, equilibre entre force, volume et cardio zone 2.",
    level: "intermediaire",
    primaryObjective: "recomposition",
    secondaryObjectives: ["force", "perte-gras", "cardio-sante"],
    frequency: 4,
    averageDuration: "55-70 min",
    requiredEquipment: ["salle-complete"],
    contraindications: ["douleur epaule non geree", "incapacite a recuperer sur 4 seances"],
    tags: ["recomposition", "force", "cardio", "machines"],
    weeklyStructure: ["Upper force", "Lower force", "Repos", "Upper volume", "Lower volume + cardio", "Marche", "Repos"],
    sessions: [
      {
        id: "upper-force",
        weekday: "monday",
        title: "Upper force",
        focus: "Poussee/tirage lourds controles",
        duration: "60-70 min",
        intensity: "Soutenue",
        exercises: [
          ex("ul-bench", "Developpe couche", "4 x 5-6", "3 min", "Pause controlee, trajectoire stable."),
          ex("ul-row-heavy", "Rowing poitrine appuyee", "4 x 6-8", "2 min", "Tire fort sans decoller le buste."),
          ex("ul-incline", "Developpe incline machine", "3 x 8-10", "90 s", "Amplitude confortable."),
          ex("ul-pulldown", "Tirage vertical", "3 x 8-10", "90 s", "Poitrine haute."),
          ex("ul-lateral", "Elevations laterales", "3 x 12-15", "60 s", "Controle strict."),
          ex("ul-facepull", "Face pull", "3 x 15-20", "45-60 s", "Posture et arriere d'epaule.")
        ]
      },
      {
        id: "lower-force",
        weekday: "tuesday",
        title: "Lower force",
        focus: "Quadriceps, chaine posterieure, tronc",
        duration: "60-70 min",
        intensity: "Soutenue",
        exercises: [
          ex("ul-leg-press", "Presse a cuisses", "4 x 8-10", "2-3 min", "Amplitude solide, pas d'arrondi lombaire."),
          ex("ul-rdl", "Souleve de terre roumain", "4 x 6-8", "2-3 min", "Hanches en arriere, dos neutre."),
          ex("ul-leg-curl", "Leg curl", "3 x 10-12", "90 s", "Controle la phase retour."),
          ex("ul-leg-extension", "Leg extension", "3 x 12-15", "75 s", "Contraction en haut."),
          ex("ul-calf", "Mollets debout", "4 x 12-15", "60 s", "Pause en haut."),
          ex("ul-core", "Pallof press", "3 x 12 par cote", "45 s", "Anti-rotation propre.")
        ]
      },
      {
        id: "upper-volume",
        weekday: "thursday",
        title: "Upper volume",
        focus: "Hypertrophie haut du corps",
        duration: "55-65 min",
        intensity: "Modérée",
        exercises: [
          ex("ul-chest-press", "Chest press convergente", "3 x 10-12", "90 s", "Cherche la congestion sans echec."),
          ex("ul-row-cable", "Rowing poulie basse", "4 x 10-12", "90 s", "Dos avant les bras."),
          ex("ul-cable-fly", "Ecarte poulie", "3 x 12-15", "60 s", "Etirement confortable."),
          ex("ul-reverse-pec", "Reverse pec deck", "3 x 15-20", "60 s", "Arriere d'epaule strict."),
          ex("ul-curl", "Curl pupitre", "3 x 10-12", "60 s", "Amplitude complete."),
          ex("ul-triceps", "Triceps poulie corde", "3 x 12-15", "60 s", "Extension complete.")
        ]
      },
      {
        id: "lower-cardio",
        weekday: "friday",
        title: "Lower volume + cardio",
        focus: "Jambes volume et zone 2",
        duration: "60-70 min",
        intensity: "Modérée",
        exercises: [
          ex("ul-hack", "Hack squat machine", "3 x 10-12", "2 min", "Pieds stables, controle."),
          ex("ul-hip-thrust", "Hip thrust", "4 x 8-12", "2 min", "Pause en haut."),
          ex("ul-seated-curl", "Leg curl assis", "3 x 12-15", "75 s", "Ischios sous tension."),
          ex("ul-abductor", "Abducteurs machine", "3 x 15-20", "60 s", "Controle, pas d'elan."),
          ex("ul-incline-walk", "Tapis incline zone 2", "20-25 min", "Libre", "Augmenter duree ou inclinaison, pas les deux.")
        ]
      }
    ],
    progressionRules: {
      method: "double-progression",
      loadStepKg: { compoundUpper: 2.5, compoundLower: 5, isolation: 1, machineUpper: 2.5, machineLower: 5 },
      notes: ["Monter la charge quand toutes les series atteignent le haut de fourchette.", "Isolation: reps d'abord."]
    },
    cardioRules: {
      allowedModalities: ["tapis incline", "velo", "rameur doux"],
      method: "duration-first",
      maxSingleChange: "duration",
      notes: ["Zone 2 stable, progression par petites marches."]
    },
    replacementRules: {
      preferEquipment: ["salle-complete"],
      rules: ["Si douleur epaule: machine convergente ou poulie.", "Si bas du dos fatigue: rowing poitrine appuyee."]
    },
    guardrails: {
      contraindications: ["pas de HIIT impose", "pas de progression si sommeil et energie chutent"],
      deloadEveryWeeks: 5,
      painRules: ["Douleur > 3/10: maintenir ou baisser la prochaine exposition."]
    }
  },
  {
    id: "ppl-upper-lower-5j",
    name: "Push Pull Legs Upper Lower",
    description: "Programme avance pour la recomposition: force au developpe couche, volume intelligent et cardio sans course.",
    level: "avance",
    primaryObjective: "recomposition",
    secondaryObjectives: ["force", "perte-gras", "cardio-sante"],
    frequency: 5,
    averageDuration: "60-75 min",
    requiredEquipment: ["salle-complete"],
    contraindications: ["douleur poignet ignoree", "incapacite a recuperer sur 5 seances"],
    tags: ["homme", "recomposition", "force", "cardio", "machines"],
    weeklyStructure: ["Push force", "Pull + zone 2", "Legs machines", "Upper volume", "Lower leger + bras/epaules", "Option recovery", "Repos actif"],
    sessions: [
      {
        id: "push-force",
        weekday: "monday",
        title: "Push force",
        focus: "Developpe couche prioritaire, pectoraux, epaules, triceps",
        duration: "60-70 min",
        intensity: "Soutenue",
        exercises: [
          ex("sof-bench", "Developpe couche", "5 x 3-5", "3 min", "Objectif force propre, poignet neutre, aucune rep grindee.", "Charge calibree"),
          ex("sof-incline-machine", "Developpe incline machine", "4 x 8-10", "2 min", "Poussee stable, amplitude confortable."),
          ex("sof-chest-press", "Chest press convergente", "3 x 8-12", "90 s", "Garder 1-2 reps en reserve."),
          ex("sof-lateral", "Elevations laterales", "4 x 12-20", "60 s", "Reps strictes, charge secondaire."),
          ex("sof-triceps", "Triceps poulie corde", "3 x 10-15", "60 s", "Extension complete sans casser le poignet."),
          ex("sof-facepull", "Face pull", "3 x 15-20", "45-60 s", "Posture, omoplates et arriere d'epaule.")
        ]
      },
      {
        id: "pull-cardio",
        weekday: "tuesday",
        title: "Pull + cardio zone 2",
        focus: "Dos dense, biceps, souffle facile",
        duration: "65-75 min",
        intensity: "Soutenue",
        exercises: [
          ex("sof-pulldown", "Tirage vertical", "4 x 8-10", "90 s", "Poitrine haute, tirage propre."),
          ex("sof-chest-row", "Rowing poitrine appuyee", "4 x 8-10", "2 min", "Charge lourde mais controlee."),
          ex("sof-cable-row", "Rowing poulie basse", "3 x 10-12", "90 s", "Dos avant les bras."),
          ex("sof-pullover", "Pullover poulie", "3 x 12-15", "60 s", "Grand dorsal, bras presque tendus."),
          ex("sof-reverse", "Reverse pec deck", "3 x 15-20", "60 s", "Arriere d'epaule sans elan."),
          ex("sof-curl", "Curl pupitre ou cable", "3 x 10-12", "60 s", "Poignet neutre."),
          ex("sof-cardio-z2", "Tapis incline zone 2", "20-30 min", "Libre", "Progression cardio: duree OU inclinaison OU vitesse.")
        ]
      },
      {
        id: "legs-machines",
        weekday: "wednesday",
        title: "Legs machines",
        focus: "Jambes lourdes sans squat barre obligatoire",
        duration: "65-75 min",
        intensity: "Soutenue",
        exercises: [
          ex("sof-leg-press", "Presse a cuisses", "5 x 8-10", "2-3 min", "Amplitude solide, progression controlee."),
          ex("sof-hack", "Hack squat ou pendulum squat", "4 x 8-10", "2 min", "Choisir la machine la plus stable."),
          ex("sof-hip-thrust", "Hip thrust", "4 x 8-12", "2 min", "Pause en haut, bassin stable."),
          ex("sof-leg-curl", "Leg curl", "4 x 10-15", "75 s", "Ischios sous controle."),
          ex("sof-leg-extension", "Leg extension", "3 x 12-15", "75 s", "Contraction quadriceps."),
          ex("sof-calf", "Mollets", "4 x 12-20", "60 s", "Pause haute et basse."),
          ex("sof-core", "Gainage anti-extension", "3 x 30-45 sec", "45 s", "Respiration controlee.")
        ]
      },
      {
        id: "upper-volume",
        weekday: "thursday",
        title: "Upper volume",
        focus: "Frequence haut du corps et rappel technique",
        duration: "60-70 min",
        intensity: "Modérée",
        exercises: [
          ex("sof-bench-tech", "Developpe couche technique", "4 x 6 a 70-75%", "2 min", "Vitesse, trajectoire, zero echec."),
          ex("sof-pulldown-2", "Tirage vertical prise neutre", "4 x 10-12", "90 s", "Controle complet."),
          ex("sof-row-2", "Rowing machine", "4 x 10-12", "90 s", "Volume propre."),
          ex("sof-pecdeck", "Pec deck ou ecarte poulie", "3 x 12-15", "60 s", "Etirement confortable."),
          ex("sof-shoulders", "Elevations laterales cable", "4 x 12-20", "60 s", "Tension continue."),
          ex("sof-arms", "Superset curl cable + triceps poulie", "3 x 12-15", "60 s", "Bras sans douleur poignet."),
          ex("sof-cardio-rower", "Rameur zone 2", "12-20 min", "Libre", "Rythme propre, pas de sprint impose.")
        ]
      },
      {
        id: "lower-light-accessories",
        weekday: "friday",
        title: "Lower leger + epaules/bras",
        focus: "Bas du corps modere, mobilite et accessoires",
        duration: "50-65 min",
        intensity: "Modérée",
        exercises: [
          ex("sof-leg-curl-light", "Leg curl", "3 x 12-15", "75 s", "Qualite avant charge."),
          ex("sof-split-squat", "Split squat guide ou presse unilaterale", "3 x 10-12 par jambe", "90 s", "Amplitude controlee."),
          ex("sof-abductor", "Abducteurs machine", "3 x 15-20", "60 s", "Controle et brulure propre."),
          ex("sof-rear-delt", "Oiseau machine ou reverse pec deck", "3 x 15-20", "60 s", "Posture."),
          ex("sof-curl-hammer", "Curl marteau", "3 x 10-12", "60 s", "Poignet neutre."),
          ex("sof-triceps-2", "Extension triceps cable", "3 x 12-15", "60 s", "Controle."),
          ex("sof-stairmaster", "Stairmaster facile", "10-15 min", "Libre", "Optionnel si recuperation OK.")
        ]
      }
    ],
    progressionRules: {
      method: "double-progression",
      loadStepKg: { compoundUpper: 2.5, compoundLower: 5, isolation: 1, machineUpper: 2.5, machineLower: 5 },
      notes: [
        "Developpe couche: +2.5 kg si toutes les series sont propres.",
        "+5 kg uniquement si tres facile, sans douleur et recuperation correcte.",
        "Machines jambes: +5 a 10 kg selon marge.",
        "Isolation: haut de fourchette avant charge."
      ]
    },
    cardioRules: {
      allowedModalities: ["tapis incline", "rameur", "stairmaster", "velo"],
      method: "duration-first",
      maxSingleChange: "duration",
      notes: ["Une seule variable a la fois: duree OU inclinaison OU vitesse."]
    },
    replacementRules: {
      preferEquipment: ["salle-complete"],
      rules: ["Poignet sensible: preferer machines, prises neutres et poulies.", "Squat barre non obligatoire: remplacer par presse, hack squat ou pendulum."]
    },
    guardrails: {
      contraindications: ["pas de course obligatoire", "pas de pompes obligatoires", "pas de bloc d'echec sur le developpe couche"],
      deloadEveryWeeks: 4,
      painRules: ["Douleur poignet: stop sur barre droite et bascule prise neutre/machine.", "Fatigue systemique: retirer cardio intense et garder zone 2."]
    }
  },
  {
    id: "push-pull-legs-classique-6j",
    name: "Push Pull Legs Classique",
    description: "Split 6 jours hypertrophie pour pratiquant experimente qui recupere bien et veut une frequence elevee.",
    level: "avance",
    primaryObjective: "prise-masse",
    secondaryObjectives: ["force", "recomposition"],
    frequency: 6,
    averageDuration: "55-75 min",
    requiredEquipment: ["salle-complete"],
    contraindications: ["recuperation faible", "douleurs multiples non gerees"],
    tags: ["prise-masse", "force", "machines"],
    weeklyStructure: ["Push A", "Pull A", "Legs A", "Push B", "Pull B", "Legs B", "Repos"],
    sessions: [
      {
        id: "push-a",
        weekday: "monday",
        title: "Push A",
        focus: "Pectoraux lourds et triceps",
        duration: "60-70 min",
        intensity: "Soutenue",
        exercises: [
          ex("ppl6-bench", "Developpe couche", "4 x 5-8", "3 min", "Base force."),
          ex("ppl6-incline", "Developpe incline halteres", "4 x 8-10", "2 min", "Amplitude complete."),
          ex("ppl6-dips-machine", "Dips assiste machine ou chest press", "3 x 8-12", "90 s", "Sans douleur epaule."),
          ex("ppl6-lateral", "Elevations laterales", "4 x 12-20", "60 s", "Strict."),
          ex("ppl6-triceps", "Barre au front cable", "3 x 10-12", "75 s", "Coudes stables.")
        ]
      },
      {
        id: "pull-a",
        weekday: "tuesday",
        title: "Pull A",
        focus: "Dos epaisseur",
        duration: "60-70 min",
        intensity: "Soutenue",
        exercises: [
          ex("ppl6-pullup", "Tractions ou tirage vertical lourd", "4 x 6-8", "2 min", "Tirage puissant."),
          ex("ppl6-row-bar", "Rowing barre ou machine", "4 x 6-10", "2 min", "Dos solide."),
          ex("ppl6-row-cable", "Rowing poulie", "3 x 10-12", "90 s", "Volume propre."),
          ex("ppl6-reverse", "Reverse pec deck", "4 x 15-20", "60 s", "Arriere epaules."),
          ex("ppl6-curl", "Curl barre EZ", "3 x 8-12", "75 s", "Controle.")
        ]
      },
      {
        id: "legs-a",
        weekday: "wednesday",
        title: "Legs A",
        focus: "Quadriceps lourd",
        duration: "65-75 min",
        intensity: "Soutenue",
        exercises: [
          ex("ppl6-squat", "Squat ou hack squat", "4 x 5-8", "3 min", "Mouvement principal."),
          ex("ppl6-leg-press", "Presse a cuisses", "4 x 10", "2 min", "Volume quadriceps."),
          ex("ppl6-extension", "Leg extension", "4 x 12-15", "75 s", "Contraction."),
          ex("ppl6-curl", "Leg curl", "3 x 10-12", "90 s", "Equilibre ischios."),
          ex("ppl6-calf", "Mollets", "5 x 10-15", "60 s", "Amplitude complete.")
        ]
      },
      {
        id: "push-b",
        weekday: "thursday",
        title: "Push B",
        focus: "Epaules et volume pecs",
        duration: "55-65 min",
        intensity: "Modérée",
        exercises: [
          ex("ppl6-shoulder", "Developpe epaules machine", "4 x 6-10", "2 min", "Poussee controlee."),
          ex("ppl6-chest-press", "Chest press", "3 x 10-12", "90 s", "Volume pectoraux."),
          ex("ppl6-fly", "Ecarte poulie", "3 x 12-15", "60 s", "Etirement."),
          ex("ppl6-lateral-b", "Elevations laterales cable", "4 x 12-20", "60 s", "Tension continue."),
          ex("ppl6-triceps-b", "Triceps corde", "4 x 10-15", "60 s", "Volume triceps.")
        ]
      },
      {
        id: "pull-b",
        weekday: "friday",
        title: "Pull B",
        focus: "Largeur dos et biceps",
        duration: "55-65 min",
        intensity: "Modérée",
        exercises: [
          ex("ppl6-pulldown-b", "Tirage vertical prise neutre", "4 x 10-12", "90 s", "Largeur."),
          ex("ppl6-row-chest", "Rowing poitrine appuyee", "4 x 10-12", "90 s", "Controle."),
          ex("ppl6-pullover", "Pullover poulie", "3 x 12-15", "60 s", "Dorsaux."),
          ex("ppl6-shrug", "Shrugs machine", "3 x 10-12", "75 s", "Trapeces sans elan."),
          ex("ppl6-curl-b", "Curl incline", "3 x 10-12", "60 s", "Biceps etirement.")
        ]
      },
      {
        id: "legs-b",
        weekday: "saturday",
        title: "Legs B",
        focus: "Posterior chain et fessiers",
        duration: "60-75 min",
        intensity: "Soutenue",
        exercises: [
          ex("ppl6-rdl", "Souleve de terre roumain", "4 x 6-10", "2-3 min", "Hinge lourd propre."),
          ex("ppl6-hip", "Hip thrust", "4 x 8-12", "2 min", "Fessiers."),
          ex("ppl6-curl-b", "Leg curl assis", "4 x 10-15", "75 s", "Ischios."),
          ex("ppl6-lunge", "Fentes marchées ou presse unilaterale", "3 x 10 par jambe", "90 s", "Controle."),
          ex("ppl6-calf-b", "Mollets assis", "4 x 12-20", "60 s", "Volume.")
        ]
      }
    ],
    progressionRules: {
      method: "double-progression",
      loadStepKg: { compoundUpper: 2.5, compoundLower: 5, isolation: 1, machineUpper: 2.5, machineLower: 5 },
      notes: ["Progression volume/charge par cycle.", "Deload obligatoire si performance baisse plusieurs seances."]
    },
    cardioRules: {
      allowedModalities: ["marche inclinee", "velo"],
      method: "duration-first",
      maxSingleChange: "duration",
      notes: ["Cardio optionnel 1-2 fois 10-20 min pour la sante."]
    },
    replacementRules: {
      preferEquipment: ["salle-complete"],
      rules: ["Remplacer les mouvements libres par machines en cas de fatigue articulaire."]
    },
    guardrails: {
      contraindications: ["ne pas utiliser si recuperation faible", "pas d'echec systematique"],
      deloadEveryWeeks: 4,
      painRules: ["Deux douleurs sur une meme zone: retirer le pattern lourd pendant une semaine."]
    }
  },
  {
    id: "shape-burn-alicia-4j",
    name: "Shape & Burn Alicia",
    description: "Programme 4 jours pour perte de poids, fessiers/cuisses et cardio doux, challengeant mais prudent pour reprise post-partum.",
    level: "debutant",
    primaryObjective: "perte-gras",
    secondaryObjectives: ["fessiers", "post-partum", "cardio-sante"],
    frequency: 4,
    averageDuration: "40-60 min",
    requiredEquipment: ["salle-complete"],
    contraindications: ["course", "sauts", "burpees", "crunchs", "sit-ups", "releves de jambes lourds", "blocage respiratoire"],
    tags: ["femme", "debutant", "perte-gras", "fessiers", "post-partum", "cardio", "machines"],
    weeklyStructure: ["Fessiers/cuisses A", "Marche + respiration", "Haut du corps + fessiers leger", "Repos", "Fessiers/arriere cuisses B", "Marche douce", "Repos"],
    sessions: [
      {
        id: "glutes-quads-a",
        weekday: "monday",
        title: "Fessiers/cuisses A",
        focus: "Machines stables, fessiers et quadriceps",
        duration: "45-55 min",
        intensity: "Modérée",
        notes: ["Pas d'echec, respiration fluide, stop si lourdeur pelvienne."],
        exercises: [
          ex("alicia-leg-press", "Presse a cuisses", "3 x 10-12", "90 s", "Souffler en poussant, amplitude confortable."),
          ex("alicia-hip-thrust", "Hip thrust machine", "3 x 10-12", "90 s", "Pause douce en haut, pas de blocage respiratoire."),
          ex("alicia-leg-extension", "Leg extension", "2-3 x 12-15", "75 s", "Controle, charge facile au depart."),
          ex("alicia-abductor", "Abducteurs machine", "3 x 15-20", "60 s", "Fessiers, bassin stable."),
          ex("alicia-transverse", "Respiration 360 + transverse doux", "4 x 5 respirations", "30 s", "Aucune pression vers le bas."),
          ex("alicia-walk", "Marche inclinee douce", "12-20 min", "Libre", "Augmenter d'abord la duree.")
        ]
      },
      {
        id: "walk-core",
        weekday: "tuesday",
        title: "Marche + core securise",
        focus: "Cardio doux, respiration et gainage sans crunch",
        duration: "30-45 min",
        intensity: "Légère",
        notes: ["Seance utile meme sans charges."],
        exercises: [
          ex("alicia-walk-2", "Tapis marche ou exterieur", "20-30 min", "Libre", "Rythme regulier, souffle facile."),
          ex("alicia-deadbug-heel", "Dead bug talons au sol", "2 x 6-8 par cote", "45 s", "Lent, ventre qui reste plat."),
          ex("alicia-pallof", "Pallof press leger", "2 x 10 par cote", "45 s", "Anti-rotation, pas de pression pelvienne."),
          ex("alicia-mobility", "Mobilite hanches/dos doux", "8-10 min", "Libre", "Amplitude confortable.")
        ]
      },
      {
        id: "upper-glutes-light",
        weekday: "thursday",
        title: "Haut du corps + fessiers leger",
        focus: "Renforcement simple et posture",
        duration: "45-55 min",
        intensity: "Modérée",
        exercises: [
          ex("alicia-pulldown", "Tirage vertical", "3 x 10-12", "90 s", "Poitrine haute."),
          ex("alicia-row", "Rowing machine", "3 x 10-12", "90 s", "Dos stable."),
          ex("alicia-chest", "Chest press machine", "2-3 x 10-12", "90 s", "Charge facile, respiration fluide."),
          ex("alicia-shoulder", "Developpe epaules machine leger", "2 x 10-12", "75 s", "Sans douleur."),
          ex("alicia-bridge", "Pont fessier au sol", "3 x 12-15", "60 s", "Souffler en montant."),
          ex("alicia-elliptique", "Elliptique douce", "10-15 min", "Libre", "Facile et regulier.")
        ]
      },
      {
        id: "glutes-hamstrings-b",
        weekday: "friday",
        title: "Fessiers/arriere cuisses B",
        focus: "Posterior chain stable et cardio doux",
        duration: "45-60 min",
        intensity: "Modérée",
        exercises: [
          ex("alicia-hip-thrust-b", "Hip thrust machine", "4 x 8-10", "90 s", "Challenge controle, jamais en apnee."),
          ex("alicia-leg-curl", "Leg curl", "3 x 10-12", "75 s", "Controle lent."),
          ex("alicia-presse-high", "Presse pieds hauts", "3 x 10-12", "90 s", "Fessiers/ischios, amplitude confortable."),
          ex("alicia-abductor-b", "Abducteurs machine", "3 x 15-20", "60 s", "Brulure musculaire ok, pression pelvienne non."),
          ex("alicia-bike", "Velo ou elliptique zone facile", "15-20 min", "Libre", "Duree avant intensite.")
        ]
      }
    ],
    progressionRules: {
      method: "rep-first",
      loadStepKg: { compoundLower: 2.5, machineLower: 2.5, machineUpper: 2.5, isolation: 1 },
      notes: ["Reps et regularite avant charge.", "Aucun echec.", "Si sensation de lourdeur, reduire volume et amplitude."]
    },
    cardioRules: {
      allowedModalities: ["marche", "tapis incline doux", "velo", "elliptique"],
      method: "duration-first",
      maxSingleChange: "duration",
      notes: ["Ajouter 2 a 5 minutes par semaine si recuperation OK."]
    },
    replacementRules: {
      avoidPatterns: ["cardio-hiit"],
      preferEquipment: ["salle-complete"],
      rules: ["Eviter sauts, course et crunchs.", "Preferer machines stables et exercices sans pression pelvienne."]
    },
    guardrails: {
      contraindications: ["pas de course", "pas de sauts", "pas de crunchs", "pas de sit-ups", "pas de blocage respiratoire"],
      deloadEveryWeeks: 4,
      painRules: ["Lourdeur pelvienne, douleur ou fatigue forte: reduire la seance.", "Spondylarthrite: garder amplitude confortable et progressions lentes."]
    }
  },
  {
    id: "cardio-sante-renforcement-3-5j",
    name: "Cardio Sante + Renforcement",
    description: "Base 3 jours avec 2 options pour ameliorer souffle, sante et perte de gras sans complexite.",
    level: "debutant",
    primaryObjective: "cardio-sante",
    secondaryObjectives: ["perte-gras", "sante", "recomposition"],
    frequency: 3,
    averageDuration: "35-60 min",
    requiredEquipment: ["salle-complete", "halteres-maison", "poids-corps"],
    contraindications: ["douleur thoracique", "oppression", "vertiges"],
    tags: ["cardio", "sante", "perte-gras", "debutant"],
    weeklyStructure: ["Renfo A", "Cardio zone 2", "Repos", "Renfo B", "Option cardio/mobilite", "Option full body leger", "Repos"],
    sessions: [
      {
        id: "renfo-a",
        weekday: "monday",
        title: "Renforcement A",
        focus: "Mouvements simples et souffle propre",
        duration: "40-50 min",
        intensity: "Modérée",
        exercises: [
          ex("cs-leg-press", "Presse a cuisses ou squat goblet", "3 x 10-12", "90 s", "Effort controle."),
          ex("cs-row", "Rowing machine ou elastique", "3 x 10-12", "75 s", "Posture."),
          ex("cs-chest", "Chest press ou pompes inclinees", "2-3 x 10-12", "75 s", "Option facile."),
          ex("cs-core", "Pallof press", "2 x 10 par cote", "45 s", "Tronc stable."),
          ex("cs-walk", "Marche zone 2", "10-15 min", "Libre", "Facile.")
        ]
      },
      {
        id: "cardio-zone2",
        weekday: "wednesday",
        title: "Cardio zone 2",
        focus: "Souffle, endurance et recuperation active",
        duration: "35-50 min",
        intensity: "Légère",
        exercises: [
          ex("cs-cardio-main", "Cardio au choix: marche, velo, elliptique", "25-40 min", "Libre", "Conversation possible."),
          ex("cs-mobility", "Mobilite hanches, dos, epaules", "8-10 min", "Libre", "Respiration calme."),
          ex("cs-breath", "Respiration retour au calme", "3-5 min", "Libre", "Redescendre le rythme.")
        ]
      },
      {
        id: "renfo-b",
        weekday: "friday",
        title: "Renforcement B",
        focus: "Dos, jambes, epaules et cardio court",
        duration: "40-55 min",
        intensity: "Modérée",
        exercises: [
          ex("cs-hip", "Hip thrust ou pont fessier", "3 x 10-12", "75 s", "Fessiers."),
          ex("cs-pulldown", "Tirage vertical ou elastique", "3 x 10-12", "75 s", "Dos."),
          ex("cs-shoulder", "Developpe epaules leger", "2-3 x 10-12", "75 s", "Sans douleur."),
          ex("cs-curl-tri", "Curl + triceps cable", "2 x 12-15", "60 s", "Accessoires simples."),
          ex("cs-bike", "Velo facile", "10-15 min", "Libre", "Rythme regulier.")
        ]
      },
      {
        id: "option-cardio-mobility",
        weekday: "saturday",
        title: "Option cardio/mobilite",
        focus: "Jour optionnel si energie correcte",
        duration: "25-40 min",
        intensity: "Légère",
        notes: ["Optionnel: ne pas compenser une semaine fatiguee."],
        exercises: [
          ex("cs-option-cardio", "Marche ou velo facile", "20-30 min", "Libre", "Facile."),
          ex("cs-option-mobility", "Mobilite globale", "5-10 min", "Libre", "Relache.")
        ]
      },
      {
        id: "option-fullbody",
        weekday: "sunday",
        title: "Option full body leger",
        focus: "Renforcement court sans fatigue",
        duration: "30-40 min",
        intensity: "Légère",
        notes: ["Optionnel si motivation et recuperation OK."],
        exercises: [
          ex("cs-option-squat", "Goblet squat leger", "2 x 12", "60 s", "Facile."),
          ex("cs-option-row", "Rowing leger", "2 x 12", "60 s", "Posture."),
          ex("cs-option-press", "Chest press leger", "2 x 12", "60 s", "Confortable."),
          ex("cs-option-core", "Gainage facile", "2 x 20-30 sec", "45 s", "Respiration.")
        ]
      }
    ],
    progressionRules: {
      method: "technique-first",
      loadStepKg: { compoundUpper: 2.5, compoundLower: 2.5, isolation: 1 },
      notes: ["Progression lente, priorite regularite.", "Ne pas chercher l'echec."]
    },
    cardioRules: {
      allowedModalities: ["marche", "velo", "elliptique", "rameur doux"],
      method: "duration-first",
      maxSingleChange: "duration",
      notes: ["Ajouter de la duree avant d'augmenter l'intensite."]
    },
    replacementRules: {
      rules: ["Choisir la variante la plus facile a tenir regulierement.", "Eviter tout mouvement qui declenche oppression ou vertige."]
    },
    guardrails: {
      contraindications: ["oppression", "vertiges", "douleur thoracique"],
      deloadEveryWeeks: 6,
      painRules: ["Signal cardio inquietant: arret de seance et avis medical."]
    }
  }
];

export function getProgramTemplateById(programId: string): ProgramTemplate | undefined {
  return PROGRAM_CATALOG.find((program) => program.id === programId);
}

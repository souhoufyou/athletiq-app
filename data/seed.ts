import type { CoachSeed } from "@/types/training";

export const coachSeed: CoachSeed = {
  profile: {
    firstName: "Sofiane",
    age: 36,
    heightCm: 181,
    startingWeightKg: 93.5,
    targetWeightKg: 84,
    mainGoal: "Recomposition physique: perdre du gras, garder et prendre du muscle.",
    secondaryGoals: ["Cardio", "Souffle", "Santé", "Judo"],
    gym: "One Air",
    judoDays: ["monday", "friday"],
    cardioLevel: "Faible",
    sleep: "Irrégulier",
    medicalNotes: ["Apnée du sommeil modérée sans appareillage"],
    watchPoints: ["Poignet droit à surveiller, douleur type tendinite"],
    preferences: [
      "Machines",
      "Barres",
      "Haltères",
      "Poulies",
      "Tapis incliné",
      "Rameur",
      "Stairmaster"
    ],
    avoid: ["CrossFit", "Burpees", "Pompes", "Course"],
    strengthReferences: [
      {
        lift: "Développé couché",
        value: "127 kg x 1",
        note: "Récent"
      },
      {
        lift: "Développé couché travail",
        value: "100 kg x 5 x 3",
        note: "Récent"
      },
      {
        lift: "Soulevé de terre",
        value: "170 kg",
        note: "Max connu"
      },
      {
        lift: "Squat",
        value: "110 kg x 10",
        note: "Récent, mais squat barre non apprécié"
      }
    ]
  },
  weeklyProgram: [
    {
      id: "monday-upper-force-judo",
      weekday: "monday",
      scheduleLabel: "Lundi midi",
      title: "Haut du corps force",
      focus: "Force haut du corps + judo soir",
      duration: "50-60 min",
      intensity: "Soutenue",
      notes: ["Judo le soir: garder 1-2 reps en réserve sur les accessoires."],
      exercises: [
        {
          id: "bench-press-5x5",
          name: "Développé couché",
          target: "5 x 5",
          plannedLoad: "90 kg",
          rest: "2min30-3min",
          cue: "Trajectoire stable, pause contrôlée, poignet droit neutre."
        },
        {
          id: "heavy-chest-supported-row",
          name: "Rowing poitrine appuyée lourd",
          target: "4 x 8-10",
          rest: "2 min",
          cue: "Tire les coudes vers l'arrière sans hausser les épaules."
        },
        {
          id: "incline-press-machine-db",
          name: "Développé incliné machine ou haltères",
          target: "3 x 8-10",
          rest: "90 s",
          cue: "Amplitude propre, arrêt si le poignet se réveille."
        },
        {
          id: "neutral-lat-pulldown",
          name: "Tirage vertical prise neutre",
          target: "3 x 8-10",
          rest: "90 s",
          cue: "Poitrine haute, tire les coudes vers les côtes."
        },
        {
          id: "pec-deck-or-cable-fly",
          name: "Pec deck ou écarté poulie",
          target: "2 x 12-15",
          rest: "60 s",
          cue: "Étirement confortable, aucun stress sur le poignet."
        },
        {
          id: "face-pull",
          name: "Face pull",
          target: "3 x 15-20",
          rest: "45-60 s",
          cue: "Coudes hauts, omoplates vers l'arrière."
        }
      ]
    },
    {
      id: "tuesday-lower-cardio",
      weekday: "tuesday",
      scheduleLabel: "Mardi",
      title: "Bas du corps + cardio",
      focus: "Jambes, chaîne postérieure, zone 2",
      duration: "65-75 min",
      intensity: "Modérée",
      exercises: [
        {
          id: "leg-press-5x10",
          name: "Presse à cuisses",
          target: "5 x 10",
          rest: "2 min",
          cue: "Amplitude solide, bas du dos collé au dossier."
        },
        {
          id: "rdl-or-hip-thrust",
          name: "Soulevé de terre roumain ou hip thrust",
          target: "4 x 8-10",
          rest: "2 min",
          cue: "Choisis l'option la plus propre techniquement aujourd'hui."
        },
        {
          id: "leg-curl",
          name: "Leg curl",
          target: "4 x 12-15",
          rest: "75 s",
          cue: "Contrôle la descente, garde les hanches calées."
        },
        {
          id: "leg-extension",
          name: "Leg extension",
          target: "3 x 12-15",
          rest: "75 s",
          cue: "Verrouille sans claquer, contraction en haut."
        },
        {
          id: "calf-raises",
          name: "Mollets",
          target: "4 x 15-20",
          rest: "60 s",
          cue: "Pause en haut, étirement contrôlé en bas."
        },
        {
          id: "plank",
          name: "Gainage planche",
          target: "3 x 30-45 sec",
          rest: "45 s",
          cue: "Bassin neutre, respiration maîtrisée."
        },
        {
          id: "incline-treadmill-zone-2",
          name: "Cardio zone 2 tapis incliné",
          target: "20 min",
          rest: "Libre",
          cue: "Souffle présent mais conversation possible."
        }
      ]
    },
    {
      id: "wednesday-upper-volume",
      weekday: "wednesday",
      scheduleLabel: "Mercredi",
      title: "Haut du corps volume",
      focus: "Dos, pectoraux, bras, grip léger",
      duration: "65-75 min",
      intensity: "Modérée",
      exercises: [
        {
          id: "lat-pulldown-volume",
          name: "Tirage vertical",
          target: "4 x 10-12",
          rest: "90 s",
          cue: "Reste strict, finis les reps sans élan."
        },
        {
          id: "incline-machine-or-chest-press",
          name: "Développé incliné machine ou chest press",
          target: "4 x 10-12",
          rest: "90 s",
          cue: "Garde deux reps en réserve sur les premières séries."
        },
        {
          id: "seated-cable-row",
          name: "Rowing poulie basse",
          target: "4 x 10-12",
          rest: "90 s",
          cue: "Tire avec le dos, pas avec les poignets."
        },
        {
          id: "cable-fly-or-pec-deck-volume",
          name: "Écarté poulie ou pec deck",
          target: "3 x 12-15",
          rest: "60 s",
          cue: "Mouvement fluide, épaules basses."
        },
        {
          id: "straight-arm-pulldown",
          name: "Pullover poulie bras tendus",
          target: "3 x 12-15",
          rest: "60 s",
          cue: "Sens les dorsaux, garde les coudes presque fixes."
        },
        {
          id: "reverse-pec-deck",
          name: "Reverse pec deck",
          target: "3 x 15-20",
          rest: "60 s",
          cue: "Contrôle l'ouverture, nuque longue."
        },
        {
          id: "preacher-or-incline-curl",
          name: "Curl pupitre ou incliné",
          target: "3 x 10-12",
          rest: "60 s",
          cue: "Poignet neutre, pas de douleur."
        },
        {
          id: "rope-triceps",
          name: "Triceps corde",
          target: "3 x 12-15",
          rest: "60 s",
          cue: "Coudes fixes, extension complète."
        },
        {
          id: "farmer-walk-or-hang",
          name: "Farmer walk ou suspension",
          target: "4 passages ou 4 séries",
          rest: "75-90 s",
          cue: "Grip propre, stop si le poignet droit tire."
        }
      ]
    },
    {
      id: "thursday-cardio-posture-abs",
      weekday: "thursday",
      scheduleLabel: "Jeudi",
      title: "Cardio + posture + abdos",
      focus: "Zone 2, tronc, respiration",
      duration: "50-60 min",
      intensity: "Légère",
      exercises: [
        {
          id: "incline-walk-zone-2",
          name: "Tapis incliné ou marche",
          target: "35-45 min zone 2",
          rest: "Libre",
          cue: "Rythme durable, souffle régulier."
        },
        {
          id: "dead-bug",
          name: "Dead bug",
          target: "3 x 10 par côté",
          rest: "45 s",
          cue: "Bas du dos stable, mouvement lent."
        },
        {
          id: "pallof-press",
          name: "Pallof press",
          target: "3 x 12 par côté",
          rest: "45 s",
          cue: "Résiste à la rotation, épaules basses."
        },
        {
          id: "side-plank",
          name: "Gainage latéral",
          target: "3 x 30 sec par côté",
          rest: "45 s",
          cue: "Hanches hautes, alignement propre."
        },
        {
          id: "wall-pec-stretch",
          name: "Étirement pectoraux contre mur",
          target: "1 min par côté",
          rest: "Libre",
          cue: "Étirement doux, pas de fourmillement."
        },
        {
          id: "light-face-pull",
          name: "Face pull léger",
          target: "2 x 20",
          rest: "45 s",
          cue: "Activation propre, aucune fatigue nerveuse."
        },
        {
          id: "slow-breathing",
          name: "Respiration lente",
          target: "2 min",
          rest: "Libre",
          cue: "Expire long, ralentis progressivement."
        }
      ]
    },
    {
      id: "friday-shoulders-arms-judo",
      weekday: "friday",
      scheduleLabel: "Vendredi midi",
      title: "Épaules, bras, rappel haut",
      focus: "Modéré + judo soir",
      duration: "45-55 min",
      intensity: "Modérée",
      notes: ["Judo le soir: pas de grip lourd, pas d'échec musculaire."],
      exercises: [
        {
          id: "machine-shoulder-press",
          name: "Développé épaules machine",
          target: "4 x 8-10",
          rest: "90 s",
          cue: "Charge stable, trajectoire confortable."
        },
        {
          id: "db-lateral-raises",
          name: "Élévations latérales haltères",
          target: "4 x 12-20",
          rest: "60 s",
          cue: "Léger et strict, poignets détendus."
        },
        {
          id: "rear-delt-machine",
          name: "Arrière d'épaule machine",
          target: "3 x 15-20",
          rest: "60 s",
          cue: "Ouvre sans tirer avec les trapèzes."
        },
        {
          id: "light-moderate-chest-press",
          name: "Chest press légère/modérée",
          target: "3 x 10-12",
          rest: "75 s",
          cue: "RPE modéré, garde de la fraîcheur pour le judo."
        },
        {
          id: "light-moderate-machine-row",
          name: "Rowing machine léger/modéré",
          target: "3 x 12",
          rest: "75 s",
          cue: "Tirage propre, grip détendu."
        },
        {
          id: "cable-curl",
          name: "Curl câble",
          target: "3 x 12-15",
          rest: "60 s",
          cue: "Poignet droit neutre, amplitude confortable."
        },
        {
          id: "cable-triceps",
          name: "Triceps poulie",
          target: "3 x 12-15",
          rest: "60 s",
          cue: "Coudes fixes, pas de compensation."
        }
      ]
    },
    {
      id: "saturday-full-body-progression",
      weekday: "saturday",
      scheduleLabel: "Samedi",
      title: "Full body progression",
      focus: "Progression complète sans squat barre imposé",
      duration: "60-70 min",
      intensity: "Soutenue",
      exercises: [
        {
          id: "hack-press-goblet",
          name: "Hack squat / presse / goblet squat",
          target: "4 x 8-10",
          rest: "2 min",
          cue: "Choisis la variante la plus stable et motivante."
        },
        {
          id: "light-deadlift-technique-or-hip-thrust",
          name: "Soulevé de terre léger technique ou hip thrust",
          target: "3 x 8",
          rest: "2 min",
          cue: "Technique nette, aucune recherche de max."
        },
        {
          id: "speed-bench-or-chest-press",
          name: "Développé couché vitesse ou chest press",
          target: "4 x 6-8",
          rest: "90 s",
          cue: "Explosif mais propre, charge maîtrisée."
        },
        {
          id: "lat-pulldown-or-assisted-pullup",
          name: "Tirage vertical ou tractions assistées",
          target: "4 x 8-10",
          rest: "90 s",
          cue: "Amplitude complète, pas d'élan."
        },
        {
          id: "chest-supported-row-volume",
          name: "Rowing poitrine appuyée",
          target: "3 x 10-12",
          rest: "90 s",
          cue: "Stable, contraction forte en fin de tirage."
        },
        {
          id: "leg-curl-saturday",
          name: "Leg curl",
          target: "3 x 12-15",
          rest: "75 s",
          cue: "Ischios sous tension, tempo contrôlé."
        },
        {
          id: "controlled-interval-cardio",
          name: "Cardio intervalles contrôlés",
          target: "6 rounds de 30 sec fort / 90 sec facile",
          rest: "Inclus",
          cue: "Fort mais propre, récupère vraiment entre les rounds."
        }
      ]
    },
    {
      id: "sunday-active-rest",
      weekday: "sunday",
      scheduleLabel: "Dimanche",
      title: "Repos actif",
      focus: "Récupération sans charge lourde",
      duration: "30-60 min optionnel",
      intensity: "Légère",
      notes: ["Pas de charge lourde."],
      exercises: [
        {
          id: "optional-walk",
          name: "Marche optionnelle",
          target: "30-60 min",
          rest: "Libre",
          cue: "Rythme facile, objectif récupération."
        },
        {
          id: "optional-mobility",
          name: "Mobilité optionnelle",
          target: "5-10 min",
          rest: "Libre",
          cue: "Déverrouille hanches, haut du dos et épaules."
        }
      ]
    }
  ]
};

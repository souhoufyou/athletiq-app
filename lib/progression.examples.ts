import { weeklyProgram } from "@/data/program";
import { calculateProgression, type ProgressionInput } from "@/lib/progression";

const bench = weeklyProgram[0].exercises[0];
const legPress = weeklyProgram[1].exercises[0];
const cardio = weeklyProgram[1].exercises[6];
const romanianDeadlift = weeklyProgram[1].exercises[1];

export const progressionExampleInputs: ProgressionInput[] = [
  {
    plannedExercise: bench,
    performance: {
      usedLoad: "90 kg",
      completedReps: "5/5/5/5/5",
      comment: ""
    },
    feedback: "ok",
    sessionDifficulty: 7,
    globalPain: 1,
    energy: 7,
    breath: "correct"
  },
  {
    plannedExercise: legPress,
    performance: {
      usedLoad: "180 kg",
      completedReps: "10/10/10/10/10",
      comment: "Très facile, j'aurais pu faire beaucoup plus."
    },
    feedback: "easy",
    sessionDifficulty: 5,
    globalPain: 1,
    energy: 8,
    breath: "bon"
  },
  {
    plannedExercise: romanianDeadlift,
    performance: {
      usedLoad: "100 kg",
      completedReps: "8/7/6/0",
      comment: "Douleur dos en bas du mouvement."
    },
    feedback: "pain",
    sessionDifficulty: 8,
    globalPain: 3,
    energy: 5,
    breath: "correct"
  },
  {
    plannedExercise: cardio,
    performance: {
      usedLoad: "Tapis incliné 8 %",
      completedReps: "20 min",
      comment: "Oppression inhabituelle."
    },
    feedback: "hard",
    sessionDifficulty: 9,
    globalPain: 1,
    energy: 4,
    breath: "oppression"
  }
];

export const progressionExamples = progressionExampleInputs.map((input) => calculateProgression(input));

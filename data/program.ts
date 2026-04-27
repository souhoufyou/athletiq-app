import { coachSeed } from "@/data/seed";
import type { PlannedSession, UserSportProfile } from "@/types/training";

export const athleteProfile: UserSportProfile = coachSeed.profile;

export const weeklyProgram: PlannedSession[] = coachSeed.weeklyProgram;

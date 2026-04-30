import { coachSeed } from "@/data/seed";
import { normalizeProgramV2 } from "@/lib/programSchema";
import type { PlannedSession, UserSportProfile } from "@/types/training";

export const athleteProfile: UserSportProfile = coachSeed.profile;

export const weeklyProgram: PlannedSession[] = normalizeProgramV2(coachSeed.weeklyProgram);

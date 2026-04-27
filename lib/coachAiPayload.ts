import type { CompletedSession } from "@/types/training";

export function buildCoachAiPayload(session: CompletedSession, weeklySessions: CompletedSession[] = []) {
  const localDecisions = Object.values(session.progressions ?? {});
  const freeComments = Object.values(session.logs ?? {})
    .filter((log) => log.comment.trim().length > 0)
    .map((log) => ({
      exerciseId: log.exerciseId,
      feedback: log.status ?? "skipped",
      comment: log.comment
    }));
  const weeklySummary = weeklySessions.map((item) => ({
    title: item.title,
    completedAt: item.completedAt,
    difficulty: item.feedback?.difficulty,
    pain: item.feedback?.globalPain,
    durationMs: item.totalDurationMs,
    calorieEstimate: item.calorieEstimate,
    comments: Object.values(item.logs ?? {})
      .filter((log) => log.comment.trim().length > 0)
      .map((log) => log.comment)
  }));

  return {
    session: {
      title: session.title,
      focus: session.focus,
      completedAt: session.completedAt,
      globalFeedback: session.feedback,
      calorieEstimate: session.calorieEstimate,
      logs: session.logs,
      freeComments,
      localDecisions,
      nextSessionTitle: session.nextSessionTitle
    },
    weeklySummary
  };
}

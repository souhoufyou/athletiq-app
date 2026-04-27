import { NextResponse } from "next/server";
import { buildCoachAiPayload } from "@/lib/coachAiPayload";
import type { CoachAiDecision, CoachAiResponse, CompletedSession, ProgressionDecision } from "@/types/training";

export const runtime = "nodejs";

const coachResponseSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "decisions", "warnings", "nextSessionAdjustments", "motivationalMessage"],
  properties: {
    summary: { type: "string" },
    decisions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["exercise", "recommendation", "reason"],
        properties: {
          exercise: { type: "string" },
          recommendation: {
            type: "string",
            enum: ["augmenter", "maintenir", "baisser", "remplacer"]
          },
          reason: { type: "string" }
        }
      }
    },
    warnings: {
      type: "array",
      items: { type: "string" }
    },
    nextSessionAdjustments: {
      type: "array",
      items: { type: "string" }
    },
    motivationalMessage: { type: "string" }
  }
};

const disabledResponse: CoachAiResponse = {
  summary: "IA desactivee",
  decisions: [],
  warnings: [],
  nextSessionAdjustments: [],
  motivationalMessage: "Seance enregistree. Le moteur local reste actif."
};

const missingModelResponse: CoachAiResponse = {
  summary: "Modele IA non configure",
  decisions: [],
  warnings: ["Ajoute OPENAI_MODEL ou OPENAI_DEFAULT_MODEL avec un modele disponible dans ton compte API."],
  nextSessionAdjustments: [],
  motivationalMessage: "Seance enregistree. Le moteur local reste actif."
};

export async function POST(request: Request) {
  let body: { session?: CompletedSession; weeklySessions?: CompletedSession[] };

  try {
    body = (await request.json()) as { session?: CompletedSession; weeklySessions?: CompletedSession[] };
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!body.session) {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(disabledResponse);
  }

  const model = getOpenAiModel();

  if (!model) {
    return NextResponse.json(missingModelResponse);
  }

  try {
    const aiResponse = await callOpenAi(body.session, body.weeklySessions ?? [], model);
    return NextResponse.json(applyLocalGuardrailsToAiResponse(body.session, aiResponse));
  } catch (error) {
    logCoachAiError(error);

    return NextResponse.json({
      ...disabledResponse,
      summary: "IA indisponible",
      warnings: ["Analyse IA indisponible. Les decisions locales restent conservees."]
    });
  }
}

function applyLocalGuardrailsToAiResponse(
  session: CompletedSession,
  aiResponse: CoachAiResponse
): CoachAiResponse {
  const moderatedDecisions = aiResponse.decisions.map((decision) => moderateAiDecision(session, decision));
  const wasModerated = moderatedDecisions.some((item, index) => item !== aiResponse.decisions[index]);

  if (!wasModerated) {
    return aiResponse;
  }

  return {
    ...aiResponse,
    decisions: moderatedDecisions,
    warnings: [...aiResponse.warnings, "Suggestion IA modérée par les garde-fous du programme."]
  };
}

function moderateAiDecision(session: CompletedSession, decision: CoachAiDecision): CoachAiDecision {
  const local = Object.values(session.progressions ?? {}).find((progression) =>
    sameExercise(progression.exerciseName, decision.exercise)
  );

  if (!local) {
    return decision;
  }

  const localRecommendation = toCoachRecommendation(local.decision);
  const aiPushesBeyondLocal =
    decision.recommendation !== localRecommendation &&
    (decision.recommendation === "augmenter" ||
      decision.recommendation === "remplacer" ||
      local.warning ||
      local.decision === "alerte" ||
      local.decision === "baisser");

  if (!aiPushesBeyondLocal) {
    return decision;
  }

  return {
    ...decision,
    recommendation: localRecommendation,
    reason: `${decision.reason} Suggestion IA modérée par les garde-fous du programme. Decision locale conservee: ${local.reason}`
  };
}

function toCoachRecommendation(decision: ProgressionDecision): CoachAiDecision["recommendation"] {
  if (decision === "augmenter") return "augmenter";
  if (decision === "baisser" || decision === "alerte") return "baisser";
  if (decision === "remplacer") return "remplacer";
  return "maintenir";
}

function sameExercise(left: string, right: string): boolean {
  const a = normalize(left);
  const b = normalize(right);

  return a === b || a.includes(b) || b.includes(a);
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ");
}

function getOpenAiModel(): string {
  return (process.env.OPENAI_MODEL || process.env.OPENAI_DEFAULT_MODEL || "").trim();
}

function logCoachAiError(error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.error("Coach AI failed", error);
  }
}

async function callOpenAi(
  session: CompletedSession,
  weeklySessions: CompletedSession[],
  model: string
): Promise<CoachAiResponse> {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      instructions:
        "Tu es un coach sportif prudent. Tu analyses les commentaires, les patterns, une seance validee et un resume hebdo eventuel. Tu peux produire un resume seance, un resume hebdo et suggerer des adaptations, mais tu ne remplaces jamais le moteur local. Les decisions locales et alertes de securite sont prioritaires. Si douleur, vertige, oppression, malaise ou souffle inquietant apparaissent, recommande de reduire l'intensite et de consulter si necessaire. Reponds en francais, court et direct.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(buildCoachAiPayload(session, weeklySessions))
            }
          ]
        }
      ],
      text: {
        format: {
          type: "json_schema",
          name: "coach_adaptatif_response",
          strict: true,
          schema: coachResponseSchema
        }
      }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error ${response.status}`);
  }

  const data = (await response.json()) as { output_text?: string; output?: Array<unknown> };
  const outputText = data.output_text ?? extractOutputText(data);

  if (!outputText) {
    throw new Error("Missing OpenAI output text");
  }

  return JSON.parse(outputText) as CoachAiResponse;
}

function extractOutputText(data: { output?: Array<unknown> }): string | undefined {
  for (const item of data.output ?? []) {
    if (!item || typeof item !== "object" || !("content" in item)) {
      continue;
    }

    const content = (item as { content?: Array<unknown> }).content;

    for (const part of content ?? []) {
      if (part && typeof part === "object" && "text" in part) {
        return String((part as { text?: string }).text ?? "");
      }
    }
  }

  return undefined;
}

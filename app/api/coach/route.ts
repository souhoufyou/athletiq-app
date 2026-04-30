import { NextResponse } from "next/server";
import type { CoachAiResponse, CompletedSession } from "@/types/training";

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
  summary: "IA désactivée",
  decisions: [],
  warnings: [],
  nextSessionAdjustments: [],
  motivationalMessage: "Séance enregistrée. Le moteur local reste actif."
};

export async function POST(request: Request) {
  let body: { session?: CompletedSession };

  try {
    body = (await request.json()) as { session?: CompletedSession };
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  if (!body.session) {
    return NextResponse.json({ error: "Missing session" }, { status: 400 });
  }

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json(disabledResponse);
  }

  try {
    const aiResponse = await callOpenAi(body.session);
    return NextResponse.json(aiResponse);
  } catch (error) {
    console.error("Coach AI failed", error);

    return NextResponse.json({
      ...disabledResponse,
      summary: "IA indisponible",
      warnings: ["Analyse IA indisponible. Les décisions locales restent conservées."]
    });
  }
}

async function callOpenAi(session: CompletedSession): Promise<CoachAiResponse> {
  const localDecisions = Object.values(session.progressions ?? {});
  const freeComments = Object.values(session.logs ?? {})
    .filter((log) => log.comment.trim().length > 0)
    .map((log) => ({
      exerciseId: log.exerciseId,
      feedback: log.status ?? "skipped",
      comment: log.comment
    }));

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      instructions:
        "Tu es un coach sportif prudent. Tu analyses une séance validée, mais tu ne remplaces jamais le moteur local. Les décisions locales et alertes de sécurité sont prioritaires. Si douleur, vertige, oppression, malaise ou souffle inquiétant apparaissent, recommande de réduire l'intensité et de consulter si nécessaire. Réponds en français, court et direct.",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify({
                session: {
                  title: session.title,
                  focus: session.focus,
                  completedAt: session.completedAt,
                  globalFeedback: session.feedback,
                  logs: session.logs,
                  freeComments,
                  localDecisions,
                  nextSessionTitle: session.nextSessionTitle
                }
              })
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

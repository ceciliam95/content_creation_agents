import type { MasterDraft, SessionRecord } from "@/lib/types";

export type GeneratedWechatBundle = {
  title: string;
  masterDraft: MasterDraft;
  wechat: {
    title: string;
    abstract: string;
    body: string;
    cta: string;
  };
};

export function parseWechatGenerationContent(content: string): GeneratedWechatBundle {
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Model output is not valid JSON.");
  }

  return validateWechatGeneration(parsed);
}

export function buildSessionFromGeneration({
  request,
  generation,
  now = new Date()
}: {
  request: string;
  generation: GeneratedWechatBundle;
  now?: Date;
}): SessionRecord {
  return {
    id: `session-${now.getTime()}`,
    title: generation.title,
    createdAt: now.toISOString(),
    selectedPlatforms: ["wechat"],
    request,
    masterDraft: generation.masterDraft,
    outputs: {
      wechat: generation.wechat
    }
  };
}

export function buildWechatPrompt({
  request,
  wechatPrompt
}: {
  request: string;
  wechatPrompt: string;
}) {
  return [
    "你是一个中文内容工厂助手。",
    "请根据用户需求生成总策划/母稿与公众号文章。",
    "只返回 JSON，不要返回 markdown、代码块或额外解释。",
    "JSON 结构必须严格匹配：",
    JSON.stringify({
      title: "string",
      masterDraft: {
        title: "string",
        audience: "string",
        objective: "string",
        keyMessage: "string",
        outline: ["string"],
        platformNotes: ["string"]
      },
      wechat: {
        title: "string",
        abstract: "string",
        body: "string",
        cta: "string"
      }
    }),
    `用户需求：${request}`,
    `公众号平台提示词：${wechatPrompt}`
  ].join("\n");
}

export function parseWechatGenerationResponse(payload: unknown): GeneratedWechatBundle {
  const content =
    typeof payload === "object" &&
    payload !== null &&
    "choices" in payload &&
    Array.isArray((payload as { choices?: unknown[] }).choices)
      ? (
          payload as {
            choices: Array<{
              message?: {
                content?: string;
              };
            }>;
          }
        ).choices[0]?.message?.content
      : undefined;

  if (typeof content !== "string" || !content.trim()) {
    throw new Error("AI response did not include message content.");
  }

  return parseWechatGenerationContent(content);
}

function validateWechatGeneration(input: unknown): GeneratedWechatBundle {
  if (!input || typeof input !== "object") {
    throw new Error("Model output does not match the expected generation shape.");
  }

  const candidate = input as Partial<GeneratedWechatBundle>;

  if (
    typeof candidate.title !== "string" ||
    !candidate.masterDraft ||
    typeof candidate.masterDraft.title !== "string" ||
    typeof candidate.masterDraft.audience !== "string" ||
    typeof candidate.masterDraft.objective !== "string" ||
    typeof candidate.masterDraft.keyMessage !== "string" ||
    !Array.isArray(candidate.masterDraft.outline) ||
    !Array.isArray(candidate.masterDraft.platformNotes) ||
    !candidate.wechat ||
    typeof candidate.wechat.title !== "string" ||
    typeof candidate.wechat.abstract !== "string" ||
    typeof candidate.wechat.body !== "string" ||
    typeof candidate.wechat.cta !== "string"
  ) {
    throw new Error("Model output does not match the expected generation shape.");
  }

  return candidate as GeneratedWechatBundle;
}

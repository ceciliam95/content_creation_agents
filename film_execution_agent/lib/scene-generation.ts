export type SceneMessage = {
  role: "system" | "user";
  content: string;
};

export type SceneGenerationPayload = {
  model: string;
  temperature: number;
  messages: SceneMessage[];
};

type BuildSceneGenerationPayloadInput = {
  model: string;
  script: string;
  systemPrompt?: string;
};

type ProviderResponse = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
          }>;
    };
  }>;
};

export function buildSceneGenerationPayload({
  model,
  script,
  systemPrompt,
}: BuildSceneGenerationPayloadInput): SceneGenerationPayload {
  const trimmedPrompt = systemPrompt?.trim();
  const messages: SceneMessage[] = [];

  if (trimmedPrompt) {
    messages.push({
      role: "system",
      content: trimmedPrompt,
    });
  }

  messages.push({
    role: "user",
    content: `Turn the following script into concise scene text.\n\nScript:\n${script.trim()}`,
  });

  return {
    model,
    temperature: 0.6,
    messages,
  };
}

export function extractSceneText(response: ProviderResponse): string {
  const content = response.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    const trimmed = content.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  if (Array.isArray(content)) {
    const merged = content
      .map((block) => (block.type === "text" || !block.type ? block.text ?? "" : ""))
      .join("")
      .trim();

    if (merged) {
      return merged;
    }
  }

  throw new Error("No scene text was returned by the AI provider.");
}

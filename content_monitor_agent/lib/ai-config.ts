export type AiRuntimeConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export function getAiRuntimeConfig(): AiRuntimeConfig {
  const baseUrl = process.env.AI_BASE_URL?.trim();
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim();

  if (!baseUrl || !apiKey || !model) {
    throw new Error("Missing AI_BASE_URL, AI_API_KEY, or AI_MODEL.");
  }

  return { baseUrl, apiKey, model };
}

export async function callOpenAiCompatibleJson<T>({
  system,
  user
}: {
  system: string;
  user: string;
}): Promise<T> {
  const config = getAiRuntimeConfig();
  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user }
      ],
      response_format: { type: "json_object" }
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("AI response did not include content.");
  }

  return JSON.parse(content) as T;
}

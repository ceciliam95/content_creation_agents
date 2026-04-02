export type AiConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
};

export function loadAiConfig(): AiConfig {
  const baseUrl = process.env.AI_BASE_URL?.trim();
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim();

  if (!baseUrl || !apiKey || !model) {
    throw new Error("Missing AI_BASE_URL, AI_API_KEY, or AI_MODEL.");
  }

  return { baseUrl, apiKey, model };
}

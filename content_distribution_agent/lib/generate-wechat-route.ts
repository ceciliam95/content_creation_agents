import { NextResponse } from "next/server";
import { loadAiConfig } from "@/lib/ai-config";
import { createPromptConfigStore } from "@/lib/prompt-config-store";
import type { PromptConfig } from "@/lib/prompt-defaults";
import {
  buildSessionFromGeneration,
  buildWechatPrompt,
  parseWechatGenerationResponse,
  type GeneratedWechatBundle
} from "@/lib/wechat-generation";

type RouteDependencies = {
  generateWechatBundle: (input: {
    request: string;
  }) => Promise<GeneratedWechatBundle>;
};

type GenerateWechatBundleDeps = {
  request: string;
  fetchImpl?: typeof fetch;
  loadConfig?: typeof loadAiConfig;
  loadPromptConfig?: () => Promise<PromptConfig>;
};

export function createGenerateWechatHandler(deps: RouteDependencies) {
  return async function handleGenerateWechat(request: Request) {
    let body: { request?: string } | null = null;

    try {
      body = (await request.json()) as { request?: string };
    } catch {
      return NextResponse.json({ error: "请求体不是合法的 JSON。" }, { status: 400 });
    }

    const userRequest = body?.request?.trim();

    if (!userRequest) {
      return NextResponse.json({ error: "缺少创作需求。" }, { status: 400 });
    }

    try {
      const generation = await deps.generateWechatBundle({
        request: userRequest
      });
      const session = buildSessionFromGeneration({
        request: userRequest,
        generation
      });

      return NextResponse.json({ session });
    } catch (error) {
      const message = error instanceof Error ? error.message : "生成失败。";
      const status = /^AI request failed with status \d+\.$/.test(message) ? 502 : 500;

      return NextResponse.json({ error: message }, { status });
    }
  };
}

export async function generateWechatBundleWithDeps({
  request,
  fetchImpl = fetch,
  loadConfig = loadAiConfig,
  loadPromptConfig = () => createPromptConfigStore().readConfig()
}: GenerateWechatBundleDeps) {
  const config = loadConfig();
  const promptConfig = await loadPromptConfig();
  const activeTemplate = promptConfig.wechat.templates.find(
    (item) => item.id === promptConfig.wechat.activeTemplateId
  );

  if (!activeTemplate) {
    throw new Error("No active WeChat prompt template is configured.");
  }

  const response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: config.model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: activeTemplate.prompt
        },
        {
          role: "user",
          content: buildWechatPrompt({
            request
          })
        }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`AI request failed with status ${response.status}.`);
  }

  const payload = await response.json();
  return parseWechatGenerationResponse(payload);
}

export const generateWechatBundle = async ({ request }: { request: string }) =>
  generateWechatBundleWithDeps({ request });

import { NextResponse } from "next/server";
import { loadAiConfig } from "@/lib/ai-config";
import {
  buildSessionFromGeneration,
  buildWechatPrompt,
  parseWechatGenerationResponse,
  type GeneratedWechatBundle
} from "@/lib/wechat-generation";

type RouteDependencies = {
  generateWechatBundle: (input: {
    request: string;
    wechatPrompt: string;
  }) => Promise<GeneratedWechatBundle>;
};

export function createGenerateWechatHandler(deps: RouteDependencies) {
  return async function handleGenerateWechat(request: Request) {
    let body: { request?: string; wechatPrompt?: string } | null = null;

    try {
      body = (await request.json()) as { request?: string; wechatPrompt?: string };
    } catch {
      return NextResponse.json({ error: "请求体不是合法的 JSON。" }, { status: 400 });
    }

    const userRequest = body?.request?.trim();
    const wechatPrompt = body?.wechatPrompt?.trim();

    if (!userRequest || !wechatPrompt) {
      return NextResponse.json({ error: "缺少创作需求或公众号提示词。" }, { status: 400 });
    }

    try {
      const generation = await deps.generateWechatBundle({
        request: userRequest,
        wechatPrompt
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

export const generateWechatBundle = async ({
  request,
  wechatPrompt
}: {
  request: string;
  wechatPrompt: string;
}) => {
  const config = loadAiConfig();
  const response = await fetch(`${config.baseUrl}/chat/completions`, {
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
          role: "user",
          content: buildWechatPrompt({
            request,
            wechatPrompt
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
};

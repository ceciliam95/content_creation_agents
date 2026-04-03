import { NextResponse } from "next/server";

import {
  buildSceneGenerationPayload,
  extractSceneText,
} from "@/lib/scene-generation";
import { getTaskProviderConfig } from "@/lib/task-provider-config";

export const runtime = "nodejs";

type GenerateScenesRequest = {
  script?: string;
  systemPrompt?: string;
};

export async function POST(request: Request) {
  const { script, systemPrompt }: GenerateScenesRequest = await request.json();
  const trimmedScript = script?.trim();

  if (!trimmedScript) {
    return NextResponse.json(
      { error: "Script is required." },
      { status: 400 },
    );
  }

  let providerConfig;

  try {
    providerConfig = getTaskProviderConfig("script_to_scenes");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Missing provider configuration.";

    return NextResponse.json({ error: message }, { status: 500 });
  }

  const providerResponse = await fetch(
    `${providerConfig.baseUrl.replace(/\/$/, "")}/chat/completions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${providerConfig.apiKey}`,
      },
      body: JSON.stringify(
        buildSceneGenerationPayload({
          model: providerConfig.model,
          script: trimmedScript,
          systemPrompt,
        }),
      ),
    },
  );

  if (!providerResponse.ok) {
    const providerError = await providerResponse.text();

    return NextResponse.json(
      {
        error:
          providerError ||
          "The AI provider request failed while generating scenes.",
      },
      { status: providerResponse.status },
    );
  }

  const result = extractSceneText(await providerResponse.json());

  return NextResponse.json({ sceneText: result });
}

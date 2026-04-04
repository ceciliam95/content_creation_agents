import { NextResponse } from "next/server";

import {
  buildSceneGenerationPayload,
  extractSceneText,
} from "@/lib/scene-generation";
import { getDefaultSystemPrompt } from "@/lib/default-prompts";
import { getTaskProviderConfig } from "@/lib/task-provider-config";

export const runtime = "nodejs";

type VoiceTaggingRequest = {
  text?: string;
  systemPrompt?: string;
};

export async function POST(request: Request) {
  const { text, systemPrompt }: VoiceTaggingRequest = await request.json();
  const trimmedText = text?.trim();

  if (!trimmedText) {
    return NextResponse.json({ error: "Dialogue text is required." }, { status: 400 });
  }

  let providerConfig;

  try {
    providerConfig = getTaskProviderConfig("voice_tagging");
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
          script: trimmedText,
          systemPrompt: systemPrompt?.trim() || getDefaultSystemPrompt("voice_tagging"),
        }),
      ),
    },
  );

  if (!providerResponse.ok) {
    const providerError = await providerResponse.text();

    return NextResponse.json(
      {
        error: providerError || "The AI provider request failed while tagging dialogue.",
      },
      { status: providerResponse.status },
    );
  }

  const taggedText = extractSceneText(await providerResponse.json());
  return NextResponse.json({ taggedText });
}

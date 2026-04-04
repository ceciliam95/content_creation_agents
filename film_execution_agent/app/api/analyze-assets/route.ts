import { NextResponse } from "next/server";

import {
  buildAnalyzeAssetsPayload,
  extractAssetAnalysisFromResponse,
} from "@/lib/asset-analysis";
import { getDefaultSystemPrompt } from "@/lib/default-prompts";
import { getTaskProviderConfig } from "@/lib/task-provider-config";

export const runtime = "nodejs";

type AnalyzeAssetsRequest = {
  storyboard?: string;
  systemPrompt?: string;
};

export async function POST(request: Request) {
  const { storyboard, systemPrompt }: AnalyzeAssetsRequest = await request.json();
  const trimmedStoryboard = storyboard?.trim();

  if (!trimmedStoryboard) {
    return NextResponse.json({ error: "Storyboard is required." }, { status: 400 });
  }

  let providerConfig;

  try {
    providerConfig = getTaskProviderConfig("analyze_assets");
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
        buildAnalyzeAssetsPayload({
          model: providerConfig.model,
          storyboard: trimmedStoryboard,
          systemPrompt: systemPrompt?.trim() || getDefaultSystemPrompt("analyze_assets"),
        }),
      ),
    },
  );

  if (!providerResponse.ok) {
    const providerError = await providerResponse.text();

    return NextResponse.json(
      {
        error: providerError || "The AI provider request failed while analyzing assets.",
      },
      { status: providerResponse.status },
    );
  }

  const analysis = extractAssetAnalysisFromResponse(await providerResponse.json());
  return NextResponse.json(analysis);
}

import { NextResponse } from "next/server";

import {
  type AssetDescriptionKind,
  buildAssetDescriptionPayload,
  extractAssetDescriptionText,
} from "@/lib/asset-description-generation";
import { getTaskProviderConfig } from "@/lib/task-provider-config";

export const runtime = "nodejs";

type AssetDescriptionRequest = {
  assetKind?: AssetDescriptionKind;
  assetName?: string;
  assetDetail?: string;
  currentPrompt?: string;
  systemPrompt?: string;
};

const SUPPORTED_ASSET_KINDS = new Set(["character", "scene", "item"]);

export async function POST(request: Request) {
  const {
    assetKind,
    assetName,
    assetDetail,
    currentPrompt,
    systemPrompt,
  }: AssetDescriptionRequest = await request.json();
  const trimmedAssetName = assetName?.trim();
  const trimmedSystemPrompt = systemPrompt?.trim();

  if (!assetKind || !SUPPORTED_ASSET_KINDS.has(assetKind)) {
    return NextResponse.json({ error: "Asset kind is required." }, { status: 400 });
  }

  if (!trimmedAssetName) {
    return NextResponse.json({ error: "Asset name is required." }, { status: 400 });
  }

  if (!trimmedSystemPrompt) {
    return NextResponse.json({ error: "System prompt is required." }, { status: 400 });
  }

  let providerConfig;

  try {
    providerConfig = getTaskProviderConfig("asset_description_generation");
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
        buildAssetDescriptionPayload({
          model: providerConfig.model,
          assetKind,
          assetName: trimmedAssetName,
          assetDetail: assetDetail?.trim() ?? "",
          currentPrompt: currentPrompt?.trim() ?? "",
          systemPrompt: trimmedSystemPrompt,
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
          "The AI provider request failed while generating the asset description.",
      },
      { status: providerResponse.status },
    );
  }

  const description = extractAssetDescriptionText(await providerResponse.json());
  return NextResponse.json({ description });
}

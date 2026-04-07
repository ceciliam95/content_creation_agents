import { NextResponse } from "next/server";

import {
  buildImageGenerationPayload,
  extractImageGenerationResult,
} from "@/lib/image-generation";
import { getTaskProviderConfig } from "@/lib/task-provider-config";

export const runtime = "nodejs";

type ImageGenerationRequest = {
  prompt?: string;
};

export async function POST(request: Request) {
  const { prompt }: ImageGenerationRequest = await request.json();
  const trimmedPrompt = prompt?.trim();

  if (!trimmedPrompt) {
    return NextResponse.json({ error: "Image prompt is required." }, { status: 400 });
  }

  let providerConfig;

  try {
    providerConfig = getTaskProviderConfig("image_generation");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Missing image provider configuration.";

    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const response = await fetch(`${providerConfig.baseUrl}/images/generations`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${providerConfig.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(
        buildImageGenerationPayload({
          model: providerConfig.model,
          prompt: trimmedPrompt,
        }),
      ),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        typeof data?.message === "string"
          ? data.message
          : "Image generation request failed.",
      );
    }

    return NextResponse.json(extractImageGenerationResult(data));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image generation failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

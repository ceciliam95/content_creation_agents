import { NextResponse } from "next/server";

import {
  extractImageGenerationResult,
  type GptProtoImageModelId,
} from "@/lib/image-generation";
import { getTaskProviderConfig } from "@/lib/task-provider-config";

export const runtime = "nodejs";

type ImageGenerationStatusRequest = {
  model?: GptProtoImageModelId;
  taskId?: string;
};

async function parseJsonResponse(response: Response) {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function getApiError(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;

    if (typeof record.failReason === "string" && record.failReason.trim()) {
      return record.failReason;
    }

    if (typeof record.message === "string") {
      return record.message;
    }

    if (typeof record.error === "string") {
      return record.error;
    }
  }

  return fallback;
}

function getProgress(data: unknown) {
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;

    if (typeof record.progress === "string") {
      return record.progress;
    }

    if (record.data && typeof record.data === "object") {
      const nested = record.data as Record<string, unknown>;

      if (typeof nested.status === "string") {
        return nested.status;
      }
    }
  }

  return undefined;
}

export async function POST(request: Request) {
  const { model, taskId }: ImageGenerationStatusRequest = await request.json();
  const trimmedTaskId = taskId?.trim();

  if (!model || !trimmedTaskId) {
    return NextResponse.json(
      { error: "Model and taskId are required." },
      { status: 400 },
    );
  }

  if (model !== "midjourney" && model !== "viduq2") {
    return NextResponse.json(
      { error: "Status check is only available for Midjourney and Vidu Q2." },
      { status: 400 },
    );
  }

  let providerConfig;

  try {
    providerConfig = getTaskProviderConfig("image_generation");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Missing image provider configuration.";

    return NextResponse.json({ error: message }, { status: 500 });
  }

  const baseUrl = providerConfig.baseUrl.replace(/\/$/, "");

  try {
    const response =
      model === "midjourney"
        ? await fetch(`https://gptproto.com/mj/task/${trimmedTaskId}/fetch`, {
            headers: {
              Authorization: providerConfig.apiKey,
            },
          })
        : await fetch(`${baseUrl}/predictions/${trimmedTaskId}/result`, {
            headers: {
              Authorization: `Bearer ${providerConfig.apiKey}`,
              "Content-Type": "application/json",
            },
          });
    const data = await parseJsonResponse(response);

    if (!response.ok) {
      throw new Error(getApiError(data, "Image status check failed."));
    }

    try {
      const parsed = extractImageGenerationResult(data);

      return NextResponse.json({
        model,
        status: "completed",
        taskId: trimmedTaskId,
        imageUrl: parsed.imageUrl,
        inferenceMs: parsed.inferenceMs,
        seed: parsed.seed,
      });
    } catch {
      return NextResponse.json({
        model,
        status: "processing",
        taskId: trimmedTaskId,
        progress: getProgress(data),
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        model,
        status: "failed",
        taskId: trimmedTaskId,
        error:
          error instanceof Error ? error.message : "Image status check failed.",
      },
      { status: 500 },
    );
  }
}

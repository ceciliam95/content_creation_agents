import { NextResponse } from "next/server";

import {
  buildGptProtoGrokImagePayload,
  buildGptProtoImageEditPayload,
  buildGptProtoImageGenerationPayload,
  buildGptProtoMidjourneyImageToImagePayload,
  buildGptProtoMidjourneyImaginePayload,
  buildGptProtoViduImagePayload,
  extractImageGenerationResult,
  extractMidjourneyTaskId,
  extractPredictionId,
  getGptProtoImageModelsForMode,
  summarizeImageGenerationResponse,
  type GptProtoImageMode,
  type GptProtoImageModelId,
  type ImageGenerationResponseSummary,
} from "@/lib/image-generation";
import { readProjectFileAsDataUrl } from "@/lib/local-project-storage";
import { getTaskProviderConfig } from "@/lib/task-provider-config";

export const runtime = "nodejs";

type ImageGenerationRequest = {
  prompt?: string;
  mode?: "text_to_image" | "image_to_image";
  model?: string;
  models?: string[];
  size?: string;
  aspectRatio?: string;
  outputFormat?: string;
  projectRootPath?: string;
  referenceImages?: ReferenceImageInput[];
};

type ReferenceImageInput = {
  name?: string;
  dataUrl?: string;
  path?: string;
  source?: "upload" | "project";
};

type ImageGenerationRouteResult = {
  model: GptProtoImageModelId;
  status: "completed" | "processing" | "failed";
  imageUrl?: string;
  taskId?: string;
  error?: string;
  diagnostics?: ImageGenerationDiagnostics;
  inferenceMs?: number;
  seed?: number;
};

type ImageGenerationDiagnostics = {
  provider?: string;
  endpoint?: string;
  httpStatus?: number;
  responseShape?: ImageGenerationResponseSummary;
};

const midjourneyPollDelayMs = 3000;
const midjourneyPollAttempts = 8;
const predictionPollDelayMs = 3000;
const predictionPollAttempts = 8;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeModelIds(
  models: string[] | undefined,
  model: string | undefined,
  fallbackModel: string,
  mode: GptProtoImageMode,
): GptProtoImageModelId[] {
  const supportedImageModels = new Set(
    getGptProtoImageModelsForMode(mode).map((item) => item.id),
  );
  const rawModels = models?.length ? models : [model || fallbackModel];
  const normalized = rawModels
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item): item is GptProtoImageModelId =>
      supportedImageModels.has(item as GptProtoImageModelId),
    );

  return normalized.length ? Array.from(new Set(normalized)) : ["gemini-3.1-flash-image-preview"];
}

async function normalizeReferenceImages({
  referenceImages,
  projectRootPath,
}: {
  referenceImages: ReferenceImageInput[] | undefined;
  projectRootPath: string | undefined;
}) {
  const images = await Promise.all(
    (referenceImages ?? []).map(async (image) => {
      const dataUrl = image.dataUrl?.trim();

      if (dataUrl) {
        return dataUrl;
      }

      const projectPath = image.path?.trim();

      if (projectPath) {
        return readProjectFileAsDataUrl(projectRootPath?.trim() ?? "", projectPath);
      }

      return "";
    }),
  );

  return images.filter(Boolean);
}

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

    if (typeof record.message === "string") {
      return record.message;
    }

    if (typeof record.error === "string") {
      return record.error;
    }
  }

  return fallback;
}

function createImageGenerationError(
  message: string,
  diagnostics: ImageGenerationDiagnostics,
) {
  const error = new Error(message);

  Object.assign(error, { diagnostics });

  return error;
}

function getImageGenerationErrorDiagnostics(
  error: unknown,
): ImageGenerationDiagnostics | undefined {
  if (error && typeof error === "object" && "diagnostics" in error) {
    return (error as { diagnostics?: ImageGenerationDiagnostics }).diagnostics;
  }

  return undefined;
}

async function runGeminiImageGeneration({
  apiKey,
  baseUrl,
  model,
  prompt,
  size,
  aspectRatio,
  outputFormat,
}: {
  apiKey: string;
  baseUrl: string;
  model: GptProtoImageModelId;
  prompt: string;
  size: string;
  aspectRatio: string;
  outputFormat: string;
}): Promise<ImageGenerationRouteResult> {
  const endpoint = `${baseUrl}/google/${model}/text-to-image`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      buildGptProtoImageGenerationPayload({
        prompt,
        size,
        aspectRatio,
        outputFormat,
      }),
    ),
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw createImageGenerationError(getApiError(data, "Gemini image generation failed."), {
      provider: "gemini",
      endpoint,
      httpStatus: response.status,
      responseShape: summarizeImageGenerationResponse(data),
    });
  }

  let parsed;

  try {
    parsed = extractImageGenerationResult(data);
  } catch (error) {
    throw createImageGenerationError(
      error instanceof Error ? error.message : "Gemini image generation failed.",
      {
        provider: "gemini",
        endpoint,
        httpStatus: response.status,
        responseShape: summarizeImageGenerationResponse(data),
      },
    );
  }

  return {
    model,
    status: "completed",
    imageUrl: parsed.imageUrl,
    inferenceMs: parsed.inferenceMs,
    seed: parsed.seed,
  };
}

async function runGeminiImageEdit({
  apiKey,
  baseUrl,
  model,
  prompt,
  images,
  size,
  aspectRatio,
  outputFormat,
}: {
  apiKey: string;
  baseUrl: string;
  model: GptProtoImageModelId;
  prompt: string;
  images: string[];
  size: string;
  aspectRatio: string;
  outputFormat: string;
}): Promise<ImageGenerationRouteResult> {
  const endpoint = `${baseUrl}/google/${model}/image-edit`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      buildGptProtoImageEditPayload({
        prompt,
        images,
        size,
        aspectRatio,
        outputFormat,
      }),
    ),
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw createImageGenerationError(getApiError(data, "Gemini image edit failed."), {
      provider: "gemini",
      endpoint,
      httpStatus: response.status,
      responseShape: summarizeImageGenerationResponse(data),
    });
  }

  let parsed;

  try {
    parsed = extractImageGenerationResult(data);
  } catch (error) {
    try {
      const predictionId = extractPredictionId(data);

      for (let attempt = 0; attempt < predictionPollAttempts; attempt += 1) {
        if (attempt > 0) {
          await sleep(predictionPollDelayMs);
        }

        const resultResponse = await fetch(`${baseUrl}/predictions/${predictionId}/result`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        });
        const resultData = await parseJsonResponse(resultResponse);

        if (!resultResponse.ok) {
          throw createImageGenerationError(
            getApiError(resultData, "Gemini image edit prediction fetch failed."),
            {
              provider: "gemini",
              endpoint: `${baseUrl}/predictions/${predictionId}/result`,
              httpStatus: resultResponse.status,
              responseShape: summarizeImageGenerationResponse(resultData),
            },
          );
        }

        try {
          const predictionResult = extractImageGenerationResult(resultData);

          return {
            model,
            status: "completed",
            taskId: predictionId,
            imageUrl: predictionResult.imageUrl,
            inferenceMs: predictionResult.inferenceMs,
            seed: predictionResult.seed,
          };
        } catch {
          // Keep polling while Gemini image-edit has no final image URL yet.
        }
      }

      return {
        model,
        status: "processing",
        taskId: predictionId,
      };
    } catch (predictionError) {
      if (getImageGenerationErrorDiagnostics(predictionError)) {
        throw predictionError;
      }

      // Fall through to the original parse diagnostics below.
    }

    throw createImageGenerationError(
      error instanceof Error ? error.message : "Gemini image edit failed.",
      {
        provider: "gemini",
        endpoint,
        httpStatus: response.status,
        responseShape: summarizeImageGenerationResponse(data),
      },
    );
  }

  return {
    model,
    status: "completed",
    imageUrl: parsed.imageUrl,
    inferenceMs: parsed.inferenceMs,
    seed: parsed.seed,
  };
}

async function runGrokImageGeneration({
  apiKey,
  prompt,
  aspectRatio,
}: {
  apiKey: string;
  prompt: string;
  aspectRatio: string;
}): Promise<ImageGenerationRouteResult> {
  const endpoint = "https://gptproto.com/v1/images/generations";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      buildGptProtoGrokImagePayload({
        prompt,
        aspectRatio,
      }),
    ),
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw createImageGenerationError(getApiError(data, "Grok image generation failed."), {
      provider: "grok",
      endpoint,
      httpStatus: response.status,
      responseShape: summarizeImageGenerationResponse(data),
    });
  }

  let parsed;

  try {
    parsed = extractImageGenerationResult(data);
  } catch (error) {
    throw createImageGenerationError(
      error instanceof Error ? error.message : "Grok image generation failed.",
      {
        provider: "grok",
        endpoint,
        httpStatus: response.status,
        responseShape: summarizeImageGenerationResponse(data),
      },
    );
  }

  return {
    model: "grok-imagine-image",
    status: "completed",
    imageUrl: parsed.imageUrl,
  };
}

async function runMidjourneyImageGeneration({
  apiKey,
  prompt,
}: {
  apiKey: string;
  prompt: string;
}): Promise<ImageGenerationRouteResult> {
  return runMidjourneySubmitAndPoll({
    apiKey,
    payload: buildGptProtoMidjourneyImaginePayload({ prompt }),
  });
}

async function runMidjourneyImageEdit({
  apiKey,
  prompt,
  images,
}: {
  apiKey: string;
  prompt: string;
  images: string[];
}): Promise<ImageGenerationRouteResult> {
  return runMidjourneySubmitAndPoll({
    apiKey,
    payload: buildGptProtoMidjourneyImageToImagePayload({ prompt, images }),
  });
}

async function runMidjourneySubmitAndPoll({
  apiKey,
  payload,
}: {
  apiKey: string;
  payload: ReturnType<typeof buildGptProtoMidjourneyImaginePayload>;
}): Promise<ImageGenerationRouteResult> {
  const submitResponse = await fetch("https://gptproto.com/mj/submit/imagine", {
    method: "POST",
    headers: {
      Authorization: apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const submitData = await parseJsonResponse(submitResponse);

  if (!submitResponse.ok) {
    throw new Error(getApiError(submitData, "Midjourney submit failed."));
  }

  const taskId = extractMidjourneyTaskId(submitData);

  for (let attempt = 0; attempt < midjourneyPollAttempts; attempt += 1) {
    if (attempt > 0) {
      await sleep(midjourneyPollDelayMs);
    }

    const fetchResponse = await fetch(`https://gptproto.com/mj/task/${taskId}/fetch`, {
      headers: {
        Authorization: apiKey,
      },
    });
    const fetchData = await parseJsonResponse(fetchResponse);

    if (!fetchResponse.ok) {
      throw new Error(getApiError(fetchData, "Midjourney fetch failed."));
    }

    try {
      return {
        model: "midjourney",
        status: "completed",
        taskId,
        imageUrl: extractImageGenerationResult(fetchData).imageUrl,
      };
    } catch {
      // Keep polling until the task has an image URL or we hit the short timeout.
    }
  }

  return {
    model: "midjourney",
    status: "processing",
    taskId,
  };
}

async function runViduImageGeneration({
  apiKey,
  baseUrl,
  prompt,
  aspectRatio,
}: {
  apiKey: string;
  baseUrl: string;
  prompt: string;
  aspectRatio: string;
}): Promise<ImageGenerationRouteResult> {
  const response = await fetch(`${baseUrl}/vidu/viduq2/text-to-image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      buildGptProtoViduImagePayload({
        prompt,
        aspectRatio,
      }),
    ),
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    throw new Error(getApiError(data, "Vidu Q2 image generation failed."));
  }

  try {
    return {
      model: "viduq2",
      status: "completed",
      imageUrl: extractImageGenerationResult(data).imageUrl,
    };
  } catch {
    // Vidu often returns a prediction id first; poll the prediction result endpoint.
  }

  const predictionId = extractPredictionId(data);

  for (let attempt = 0; attempt < predictionPollAttempts; attempt += 1) {
    if (attempt > 0) {
      await sleep(predictionPollDelayMs);
    }

    const resultResponse = await fetch(`${baseUrl}/predictions/${predictionId}/result`, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });
    const resultData = await parseJsonResponse(resultResponse);

    if (!resultResponse.ok) {
      throw new Error(getApiError(resultData, "Vidu Q2 prediction fetch failed."));
    }

    try {
      return {
        model: "viduq2",
        status: "completed",
        taskId: predictionId,
        imageUrl: extractImageGenerationResult(resultData).imageUrl,
      };
    } catch {
      // Keep polling while the prediction has no image URL yet.
    }
  }

  return {
    model: "viduq2",
    status: "processing",
    taskId: predictionId,
  };
}

export async function POST(request: Request) {
  const {
    prompt,
    mode,
    model,
    models,
    size,
    aspectRatio,
    outputFormat,
    projectRootPath,
    referenceImages,
  }: ImageGenerationRequest = await request.json();
  const trimmedPrompt = prompt?.trim();
  const generationMode: GptProtoImageMode = mode ?? "text_to_image";

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
    const baseUrl = providerConfig.baseUrl.replace(/\/$/, "");
    const selectedModels = normalizeModelIds(
      models,
      model,
      providerConfig.model,
      generationMode,
    );
    const normalizedReferenceImages =
      generationMode === "image_to_image"
        ? await normalizeReferenceImages({
            referenceImages,
            projectRootPath,
          })
        : [];

    if (generationMode === "image_to_image" && !normalizedReferenceImages.length) {
      return NextResponse.json(
        { error: "At least one reference image is required for image-to-image." },
        { status: 400 },
      );
    }

    const results = await Promise.all(
      selectedModels.map(async (selectedModel) => {
        try {
          if (generationMode === "image_to_image") {
            if (selectedModel === "midjourney") {
              return await runMidjourneyImageEdit({
                apiKey: providerConfig.apiKey,
                prompt: trimmedPrompt,
                images: normalizedReferenceImages,
              });
            }

            return await runGeminiImageEdit({
              apiKey: providerConfig.apiKey,
              baseUrl,
              model: selectedModel,
              prompt: trimmedPrompt,
              images: normalizedReferenceImages,
              size: size?.trim() || "1K",
              aspectRatio: aspectRatio?.trim() || "1:1",
              outputFormat: outputFormat?.trim() || "png",
            });
          }

          if (selectedModel === "grok-imagine-image") {
            return await runGrokImageGeneration({
              apiKey: providerConfig.apiKey,
              prompt: trimmedPrompt,
              aspectRatio: aspectRatio?.trim() || "1:1",
            });
          }

          if (selectedModel === "midjourney") {
            return await runMidjourneyImageGeneration({
              apiKey: providerConfig.apiKey,
              prompt: trimmedPrompt,
            });
          }

          if (selectedModel === "viduq2") {
            return await runViduImageGeneration({
              apiKey: providerConfig.apiKey,
              baseUrl,
              prompt: trimmedPrompt,
              aspectRatio: aspectRatio?.trim() || "1:1",
            });
          }

          return await runGeminiImageGeneration({
            apiKey: providerConfig.apiKey,
            baseUrl,
            model: selectedModel,
            prompt: trimmedPrompt,
            size: size?.trim() || "1K",
            aspectRatio: aspectRatio?.trim() || "1:1",
            outputFormat: outputFormat?.trim() || "png",
          });
        } catch (error) {
          return {
            model: selectedModel,
            status: "failed",
            error:
              error instanceof Error
                ? error.message
                : "Image generation failed.",
            diagnostics: getImageGenerationErrorDiagnostics(error),
          } satisfies ImageGenerationRouteResult;
        }
      }),
    );

    return NextResponse.json({ results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Image generation failed.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}

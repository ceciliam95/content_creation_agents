export const IMAGE_GENERATION_DEFAULTS = {
  image_size: "1024x1024",
  batch_size: 1,
  num_inference_steps: 20,
  guidance_scale: 7.5,
} as const;

export const QWEN_IMAGE_GENERATION_DEFAULTS = {
  num_inference_steps: 50,
  cfg: 4,
} as const;

type ImageGenerationInput = {
  model: string;
  prompt: string;
};

type GptProtoImageGenerationInput = {
  prompt: string;
  size: string;
  aspectRatio: string;
  outputFormat: string;
};

type GptProtoImageEditInput = GptProtoImageGenerationInput & {
  images: string[];
};

type GptProtoGrokImageInput = {
  prompt: string;
  aspectRatio: string;
};

type GptProtoMidjourneyImagineInput = {
  prompt: string;
};

type GptProtoMidjourneyImageToImageInput = {
  prompt: string;
  images: string[];
};

type GptProtoViduImageInput = {
  prompt: string;
  aspectRatio: string;
};

type ImageGenerationResponse = {
  [key: string]: unknown;
  images?: Array<{
    url?: string;
    image_url?: string;
  }>;
  data?:
    | {
        url?: string;
        image_url?: string;
        images?: Array<{
          url?: string;
          image_url?: string;
        }>;
      }
    | Array<{
        url?: string;
        image_url?: string;
      }>;
  url?: string;
  image_url?: string;
  timings?: {
    inference?: number;
  };
  seed?: number;
};

export type ImageGenerationResult = {
  imageUrl: string;
  inferenceMs?: number;
  seed?: number;
};

export type ImageGenerationResponseSummary = {
  topLevelKeys: string[];
  hasImageUrlCandidate: boolean;
  hasBase64Candidate: boolean;
  idCandidate?: string;
  sampleImageUrlCandidate?: string;
  sampleBase64Candidate?: string;
};

const GPTPROTO_TEXT_TO_IMAGE_MODELS = [
  {
    id: "gemini-3.1-flash-image-preview",
    label: "Gemini 3.1 Flash Image Preview",
    provider: "gptproto-google",
    runMode: "sync",
  },
  {
    id: "grok-imagine-image",
    label: "Grok Imagine Image",
    provider: "gptproto-openai-image",
    runMode: "sync",
  },
  {
    id: "midjourney",
    label: "Midjourney",
    provider: "gptproto-midjourney",
    runMode: "async",
  },
  {
    id: "viduq2",
    label: "Vidu Q2",
    provider: "gptproto-vidu",
    runMode: "sync",
  },
] as const;

const GPTPROTO_IMAGE_TO_IMAGE_MODELS = [
  {
    id: "gemini-3.1-flash-image-preview",
    label: "Gemini 3.1 Flash Image Preview",
    provider: "gptproto-google",
    runMode: "sync",
  },
  {
    id: "midjourney",
    label: "Midjourney",
    provider: "gptproto-midjourney",
    runMode: "async",
  },
] as const;

export const GPTPROTO_IMAGE_MODEL_REGISTRY = {
  text_to_image: GPTPROTO_TEXT_TO_IMAGE_MODELS,
  image_to_image: GPTPROTO_IMAGE_TO_IMAGE_MODELS,
} as const;

export const GPTPROTO_IMAGE_MODELS = GPTPROTO_TEXT_TO_IMAGE_MODELS;

export type GptProtoImageMode = keyof typeof GPTPROTO_IMAGE_MODEL_REGISTRY;
export type GptProtoImageModelId =
  (typeof GPTPROTO_TEXT_TO_IMAGE_MODELS)[number]["id"] |
  (typeof GPTPROTO_IMAGE_TO_IMAGE_MODELS)[number]["id"];

export function getGptProtoImageModelsForMode(mode: GptProtoImageMode) {
  return GPTPROTO_IMAGE_MODEL_REGISTRY[mode];
}

export function buildImageGenerationPayload({
  model,
  prompt,
}: ImageGenerationInput) {
  if (model.startsWith("Qwen/")) {
    return {
      model,
      prompt,
      ...QWEN_IMAGE_GENERATION_DEFAULTS,
    };
  }

  return {
    model,
    prompt,
    ...IMAGE_GENERATION_DEFAULTS,
  };
}

export function buildGptProtoImageGenerationPayload({
  prompt,
  size,
  aspectRatio,
  outputFormat,
}: GptProtoImageGenerationInput) {
  return {
    prompt,
    size,
    aspect_ratio: aspectRatio,
    output_format: outputFormat,
    enable_sync_mode: true,
    enable_base64_output: false,
  };
}

export function buildGptProtoImageEditPayload({
  prompt,
  images,
  size,
  aspectRatio,
  outputFormat,
}: GptProtoImageEditInput) {
  return {
    prompt,
    images,
    size,
    aspect_ratio: aspectRatio,
    output_format: outputFormat,
    enable_sync_mode: true,
    enable_base64_output: false,
  };
}

export function buildGptProtoGrokImagePayload({
  prompt,
  aspectRatio,
}: GptProtoGrokImageInput) {
  return {
    model: "grok-imagine-image",
    prompt,
    n: 1,
    aspect_ratio: aspectRatio,
    response_format: "url",
  };
}

export function buildGptProtoMidjourneyImaginePayload({
  prompt,
}: GptProtoMidjourneyImagineInput) {
  return buildMidjourneySubmitPayload({
    prompt,
    base64Array: [],
  });
}

export function buildGptProtoMidjourneyImageToImagePayload({
  prompt,
  images,
}: GptProtoMidjourneyImageToImageInput) {
  return buildMidjourneySubmitPayload({
    prompt,
    base64Array: images,
  });
}

function buildMidjourneySubmitPayload({
  prompt,
  base64Array,
}: {
  prompt: string;
  base64Array: string[];
}) {
  return {
    botType: "MID_JOURNEY",
    prompt,
    base64Array,
    accountFilter: {
      channelId: "",
      instanceId: "",
      modes: [],
      remark: "",
      remix: true,
      remixAutoConsidered: true,
    },
    notifyHook: "",
    state: "",
  };
}

export function buildGptProtoViduImagePayload({
  prompt,
  aspectRatio,
}: GptProtoViduImageInput) {
  return {
    prompt,
    aspect_ratio: aspectRatio,
    resolution: "1080p",
    seed: 1,
  };
}

function findStringByKeys(value: unknown, keys: string[]): string | undefined {
  if (typeof value === "string") {
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findStringByKeys(item, keys);

      if (found) {
        return found;
      }
    }
  }

  if (value && typeof value === "object") {
    for (const [key, nested] of Object.entries(value)) {
      if (keys.includes(key) && typeof nested === "string" && nested.trim()) {
        return nested.trim();
      }

      const found = findStringByKeys(nested, keys);

      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

export function extractMidjourneyTaskId(response: unknown): string {
  const taskId = findStringByKeys(response, ["result", "id", "taskId", "task_id"]);

  if (!taskId) {
    throw new Error("Midjourney submit response did not include a task id.");
  }

  return taskId;
}

export function extractPredictionId(response: unknown): string {
  const getUrl = findStringByKeys(response, ["get"]);
  const match = getUrl?.match(/\/predictions\/([^/]+)\/result/i);

  if (match?.[1]) {
    return match[1];
  }

  const directId = findStringByKeys(response, ["id", "predictionId", "prediction_id"]);

  if (directId) {
    return directId;
  }

  throw new Error("Prediction response did not include an id.");
}

function findImageUrl(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    const embeddedImageUrl = trimmed.match(
      /https?:\/\/\S+\.(?:png|jpe?g|webp|gif)(?:\?\S*)?/i,
    )?.[0];

    if (embeddedImageUrl && !/\/(?:task|submit)\//i.test(embeddedImageUrl)) {
      return embeddedImageUrl;
    }

    if (
      /^https?:\/\/.+/i.test(trimmed) &&
      !/\/(?:task|submit)\//i.test(trimmed) &&
      (
        /\.(?:png|jpe?g|webp|gif)(?:\?|#|$)/i.test(trimmed) ||
        /(?:image|img|cdn|file|asset|storage|output|generated)/i.test(trimmed)
      )
    ) {
      return trimmed;
    }

    return undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findImageUrl(item);

      if (found) {
        return found;
      }
    }
  }

  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) {
      const found = findImageUrl(nested);

      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

function findBase64Image(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();

    if (
      /^data:image\/[a-z0-9.+-]+;base64,/i.test(trimmed) ||
      /^[a-z0-9+/=\r\n]{120,}$/i.test(trimmed)
    ) {
      return trimmed;
    }

    return undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findBase64Image(item);

      if (found) {
        return found;
      }
    }
  }

  if (value && typeof value === "object") {
    for (const nested of Object.values(value)) {
      const found = findBase64Image(nested);

      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

function truncateDiagnosticValue(value: string, maxLength = 140) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...[truncated ${value.length - maxLength} chars]`;
}

export function summarizeImageGenerationResponse(
  response: unknown,
): ImageGenerationResponseSummary {
  const topLevelKeys =
    response && typeof response === "object" && !Array.isArray(response)
      ? Object.keys(response).sort()
      : [];
  const imageUrlCandidate = findImageUrl(response);
  const base64Candidate = findBase64Image(response);
  const idCandidate =
    findStringByKeys(response, ["id", "predictionId", "prediction_id", "taskId", "task_id"]) ??
    undefined;

  return {
    topLevelKeys,
    hasImageUrlCandidate: Boolean(imageUrlCandidate),
    hasBase64Candidate: Boolean(base64Candidate),
    ...(idCandidate ? { idCandidate } : {}),
    ...(imageUrlCandidate
      ? { sampleImageUrlCandidate: truncateDiagnosticValue(imageUrlCandidate) }
      : {}),
    ...(base64Candidate
      ? { sampleBase64Candidate: truncateDiagnosticValue(base64Candidate) }
      : {}),
  };
}

export function extractImageGenerationResult(
  response: ImageGenerationResponse,
): ImageGenerationResult {
  const imageUrl =
    response.images?.[0]?.url?.trim() ??
    response.images?.[0]?.image_url?.trim() ??
    (Array.isArray(response.data)
      ? (response.data[0]?.url ?? response.data[0]?.image_url)?.trim()
      : undefined) ??
    (!Array.isArray(response.data)
      ? (response.data?.url ?? response.data?.image_url)?.trim()
      : undefined) ??
    (!Array.isArray(response.data)
      ? (response.data?.images?.[0]?.url ?? response.data?.images?.[0]?.image_url)?.trim()
      : undefined) ??
    response.url?.trim() ??
    response.image_url?.trim() ??
    findImageUrl(response);

  if (!imageUrl) {
    throw new Error("Image generation response did not include an image URL.");
  }

  return {
    imageUrl,
    ...(typeof response.timings?.inference === "number"
      ? { inferenceMs: response.timings.inference }
      : {}),
    ...(typeof response.seed === "number" ? { seed: response.seed } : {}),
  };
}

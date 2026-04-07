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

type SiliconFlowImageGenerationResponse = {
  images?: Array<{
    url?: string;
  }>;
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

export function extractImageGenerationResult(
  response: SiliconFlowImageGenerationResponse,
): ImageGenerationResult {
  const imageUrl = response.images?.[0]?.url?.trim();

  if (!imageUrl) {
    throw new Error("Image generation response did not include an image URL.");
  }

  return {
    imageUrl,
    inferenceMs: response.timings?.inference,
    seed: response.seed,
  };
}

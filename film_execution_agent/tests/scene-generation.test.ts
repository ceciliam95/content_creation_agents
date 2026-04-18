import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSceneGenerationPayload,
  extractSceneText,
} from "../lib/scene-generation";
import { getDefaultSystemPrompt } from "../lib/default-prompts";
import {
  getTaskStylePromptConfig,
  listTaskStyleOptions,
} from "../lib/task-style-registry";
import { getTaskProviderConfig } from "../lib/task-provider-config";
import {
  buildAnalyzeAssetsPayload,
  extractAssetAnalysisFromResponse,
} from "../lib/asset-analysis";
import { createManualAsset } from "../lib/asset-factory";
import {
  buildPromptTemplatePath,
  sanitizePromptTemplateName,
} from "../lib/prompt-library";
import {
  buildGptProtoGrokImagePayload,
  buildImageGenerationPayload,
  buildGptProtoImageGenerationPayload,
  buildGptProtoMidjourneyImaginePayload,
  buildGptProtoViduImagePayload,
  extractImageGenerationResult,
  extractMidjourneyTaskId,
  extractPredictionId,
} from "../lib/image-generation";
import {
  buildAssetDescriptionPayload,
  extractAssetDescriptionText,
} from "../lib/asset-description-generation";

test("buildSceneGenerationPayload includes a system message when provided", () => {
  const payload = buildSceneGenerationPayload({
    model: "deepseek-ai/DeepSeek-V3.2",
    script: "A woman waits at a bus stop before sunrise.",
    systemPrompt: "Break the script into concise cinematic scenes.",
  });

  assert.equal(payload.model, "deepseek-ai/DeepSeek-V3.2");
  assert.equal(payload.messages.length, 2);
  assert.deepEqual(payload.messages[0], {
    role: "system",
    content: "Break the script into concise cinematic scenes.",
  });
  assert.match(payload.messages[1].content, /A woman waits/);
});

test("buildSceneGenerationPayload omits a blank system prompt", () => {
  const payload = buildSceneGenerationPayload({
    model: "deepseek-ai/DeepSeek-V3.2",
    script: "Interior. A quiet kitchen at dawn.",
    systemPrompt: "   ",
  });

  assert.equal(payload.messages.length, 1);
  assert.equal(payload.messages[0].role, "user");
});

test("extractSceneText returns the first assistant message content", () => {
  const output = extractSceneText({
    choices: [
      {
        message: {
          content: "01. Dawn kitchen scene\n02. Character enters the frame",
        },
      },
    ],
  });

  assert.equal(output, "01. Dawn kitchen scene\n02. Character enters the frame");
});

test("extractSceneText supports array-style content blocks", () => {
  const output = extractSceneText({
    choices: [
      {
        message: {
          content: [
            { type: "text", text: "01. Exterior street scene" },
            { type: "text", text: "\n02. Close-up on the character" },
          ],
        },
      },
    ],
  });

  assert.equal(output, "01. Exterior street scene\n02. Close-up on the character");
});

test("getTaskProviderConfig resolves script_to_scenes env vars", () => {
  const config = getTaskProviderConfig("script_to_scenes", {
    SCRIPT_TO_SCENES_API_KEY: "secret-key",
    SCRIPT_TO_SCENES_MODEL: "deepseek-ai/DeepSeek-V3.2",
    SCRIPT_TO_SCENES_BASE_URL: "https://api.siliconflow.cn/v1",
  });

  assert.deepEqual(config, {
    apiKey: "secret-key",
    model: "deepseek-ai/DeepSeek-V3.2",
    baseUrl: "https://api.siliconflow.cn/v1",
  });
});

test("getTaskProviderConfig resolves voice_tagging env vars", () => {
  const config = getTaskProviderConfig("voice_tagging", {
    VOICE_TAGGING_API_KEY: "voice-secret",
    VOICE_TAGGING_MODEL: "deepseek-ai/DeepSeek-V3.2",
    VOICE_TAGGING_BASE_URL: "https://api.siliconflow.cn/v1",
  });

  assert.deepEqual(config, {
    apiKey: "voice-secret",
    model: "deepseek-ai/DeepSeek-V3.2",
    baseUrl: "https://api.siliconflow.cn/v1",
  });
});

test("getTaskProviderConfig resolves dialogue_tts env vars", () => {
  const config = getTaskProviderConfig("dialogue_tts", {
    DIALOGUE_TTS_API_KEY: "eleven-secret",
    DIALOGUE_TTS_MODEL: "eleven_multilingual_v2",
    DIALOGUE_TTS_BASE_URL: "https://api.elevenlabs.io",
  });

  assert.deepEqual(config, {
    apiKey: "eleven-secret",
    model: "eleven_multilingual_v2",
    baseUrl: "https://api.elevenlabs.io",
  });
});

test("getTaskProviderConfig resolves image_generation env vars", () => {
  const config = getTaskProviderConfig("image_generation", {
    GPTPROTO_API_KEY: "gptproto-secret",
    IMAGE_GENERATION_MODEL: "gemini-3.1-flash-image-preview",
    IMAGE_GENERATION_BASE_URL: "https://gptproto.com/api/v3",
  });

  assert.deepEqual(config, {
    apiKey: "gptproto-secret",
    model: "gemini-3.1-flash-image-preview",
    baseUrl: "https://gptproto.com/api/v3",
  });
});

test("getTaskProviderConfig resolves asset_description_generation env vars", () => {
  const config = getTaskProviderConfig("asset_description_generation", {
    ASSET_DESCRIPTION_API_KEY: "description-secret",
    ASSET_DESCRIPTION_MODEL: "deepseek-ai/DeepSeek-V3.2",
    ASSET_DESCRIPTION_BASE_URL: "https://api.siliconflow.cn/v1",
  });

  assert.deepEqual(config, {
    apiKey: "description-secret",
    model: "deepseek-ai/DeepSeek-V3.2",
    baseUrl: "https://api.siliconflow.cn/v1",
  });
});

test("getTaskProviderConfig throws when a task api key is missing", () => {
  assert.throws(
    () =>
      getTaskProviderConfig("script_to_scenes", {
        SCRIPT_TO_SCENES_MODEL: "deepseek-ai/DeepSeek-V3.2",
        SCRIPT_TO_SCENES_BASE_URL: "https://api.siliconflow.cn/v1",
      }),
    /Missing SCRIPT_TO_SCENES_API_KEY/,
  );
});

test("getDefaultSystemPrompt returns the script_to_scenes prompt", () => {
  const prompt = getDefaultSystemPrompt("script_to_scenes");

  assert.match(prompt, /分镜表/);
  assert.match(prompt, /台词必须保持和剧本一致/);
});

test("getDefaultSystemPrompt returns the voice_tagging prompt", () => {
  const prompt = getDefaultSystemPrompt("voice_tagging");

  assert.match(prompt, /voice tagging/i);
  assert.match(prompt, /every sentence/i);
});

test("listTaskStyleOptions returns styles for character_image", () => {
  const styles = listTaskStyleOptions("character_image");

  assert.ok(styles.length >= 3);
  assert.deepEqual(styles[0], {
    value: "2d_animation",
    label: "2D Animation",
  });
});

test("getTaskStylePromptConfig returns dialogue_tts style metadata", () => {
  const config = getTaskStylePromptConfig("dialogue_tts", "natural_drama");

  assert.equal(config.label, "Natural Drama");
  assert.match(config.systemPrompt, /voice performance/i);
  assert.match(config.userPromptTemplate, /dialogue text/i);
});

test("buildAnalyzeAssetsPayload includes system and user messages", () => {
  const payload = buildAnalyzeAssetsPayload({
    model: "deepseek-ai/DeepSeek-V3.2",
    storyboard: "SCENE 1\n人物：Eleanor\n地点：Study",
    systemPrompt: "Extract assets as JSON.",
  });

  assert.equal(payload.model, "deepseek-ai/DeepSeek-V3.2");
  assert.equal(payload.messages.length, 2);
  assert.equal(payload.messages[0].role, "system");
  assert.match(payload.messages[1].content, /SCENE 1/);
});

test("extractAssetAnalysisFromResponse parses JSON text returned by the model", () => {
  const output = extractAssetAnalysisFromResponse({
    choices: [
      {
        message: {
          content: JSON.stringify({
            dialogues: [
              { id: "dialogue-1", character: "Eleanor", text: "Line", status: "ready" },
            ],
            characters: [
              { id: "character-1", name: "Eleanor", detail: "Lead", status: "ready" },
            ],
            scenes: [
              { id: "scene-1", name: "Study", detail: "Library room", status: "ready" },
            ],
            items: [
              { id: "item-1", name: "Letter", detail: "A folded letter", status: "reuse" },
            ],
          }),
        },
      },
    ],
  });

  assert.equal(output.dialogues[0].character, "Eleanor");
  assert.equal(output.scenes[0].name, "Study");
  assert.equal(output.items[0].status, "reuse");
});

test("createManualAsset creates a blank dialogue asset", () => {
  const asset = createManualAsset("dialogue", 3);

  assert.deepEqual(asset, {
    kind: "dialogue",
    asset: {
      id: "dialogue-manual-3",
      character: "VO",
      text: "",
      status: "ready",
    },
    title: "VO",
    subtitle: "Dialogue",
    status: "ready",
  });
});

test("createManualAsset creates a character asset with a starter name", () => {
  const asset = createManualAsset("character", 2);

  assert.equal(asset.kind, "character");
  assert.equal(asset.asset.id, "character-manual-2");
  assert.equal(asset.asset.name, "New Character 2");
  assert.equal(asset.subtitle, "Character");
});

test("sanitizePromptTemplateName appends txt and strips invalid characters", () => {
  const fileName = sanitizePromptTemplateName('default:item prompt?.txt');

  assert.equal(fileName, "defaultitem prompt.txt");
});

test("buildPromptTemplatePath stays inside the prompt library folder", () => {
  const output = buildPromptTemplatePath(
    "C:\\workspace\\image_generation_prompts",
    "default item prompt",
  );

  assert.match(output.filePath, /default item prompt\.txt$/i);
  assert.equal(output.fileName, "default item prompt.txt");
});

test("buildImageGenerationPayload uses the SiliconFlow Qwen image defaults", () => {
  const payload = buildImageGenerationPayload({
    model: "Qwen/Qwen-Image-Edit-2509",
    prompt: "Generate a transparent item icon.",
  });

  assert.deepEqual(payload, {
    model: "Qwen/Qwen-Image-Edit-2509",
    prompt: "Generate a transparent item icon.",
    num_inference_steps: 50,
    cfg: 4,
  });
});

test("buildImageGenerationPayload keeps Kolors-specific image defaults", () => {
  const payload = buildImageGenerationPayload({
    model: "Kwai-Kolors/Kolors",
    prompt: "Generate a transparent item icon.",
  });

  assert.deepEqual(payload, {
    model: "Kwai-Kolors/Kolors",
    prompt: "Generate a transparent item icon.",
    image_size: "1024x1024",
    batch_size: 1,
    num_inference_steps: 20,
    guidance_scale: 7.5,
  });
});

test("extractImageGenerationResult returns the first generated image metadata", () => {
  const output = extractImageGenerationResult({
    images: [{ url: "https://example.com/generated.png" }],
    timings: { inference: 123 },
    seed: 987,
  });

  assert.deepEqual(output, {
    imageUrl: "https://example.com/generated.png",
    inferenceMs: 123,
    seed: 987,
  });
});

test("buildGptProtoImageGenerationPayload builds Gemini text-to-image request body", () => {
  const payload = buildGptProtoImageGenerationPayload({
    prompt: "Generate a candle icon.",
    size: "1K",
    aspectRatio: "1:1",
    outputFormat: "png",
  });

  assert.deepEqual(payload, {
    prompt: "Generate a candle icon.",
    size: "1K",
    aspect_ratio: "1:1",
    output_format: "png",
    enable_sync_mode: true,
    enable_base64_output: false,
  });
});

test("extractImageGenerationResult supports GPT Proto image URL responses", () => {
  const output = extractImageGenerationResult({
    data: {
      image_url: "https://example.com/gptproto.png",
    },
  });

  assert.deepEqual(output, {
    imageUrl: "https://example.com/gptproto.png",
  });
});

test("extractImageGenerationResult finds deeply nested GPT Proto image URLs", () => {
  const output = extractImageGenerationResult({
    data: {
      result: {
        output: ["https://example.com/nested-output.png"],
      },
    },
  });

  assert.deepEqual(output, {
    imageUrl: "https://example.com/nested-output.png",
  });
});

test("extractImageGenerationResult ignores non-image task fetch URLs", () => {
  assert.throws(
    () =>
      extractImageGenerationResult({
        data: {
          progressUrl: "https://example.com/mj/task/task-123/fetch",
        },
      }),
    /did not include an image URL/,
  );
});

test("buildGptProtoGrokImagePayload builds OpenAI-compatible image body", () => {
  const payload = buildGptProtoGrokImagePayload({
    prompt: "Generate a manor house.",
    aspectRatio: "16:9",
  });

  assert.deepEqual(payload, {
    model: "grok-imagine-image",
    prompt: "Generate a manor house.",
    n: 1,
    aspect_ratio: "16:9",
    response_format: "url",
  });
});

test("buildGptProtoViduImagePayload builds Vidu Q2 text-to-image body", () => {
  const payload = buildGptProtoViduImagePayload({
    prompt: "Generate a sushi chef.",
    aspectRatio: "1:1",
  });

  assert.deepEqual(payload, {
    prompt: "Generate a sushi chef.",
    aspect_ratio: "1:1",
    resolution: "1080p",
    seed: 1,
  });
});

test("buildGptProtoMidjourneyImaginePayload builds submit imagine body", () => {
  const payload = buildGptProtoMidjourneyImaginePayload({
    prompt: "Cat",
  });

  assert.deepEqual(payload, {
    botType: "MID_JOURNEY",
    prompt: "Cat",
    base64Array: [],
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
  });
});

test("extractMidjourneyTaskId supports common submit response fields", () => {
  assert.equal(extractMidjourneyTaskId({ result: "task-123" }), "task-123");
  assert.equal(extractMidjourneyTaskId({ data: { id: "task-456" } }), "task-456");
});

test("extractPredictionId supports GPT Proto prediction response fields", () => {
  assert.equal(extractPredictionId({ data: { id: "prediction-123" } }), "prediction-123");
  assert.equal(
    extractPredictionId({
      data: {
        urls: {
          get: "https://gptproto.com/api/v3/predictions/prediction-456/result",
        },
      },
    }),
    "prediction-456",
  );
});

test("extractImageGenerationResult reads Midjourney imageUrl when complete", () => {
  const output = extractImageGenerationResult({
    status: "SUCCESS",
    imageUrl: "https://cdn.discordapp.com/attachments/generated.png",
  });

  assert.deepEqual(output, {
    imageUrl: "https://cdn.discordapp.com/attachments/generated.png",
  });
});

test("buildAssetDescriptionPayload includes asset context and prompt", () => {
  const payload = buildAssetDescriptionPayload({
    model: "deepseek-ai/DeepSeek-V3.2",
    assetKind: "character",
    assetName: "Eleanor",
    assetDetail: "An aristocratic young woman.",
    currentPrompt: "Character reference prompt",
    systemPrompt: "Describe the character for image generation.",
  });

  assert.equal(payload.model, "deepseek-ai/DeepSeek-V3.2");
  assert.equal(payload.messages.length, 2);
  assert.deepEqual(payload.messages[0], {
    role: "system",
    content: "Describe the character for image generation.",
  });
  assert.match(payload.messages[1].content, /Asset Type: character/);
  assert.match(payload.messages[1].content, /Asset Name: Eleanor/);
  assert.match(payload.messages[1].content, /Character reference prompt/);
});

test("extractAssetDescriptionText returns assistant text", () => {
  const output = extractAssetDescriptionText({
    choices: [
      {
        message: {
          content: "A focused production-ready character description.",
        },
      },
    ],
  });

  assert.equal(output, "A focused production-ready character description.");
});

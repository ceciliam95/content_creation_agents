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

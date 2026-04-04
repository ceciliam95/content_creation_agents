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

  assert.match(prompt, /把输入剧本变成分镜表/);
  assert.match(prompt, /台词必须保持和剧本一致/);
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

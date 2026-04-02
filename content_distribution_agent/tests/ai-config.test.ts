import test from "node:test";
import assert from "node:assert/strict";
import { loadAiConfig } from "@/lib/ai-config";

test("loadAiConfig reads required SiliconFlow env vars", () => {
  process.env.AI_BASE_URL = "https://api.siliconflow.cn/v1";
  process.env.AI_API_KEY = "test-key";
  process.env.AI_MODEL = "deepseek-ai/DeepSeek-V3.2";

  assert.deepEqual(loadAiConfig(), {
    baseUrl: "https://api.siliconflow.cn/v1",
    apiKey: "test-key",
    model: "deepseek-ai/DeepSeek-V3.2"
  });
});

test("loadAiConfig throws when a required env var is missing", () => {
  delete process.env.AI_BASE_URL;
  process.env.AI_API_KEY = "test-key";
  process.env.AI_MODEL = "deepseek-ai/DeepSeek-V3.2";

  assert.throws(() => loadAiConfig(), /Missing AI_BASE_URL, AI_API_KEY, or AI_MODEL\./);
});

import test from "node:test";
import assert from "node:assert/strict";
import { createPromptSettingsHandlers } from "@/lib/prompt-settings-route";

test("prompt settings GET returns the current config", async () => {
  const handlers = createPromptSettingsHandlers({
    store: {
      readConfig: async () => ({
        wechat: { activeTemplateId: "wechat-default", templates: [] },
        xiaohongshu: { activeTemplateId: "x-default", templates: [] },
        twitter: { activeTemplateId: "t-default", templates: [] },
        videoScript: { activeTemplateId: "v-default", templates: [] }
      })
    }
  });

  const response = await handlers.GET();
  const payload = (await response.json()) as { config?: { wechat?: { activeTemplateId?: string } } };

  assert.equal(response.status, 200);
  assert.equal(payload.config?.wechat?.activeTemplateId, "wechat-default");
});

test("prompt settings POST saveTemplate returns the updated config", async () => {
  const handlers = createPromptSettingsHandlers({
    store: {
      readConfig: async () => {
        throw new Error("unused");
      },
      saveTemplate: async () => ({
        wechat: {
          activeTemplateId: "wechat-default",
          templates: [
            {
              id: "wechat-default",
              name: "默认",
              prompt: "prompt",
              updatedAt: "2026-04-03T00:00:00.000Z"
            }
          ]
        },
        xiaohongshu: { activeTemplateId: "x-default", templates: [] },
        twitter: { activeTemplateId: "t-default", templates: [] },
        videoScript: { activeTemplateId: "v-default", templates: [] }
      })
    }
  });

  const response = await handlers.POST(
    new Request("http://localhost/api/prompt-settings", {
      method: "POST",
      body: JSON.stringify({
        action: "saveTemplate",
        platform: "wechat",
        template: { name: "默认", prompt: "prompt" }
      })
    })
  );

  assert.equal(response.status, 200);
});

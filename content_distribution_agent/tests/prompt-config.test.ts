import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { promises as fs } from "node:fs";
import { createPromptConfigStore } from "@/lib/prompt-config-store";

function createTempConfigPath(name: string) {
  return path.join(
    process.cwd(),
    "tests",
    ".tmp",
    `${name}-${Date.now()}-${Math.random().toString(16).slice(2)}.json`
  );
}

test("prompt config store seeds all platform defaults", async () => {
  const configPath = createTempConfigPath("seed");
  const store = createPromptConfigStore({ configPath });

  const config = await store.readConfig();

  assert.equal(config.wechat.templates.length > 0, true);
  assert.equal(config.xiaohongshu.templates.length > 0, true);
  assert.equal(config.twitter.templates.length > 0, true);
  assert.equal(config.videoScript.templates.length > 0, true);

  await fs.rm(configPath, { force: true });
});

test("prompt config store can activate one template and refuses deleting the last template", async () => {
  const configPath = createTempConfigPath("mutations");
  const store = createPromptConfigStore({ configPath });

  const created = await store.saveTemplate({
    platform: "wechat",
    template: {
      name: "增长稿",
      prompt: "你是一名公众号增长编辑。"
    }
  });

  const afterActive = await store.setActiveTemplate({
    platform: "wechat",
    templateId: created.id
  });

  assert.equal(afterActive.wechat.activeTemplateId, created.id);

  await assert.rejects(
    () =>
      store.deleteTemplate({
        platform: "videoScript",
        templateId: afterActive.videoScript.activeTemplateId
      }),
    /At least one template must remain for each platform\./
  );

  await fs.rm(configPath, { force: true });
});

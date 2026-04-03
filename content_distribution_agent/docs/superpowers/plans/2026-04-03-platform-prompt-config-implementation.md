# Platform Prompt Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a shared prompt template config system, a real settings management UI, and route WeChat generation through the active platform template as a `system` prompt.

**Architecture:** A server-side config store will manage one JSON file containing templates and active-template pointers for all supported platforms. A settings API will expose read and mutation actions. The settings page will use that API, while the WeChat generation route will load the active WeChat template and send it as the model `system` message.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Node test runner via `tsx --test`

---

### Task 1: Add failing tests for the prompt config store

**Files:**
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\tests\prompt-config.test.ts`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\package.json`

- [ ] **Step 1: Write a failing test for default config seeding**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { createPromptConfigStore } from "@/lib/prompt-config-store";

test("prompt config store seeds all platform defaults", async () => {
  const store = createPromptConfigStore({
    configPath: new URL("./tmp-prompt-config.json", import.meta.url)
  });

  const config = await store.readConfig();

  assert.equal(config.wechat.templates.length > 0, true);
  assert.equal(config.xiaohongshu.templates.length > 0, true);
  assert.equal(config.twitter.templates.length > 0, true);
  assert.equal(config.videoScript.templates.length > 0, true);
});
```

- [ ] **Step 2: Write a failing test for set-active and delete rules**

```ts
test("prompt config store can activate one template and refuse deleting the last template", async () => {
  const store = createPromptConfigStore({
    configPath: new URL("./tmp-prompt-config-2.json", import.meta.url)
  });

  const created = await store.saveTemplate({
    platform: "wechat",
    template: { name: "增长稿", prompt: "你是公众号增长编辑。" }
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
});
```

- [ ] **Step 3: Update the test script**

```json
"test": "tsx --test tests/mock-data.test.ts tests/workspace-state.test.ts tests/workspace-config.test.ts tests/settings-defaults.test.ts tests/ai-config.test.ts tests/wechat-generation.test.ts tests/generate-wechat-route.test.ts tests/content-factory-state.test.ts tests/prompt-config.test.ts tests/prompt-settings-route.test.ts"
```

- [ ] **Step 4: Run tests to verify failure**

Run: `npm test`
Expected: FAIL because `@/lib/prompt-config-store` does not exist yet

### Task 2: Implement the prompt config store

**Files:**
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\lib\prompt-config-store.ts`
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\config\prompt-templates.json`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\lib\types.ts`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\lib\prompt-defaults.ts`

- [ ] **Step 1: Add prompt config types**

```ts
export type PromptPlatformKey = "wechat" | "xiaohongshu" | "twitter" | "videoScript";

export type PromptTemplate = {
  id: string;
  name: string;
  prompt: string;
  updatedAt: string;
};

export type PlatformPromptConfig = {
  activeTemplateId: string;
  templates: PromptTemplate[];
};

export type PromptConfig = Record<PromptPlatformKey, PlatformPromptConfig>;
```

- [ ] **Step 2: Implement file-backed config store with defaults**

```ts
export function createPromptConfigStore({ configPath = defaultConfigPath } = {}) {
  return {
    async readConfig() { /* seed defaults if missing */ },
    async saveTemplate({ platform, template }) { /* create or update */ },
    async setActiveTemplate({ platform, templateId }) { /* update active */ },
    async deleteTemplate({ platform, templateId }) { /* protect last template */ }
  };
}
```

- [ ] **Step 3: Add a committed default config file**

```json
{
  "wechat": { "activeTemplateId": "wechat-default", "templates": [ ... ] },
  "xiaohongshu": { "activeTemplateId": "xiaohongshu-default", "templates": [ ... ] },
  "twitter": { "activeTemplateId": "twitter-default", "templates": [ ... ] },
  "videoScript": { "activeTemplateId": "video-default", "templates": [ ... ] }
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test`
Expected: PASS for `tests/prompt-config.test.ts`

### Task 3: Add failing tests for the settings API

**Files:**
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\tests\prompt-settings-route.test.ts`

- [ ] **Step 1: Write a failing GET test**

```ts
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
  assert.equal(response.status, 200);
});
```

- [ ] **Step 2: Write a failing POST action test**

```ts
test("prompt settings POST saveTemplate returns updated config", async () => {
  const handlers = createPromptSettingsHandlers({
    store: {
      readConfig: async () => { throw new Error("unused"); },
      saveTemplate: async () => ({
        wechat: { activeTemplateId: "wechat-default", templates: [{ id: "wechat-default", name: "默认", prompt: "prompt", updatedAt: "2026-04-03T00:00:00.000Z" }] },
        xiaohongshu: { activeTemplateId: "x-default", templates: [] },
        twitter: { activeTemplateId: "t-default", templates: [] },
        videoScript: { activeTemplateId: "v-default", templates: [] }
      })
    }
  });

  const response = await handlers.POST(new Request("http://localhost/api/prompt-settings", {
    method: "POST",
    body: JSON.stringify({
      action: "saveTemplate",
      platform: "wechat",
      template: { name: "默认", prompt: "prompt" }
    })
  }));

  assert.equal(response.status, 200);
});
```

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test`
Expected: FAIL because the settings route helper does not exist yet

### Task 4: Implement the settings API route

**Files:**
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\lib\prompt-settings-route.ts`
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\app\api\prompt-settings\route.ts`

- [ ] **Step 1: Implement route handlers**

```ts
export function createPromptSettingsHandlers({ store = createPromptConfigStore() } = {}) {
  return {
    async GET() {
      const config = await store.readConfig();
      return NextResponse.json({ config });
    },
    async POST(request: Request) {
      const body = await request.json();
      // branch on action: saveTemplate / deleteTemplate / setActiveTemplate
    }
  };
}
```

- [ ] **Step 2: Keep `route.ts` exporting only `GET` and `POST`**

```ts
const handlers = createPromptSettingsHandlers();
export const GET = handlers.GET;
export const POST = handlers.POST;
```

- [ ] **Step 3: Run tests to verify pass**

Run: `npm test`
Expected: PASS for `tests/prompt-settings-route.test.ts`

### Task 5: Add failing tests for WeChat generation using system prompt config

**Files:**
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\tests\generate-wechat-route.test.ts`

- [ ] **Step 1: Add a failing test that inspects the model request**

```ts
test("generateWechatBundle sends the active WeChat template as the system prompt", async () => {
  let capturedBody = "";
  const generation = await generateWechatBundleWithDeps({
    request: "围绕 AI 工具写文章",
    fetchImpl: async (_url, init) => {
      capturedBody = String(init?.body ?? "");
      return new Response(JSON.stringify({
        choices: [{ message: { content: JSON.stringify(validBundle) } }]
      }), { status: 200 });
    },
    loadConfig: () => ({ baseUrl: "https://api.example.com", apiKey: "key", model: "model" }),
    loadPromptConfig: async () => validPromptConfig
  });

  assert.equal(generation.wechat.title.length > 0, true);
  assert.match(capturedBody, /"role":"system"/);
  assert.match(capturedBody, /公众号系统提示词/);
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test`
Expected: FAIL because the WeChat generator does not yet load prompt config or emit a system message

### Task 6: Implement WeChat generation with active template system prompt

**Files:**
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\lib\generate-wechat-route.ts`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\lib\wechat-generation.ts`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\components\content-factory-app.tsx`

- [ ] **Step 1: Load active WeChat template from config on the server**

```ts
const promptConfig = await store.readConfig();
const activeTemplate = promptConfig.wechat.templates.find(
  (item) => item.id === promptConfig.wechat.activeTemplateId
);
if (!activeTemplate) {
  throw new Error("No active WeChat prompt template is configured.");
}
```

- [ ] **Step 2: Send the active template as `system` and the user request/schema as `user`**

```ts
messages: [
  { role: "system", content: activeTemplate.prompt },
  { role: "user", content: buildWechatPrompt({ request }) }
]
```

- [ ] **Step 3: Stop sending `wechatPrompt` from the client**

```ts
body: JSON.stringify({ request })
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test`
Expected: PASS for updated WeChat route tests

### Task 7: Add settings page state tests and implement the UI

**Files:**
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\tests\prompt-settings-state.test.ts`
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\lib\prompt-settings-state.ts`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\components\prompt-settings-form.tsx`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\app\settings\page.tsx`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\app\globals.css`

- [ ] **Step 1: Write a failing state test for template editing**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { selectTemplateForEdit } from "@/lib/prompt-settings-state";

test("selectTemplateForEdit returns the matching template draft", () => {
  const draft = selectTemplateForEdit({
    templates: [{ id: "wechat-default", name: "默认", prompt: "prompt", updatedAt: "2026-04-03T00:00:00.000Z" }],
    templateId: "wechat-default"
  });

  assert.equal(draft.name, "默认");
});
```

- [ ] **Step 2: Build the settings UI around live API data**

```ts
// left platform switcher
// template list
// active badge
// form fields: template name + prompt
// buttons: new / save / delete / set active
```

- [ ] **Step 3: Add save/reset feedback and empty-state handling**

```ts
setNotice("模板已保存。");
setError("保存失败。");
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test`
Expected: PASS for `tests/prompt-settings-state.test.ts`

### Task 8: Add the left-bottom settings entry and run full verification

**Files:**
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\components\history-sidebar.tsx`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\components\workspace-shell.tsx`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\tests\workspace-state.test.ts`

- [ ] **Step 1: Add a visible settings link in the sidebar footer**

```ts
import Link from "next/link";

<div className="history-sidebar-footer">
  <Link href="/settings" className="sidebar-settings-link">
    设置
  </Link>
</div>
```

- [ ] **Step 2: Run the full verification suite**

Run: `npm test`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS

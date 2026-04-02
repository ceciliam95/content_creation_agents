# WeChat Generation Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first real AI-backed generation flow so the content factory can create a `总策划/母稿` and `公众号文章` from a user request using SiliconFlow.

**Architecture:** The homepage will call one server route dedicated to WeChat generation. That route will load OpenAI-compatible config from environment variables, call SiliconFlow, normalize the JSON output into the app's `SessionRecord` shape, and return a generated session to the client. The client will keep local session history state and switch into the workspace on success.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Node test runner via `tsx --test`

---

### Task 1: Add failing tests for AI config and generation normalization

**Files:**
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\tests\ai-config.test.ts`
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\tests\wechat-generation.test.ts`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\package.json`

- [ ] **Step 1: Write the failing AI config test**

```ts
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
```

- [ ] **Step 2: Write the failing normalization test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { buildSessionFromGeneration } from "@/lib/wechat-generation";

test("buildSessionFromGeneration maps model output into a session", () => {
  const session = buildSessionFromGeneration({
    request: "围绕 AI 出海工具写一篇公众号文章",
    generation: {
      title: "AI 出海工具内容包",
      masterDraft: {
        title: "AI 出海工具进入结构化增长阶段",
        audience: "独立开发者",
        objective: "建立专业认知",
        keyMessage: "行业进入结构化竞争",
        outline: ["趋势", "机会"],
        platformNotes: ["公众号强调深度"]
      },
      wechat: {
        title: "为什么现在值得重新关注 AI 出海工具",
        abstract: "从趋势和用户需求拆解机会",
        body: "正文示例",
        cta: "欢迎留言交流"
      }
    }
  });

  assert.equal(session.outputs.wechat?.title, "为什么现在值得重新关注 AI 出海工具");
  assert.equal(session.masterDraft.title, "AI 出海工具进入结构化增长阶段");
});
```

- [ ] **Step 3: Update the test script to include the new files**

```json
"test": "tsx --test tests/mock-data.test.ts tests/workspace-state.test.ts tests/workspace-config.test.ts tests/settings-defaults.test.ts tests/ai-config.test.ts tests/wechat-generation.test.ts tests/generate-wechat-route.test.ts"
```

- [ ] **Step 4: Run tests to verify failure**

Run: `npm test`
Expected: FAIL because `@/lib/ai-config` and `@/lib/wechat-generation` do not exist yet

- [ ] **Step 5: Commit**

```bash
git add package.json tests/ai-config.test.ts tests/wechat-generation.test.ts
git commit -m "test: cover wechat generation helpers"
```

### Task 2: Implement server-side config and normalization helpers

**Files:**
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\lib\ai-config.ts`
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\lib\wechat-generation.ts`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\lib\types.ts`

- [ ] **Step 1: Implement `loadAiConfig`**

```ts
export function loadAiConfig() {
  const baseUrl = process.env.AI_BASE_URL?.trim();
  const apiKey = process.env.AI_API_KEY?.trim();
  const model = process.env.AI_MODEL?.trim();

  if (!baseUrl || !apiKey || !model) {
    throw new Error("Missing AI_BASE_URL, AI_API_KEY, or AI_MODEL.");
  }

  return { baseUrl, apiKey, model };
}
```

- [ ] **Step 2: Add generation types and session normalization**

```ts
export type GeneratedWechatBundle = {
  title: string;
  masterDraft: MasterDraft;
  wechat: {
    title: string;
    abstract: string;
    body: string;
    cta: string;
  };
};

export function buildSessionFromGeneration({
  request,
  generation
}: {
  request: string;
  generation: GeneratedWechatBundle;
}): SessionRecord {
  return {
    id: `session-${Date.now()}`,
    title: generation.title,
    createdAt: new Date().toISOString(),
    selectedPlatforms: ["wechat"],
    request,
    masterDraft: generation.masterDraft,
    outputs: {
      wechat: generation.wechat
    }
  };
}
```

- [ ] **Step 3: Relax `SessionRecord.outputs` so platform keys are optional**

```ts
outputs: {
  wechat?: {
    title: string;
    abstract: string;
    body: string;
    cta: string;
  };
  xiaohongshu?: {
    images: string[];
    hook: string;
    body: string;
    tags: string[];
    prompt: string;
  };
  twitter?: TwitterVariant;
  videoScript?: {
    title: string;
    hook: string;
    sections: string[];
    closing: string;
  };
};
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test`
Expected: PASS for `tests/ai-config.test.ts` and `tests/wechat-generation.test.ts`

- [ ] **Step 5: Commit**

```bash
git add lib/ai-config.ts lib/wechat-generation.ts lib/types.ts tests/ai-config.test.ts tests/wechat-generation.test.ts package.json
git commit -m "feat: add wechat generation helpers"
```

### Task 3: Add failing route tests for the generation API

**Files:**
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\tests\generate-wechat-route.test.ts`

- [ ] **Step 1: Write the failing route success test**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { POST } from "@/app/api/generate-wechat/route";

test("POST /api/generate-wechat returns a generated session", async () => {
  const request = new Request("http://localhost/api/generate-wechat", {
    method: "POST",
    body: JSON.stringify({
      request: "围绕 AI 出海工具写一篇公众号文章",
      wechatPrompt: "输出适合公众号的深度长文"
    })
  });

  const response = await POST(request);
  assert.equal(response.status, 200);
});
```

- [ ] **Step 2: Write the failing invalid-input test**

```ts
test("POST /api/generate-wechat rejects an empty request", async () => {
  const request = new Request("http://localhost/api/generate-wechat", {
    method: "POST",
    body: JSON.stringify({
      request: "",
      wechatPrompt: "输出适合公众号的深度长文"
    })
  });

  const response = await POST(request);
  assert.equal(response.status, 400);
});
```

- [ ] **Step 3: Run tests to verify failure**

Run: `npm test`
Expected: FAIL because `@/app/api/generate-wechat/route` does not exist yet

- [ ] **Step 4: Commit**

```bash
git add tests/generate-wechat-route.test.ts
git commit -m "test: cover wechat generation route"
```

### Task 4: Implement the route and SiliconFlow call

**Files:**
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\app\api\generate-wechat\route.ts`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\lib\wechat-generation.ts`

- [ ] **Step 1: Add prompt builder and JSON parser helpers**

```ts
export function buildWechatPrompt({
  request,
  wechatPrompt
}: {
  request: string;
  wechatPrompt: string;
}) {
  return [
    "你是一个中文内容工厂助手。",
    "请根据用户需求生成总策划/母稿与公众号文章。",
    "只返回 JSON，不要返回 markdown。",
    "JSON 结构必须是：",
    JSON.stringify({
      title: "string",
      masterDraft: {
        title: "string",
        audience: "string",
        objective: "string",
        keyMessage: "string",
        outline: ["string"],
        platformNotes: ["string"]
      },
      wechat: {
        title: "string",
        abstract: "string",
        body: "string",
        cta: "string"
      }
    }),
    `用户需求：${request}`,
    `公众号平台规则：${wechatPrompt}`
  ].join("\n");
}
```

- [ ] **Step 2: Add the route implementation**

```ts
import { NextResponse } from "next/server";
import { loadAiConfig } from "@/lib/ai-config";
import {
  buildSessionFromGeneration,
  buildWechatPrompt,
  parseWechatGenerationResponse
} from "@/lib/wechat-generation";

export async function POST(request: Request) {
  const body = await request.json();
  const userRequest = body?.request?.trim();
  const wechatPrompt = body?.wechatPrompt?.trim();

  if (!userRequest || !wechatPrompt) {
    return NextResponse.json({ error: "缺少创作需求或公众号提示词。" }, { status: 400 });
  }

  try {
    const config = loadAiConfig();
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: config.model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [{ role: "user", content: buildWechatPrompt({ request: userRequest, wechatPrompt }) }]
      })
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `AI request failed with status ${response.status}.` },
        { status: 502 }
      );
    }

    const payload = await response.json();
    const generation = parseWechatGenerationResponse(payload);
    const session = buildSessionFromGeneration({ request: userRequest, generation });

    return NextResponse.json({ session });
  } catch (error) {
    const message = error instanceof Error ? error.message : "生成失败。";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Run tests to verify pass**

Run: `npm test`
Expected: PASS for `tests/generate-wechat-route.test.ts`

- [ ] **Step 4: Commit**

```bash
git add app/api/generate-wechat/route.ts lib/wechat-generation.ts tests/generate-wechat-route.test.ts
git commit -m "feat: add wechat generation api"
```

### Task 5: Add failing UI tests for generation state

**Files:**
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\tests\content-factory-state.test.ts`

- [ ] **Step 1: Write a failing state test around generated sessions**

```ts
import test from "node:test";
import assert from "node:assert/strict";
import { createGeneratedSessionState } from "@/lib/content-factory-state";

test("createGeneratedSessionState prepends a generated session and activates it", () => {
  const result = createGeneratedSessionState({
    existingSessions: [],
    session: {
      id: "session-new",
      title: "新内容",
      createdAt: "2026-04-02T12:00:00.000Z",
      selectedPlatforms: ["wechat"],
      request: "写一篇文章",
      masterDraft: {
        title: "母稿",
        audience: "读者",
        objective: "目标",
        keyMessage: "核心信息",
        outline: ["一"],
        platformNotes: ["公众号强调深度"]
      },
      outputs: {
        wechat: {
          title: "文章标题",
          abstract: "摘要",
          body: "正文",
          cta: "结尾"
        }
      }
    }
  });

  assert.equal(result.activeSessionId, "session-new");
  assert.equal(result.sessions[0]?.title, "新内容");
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test`
Expected: FAIL because `@/lib/content-factory-state` does not exist yet

- [ ] **Step 3: Commit**

```bash
git add tests/content-factory-state.test.ts
git commit -m "test: cover generated session state"
```

### Task 6: Implement client generation flow

**Files:**
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\lib\content-factory-state.ts`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\components\content-factory-app.tsx`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\components\home-composer.tsx`
- Modify: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\components\workspace-shell.tsx`

- [ ] **Step 1: Implement session state helper**

```ts
export function createGeneratedSessionState({
  existingSessions,
  session
}: {
  existingSessions: SessionRecord[];
  session: SessionRecord;
}) {
  return {
    sessions: [session, ...existingSessions],
    activeSessionId: session.id
  };
}
```

- [ ] **Step 2: Replace mock-only app state with local session state and loading/error handling**

```ts
const [sessions, setSessions] = useState(getMockSessions());
const [isGenerating, setIsGenerating] = useState(false);
const [error, setError] = useState<string | null>(null);

async function handleGenerate() {
  if (!request.trim()) {
    setError("请输入创作需求。");
    return;
  }

  if (!selectedPlatforms.includes("wechat")) {
    setError("第一阶段仅支持生成公众号内容，请至少选择公众号文章。");
    return;
  }

  setIsGenerating(true);
  setError(null);

  const response = await fetch("/api/generate-wechat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      request,
      wechatPrompt: promptDefaults.wechat
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    setError(payload.error ?? "生成失败。");
    setIsGenerating(false);
    return;
  }

  const nextState = createGeneratedSessionState({
    existingSessions: sessions,
    session: payload.session
  });

  setSessions(nextState.sessions);
  setActiveSessionId(nextState.activeSessionId);
  setIsGenerating(false);
}
```

- [ ] **Step 3: Update the composer UI to show loading and error messages**

```ts
type Props = {
  request: string;
  selectedPlatforms: PlatformKey[];
  isGenerating: boolean;
  error: string | null;
  onRequestChange: (value: string) => void;
  onTogglePlatform: (platform: PlatformKey) => void;
  onGenerate: () => void;
};
```

- [ ] **Step 4: Make workspace tabs resilient when only WeChat output exists**

```ts
{activeTab === "公众号" && activeSession.outputs.wechat ? (
  <WechatEditor output={activeSession.outputs.wechat} />
) : null}
```

- [ ] **Step 5: Run tests to verify pass**

Run: `npm test`
Expected: PASS for `tests/content-factory-state.test.ts` and previously green tests

- [ ] **Step 6: Commit**

```bash
git add components/content-factory-app.tsx components/home-composer.tsx components/workspace-shell.tsx lib/content-factory-state.ts tests/content-factory-state.test.ts
git commit -m "feat: wire wechat generation into workspace"
```

### Task 7: Add environment file and final verification

**Files:**
- Create: `C:\Users\Cecilia\Desktop\Her Strength Studio\dev\content_creation_agents\content_distribution_agent\.env.local`

- [ ] **Step 1: Add local AI config**

```env
AI_BASE_URL=https://api.siliconflow.cn/v1
AI_API_KEY=sk-robxxhwsynnqxtlfbmsnlbpogdlcarvhjkuaawacsswmfbvy
AI_MODEL=deepseek-ai/DeepSeek-V3.2
```

- [ ] **Step 2: Verify `.env.local` is gitignored**

Run: `Get-Content .gitignore`
Expected: `.env.local` is present

- [ ] **Step 3: Run the full verification suite**

Run: `npm test`
Expected: PASS

Run: `npm run lint`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app components lib tests package.json docs/superpowers/specs/2026-04-02-wechat-generation-phase-1-design.md docs/superpowers/plans/2026-04-02-wechat-generation-phase-1-implementation.md
git commit -m "feat: add wechat ai generation flow"
```

import test from "node:test";
import assert from "node:assert/strict";
import {
  createGenerateWechatHandler,
  generateWechatBundleWithDeps
} from "@/lib/generate-wechat-route";
import type { PromptConfig } from "@/lib/prompt-defaults";

const validBundle = {
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
};

const validPromptConfig: PromptConfig = {
  wechat: {
    activeTemplateId: "wechat-default",
    templates: [
      {
        id: "wechat-default",
        name: "默认深度稿",
        prompt: "公众号系统提示词",
        updatedAt: "2026-04-03T00:00:00.000Z"
      }
    ]
  },
  xiaohongshu: {
    activeTemplateId: "x-default",
    templates: [{ id: "x-default", name: "默认", prompt: "x", updatedAt: "2026-04-03T00:00:00.000Z" }]
  },
  twitter: {
    activeTemplateId: "t-default",
    templates: [{ id: "t-default", name: "默认", prompt: "t", updatedAt: "2026-04-03T00:00:00.000Z" }]
  },
  videoScript: {
    activeTemplateId: "v-default",
    templates: [{ id: "v-default", name: "默认", prompt: "v", updatedAt: "2026-04-03T00:00:00.000Z" }]
  }
};

test("createGenerateWechatHandler returns a generated session on success", async () => {
  const handler = createGenerateWechatHandler({
    generateWechatBundle: async () => validBundle
  });

  const request = new Request("http://localhost/api/generate-wechat", {
    method: "POST",
    body: JSON.stringify({
      request: "围绕 AI 出海工具写一篇公众号文章"
    })
  });

  const response = await handler(request);
  const payload = (await response.json()) as { session?: { outputs?: { wechat?: { title?: string } } } };

  assert.equal(response.status, 200);
  assert.equal(payload.session?.outputs?.wechat?.title, "为什么现在值得重新关注 AI 出海工具");
});

test("createGenerateWechatHandler rejects an empty request", async () => {
  const handler = createGenerateWechatHandler({
    generateWechatBundle: async () => {
      throw new Error("should not be called");
    }
  });

  const request = new Request("http://localhost/api/generate-wechat", {
    method: "POST",
    body: JSON.stringify({
      request: ""
    })
  });

  const response = await handler(request);

  assert.equal(response.status, 400);
});

test("createGenerateWechatHandler surfaces upstream generation errors", async () => {
  const handler = createGenerateWechatHandler({
    generateWechatBundle: async () => {
      throw new Error("AI request failed with status 502.");
    }
  });

  const request = new Request("http://localhost/api/generate-wechat", {
    method: "POST",
    body: JSON.stringify({
      request: "围绕 AI 出海工具写一篇公众号文章"
    })
  });

  const response = await handler(request);
  const payload = (await response.json()) as { error?: string };

  assert.equal(response.status, 502);
  assert.match(payload.error ?? "", /AI request failed with status 502\./);
});

test("generateWechatBundleWithDeps sends the active WeChat template as the system prompt", async () => {
  let capturedBody = "";

  const generation = await generateWechatBundleWithDeps({
    request: "围绕 AI 工具写文章",
    fetchImpl: async (_url, init) => {
      capturedBody = String(init?.body ?? "");
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify(validBundle) } }]
        }),
        { status: 200 }
      );
    },
    loadConfig: () => ({ baseUrl: "https://api.example.com", apiKey: "key", model: "model" }),
    loadPromptConfig: async () => validPromptConfig
  });

  assert.equal(generation.wechat.title.length > 0, true);
  assert.match(capturedBody, /"role":"system"/);
  assert.match(capturedBody, /公众号系统提示词/);
  assert.match(capturedBody, /"role":"user"/);
});

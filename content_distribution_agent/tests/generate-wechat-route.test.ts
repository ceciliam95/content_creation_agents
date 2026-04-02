import test from "node:test";
import assert from "node:assert/strict";
import { createGenerateWechatHandler } from "@/lib/generate-wechat-route";

test("createGenerateWechatHandler returns a generated session on success", async () => {
  const handler = createGenerateWechatHandler({
    generateWechatBundle: async () => ({
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
    })
  });

  const request = new Request("http://localhost/api/generate-wechat", {
    method: "POST",
    body: JSON.stringify({
      request: "围绕 AI 出海工具写一篇公众号文章",
      wechatPrompt: "输出适合公众号的深度长文"
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
      request: "",
      wechatPrompt: "输出适合公众号的深度长文"
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
      request: "围绕 AI 出海工具写一篇公众号文章",
      wechatPrompt: "输出适合公众号的深度长文"
    })
  });

  const response = await handler(request);
  const payload = (await response.json()) as { error?: string };

  assert.equal(response.status, 502);
  assert.match(payload.error ?? "", /AI request failed with status 502\./);
});

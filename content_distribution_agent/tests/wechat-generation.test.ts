import test from "node:test";
import assert from "node:assert/strict";
import {
  buildSessionFromGeneration,
  parseWechatGenerationContent
} from "@/lib/wechat-generation";

test("buildSessionFromGeneration maps model output into a WeChat session", () => {
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
    },
    now: new Date("2026-04-02T12:00:00.000Z")
  });

  assert.equal(session.outputs.wechat?.title, "为什么现在值得重新关注 AI 出海工具");
  assert.equal(session.masterDraft.title, "AI 出海工具进入结构化增长阶段");
  assert.deepEqual(session.selectedPlatforms, ["wechat"]);
});

test("parseWechatGenerationContent rejects malformed JSON", () => {
  assert.throws(
    () => parseWechatGenerationContent("not-json"),
    /Model output is not valid JSON\./
  );
});

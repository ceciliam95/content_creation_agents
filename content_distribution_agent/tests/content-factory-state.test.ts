import test from "node:test";
import assert from "node:assert/strict";
import { createGeneratedSessionState } from "@/lib/content-factory-state";

test("createGeneratedSessionState prepends a generated session and activates it", () => {
  const result = createGeneratedSessionState({
    existingSessions: [
      {
        id: "session-old",
        title: "旧内容",
        createdAt: "2026-04-01T12:00:00.000Z",
        selectedPlatforms: ["wechat"],
        request: "旧需求",
        masterDraft: {
          title: "旧母稿",
          audience: "读者",
          objective: "目标",
          keyMessage: "核心信息",
          outline: ["一"],
          platformNotes: ["公众号强调深度"]
        },
        outputs: {
          wechat: {
            title: "旧文章标题",
            abstract: "旧摘要",
            body: "旧正文",
            cta: "旧结尾"
          }
        }
      }
    ],
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
  assert.equal(result.sessions[1]?.title, "旧内容");
});

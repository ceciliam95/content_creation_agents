import test from "node:test";
import assert from "node:assert/strict";
import { getMockSessions } from "@/lib/mock-data";

test("workspace seeds from the latest mock session", () => {
  const session = getMockSessions()[0];

  assert.equal(session?.title, "AI 出海工具内容包");
  assert.deepEqual(session?.selectedPlatforms, [
    "wechat",
    "xiaohongshu",
    "twitter",
    "videoScript"
  ]);
});

import test from "node:test";
import assert from "node:assert/strict";
import { getMockSessions } from "@/lib/mock-data";

test("mock sessions include a master draft and platform outputs", () => {
  const session = getMockSessions()[0];

  assert.equal(Boolean(session), true);
  assert.equal(Boolean(session?.masterDraft), true);
  assert.equal(Boolean(session?.outputs.wechat), true);
  assert.equal(Boolean(session?.outputs.xiaohongshu), true);
  assert.equal(Boolean(session?.outputs.twitter), true);
  assert.equal(Boolean(session?.outputs.videoScript), true);
});

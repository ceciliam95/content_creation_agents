import test from "node:test";
import assert from "node:assert/strict";
import { promptDefaults } from "@/lib/prompt-defaults";

test("prompt defaults expose one prompt per supported platform", () => {
  assert.deepEqual(Object.keys(promptDefaults), [
    "wechat",
    "xiaohongshu",
    "twitter",
    "videoScript"
  ]);
});

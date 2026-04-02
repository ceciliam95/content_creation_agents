import test from "node:test";
import assert from "node:assert/strict";
import { shouldShowPublishAction, workspaceTabs } from "@/lib/workspace-config";

test("workspaceTabs keeps the master draft first and platform tabs after it", () => {
  assert.deepEqual(workspaceTabs, [
    "总策划/母稿",
    "公众号",
    "小红书",
    "Twitter",
    "视频脚本"
  ]);
});

test("publish action is only shown for wechat, xiaohongshu, and twitter tabs", () => {
  assert.equal(shouldShowPublishAction("总策划/母稿"), false);
  assert.equal(shouldShowPublishAction("公众号"), true);
  assert.equal(shouldShowPublishAction("小红书"), true);
  assert.equal(shouldShowPublishAction("Twitter"), true);
  assert.equal(shouldShowPublishAction("视频脚本"), false);
});

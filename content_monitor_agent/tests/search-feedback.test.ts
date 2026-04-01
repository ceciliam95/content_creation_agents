import test from "node:test";
import assert from "node:assert/strict";
import {
  formatMonitorRequestError,
  formatMonitorStatusError,
  getBlockingContentErrorMessage
} from "@/lib/search-feedback";

test("getBlockingContentErrorMessage keeps content visible when cached days exist", () => {
  const result = getBlockingContentErrorMessage("微信上游接口当前返回 500。", [
    {
      date: "2026-03-31",
      totalItems: 1,
      breakoutCount: 1,
      leadPlatform: "公众号",
      items: []
    }
  ]);

  assert.equal(result, null);
});

test("getBlockingContentErrorMessage blocks content only when there is no cached data", () => {
  const result = getBlockingContentErrorMessage("微信上游接口当前返回 500。", []);

  assert.equal(result, "微信上游接口当前返回 500。");
});

test("formatMonitorStatusError returns a user-facing upstream status message", () => {
  assert.equal(
    formatMonitorStatusError("wechat", 500),
    "微信上游接口当前返回 500，本次搜索未成功，请稍后重试。"
  );
});

test("formatMonitorRequestError normalizes low-level fetch failures", () => {
  assert.equal(
    formatMonitorRequestError("wechat", "fetch failed"),
    "微信请求暂时不可用，可能是网络或上游服务异常。"
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  getRecentSearchHistory,
  getSearchDetail,
  initializeSearchHistoryDb,
  saveWechatSearchResult
} from "@/lib/search-history";
import type { WechatApiResponse } from "@/lib/wechat-monitor";

function createTempDbPath() {
  return path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "wechat-history-")),
    "monitor.db"
  );
}

function createApiResponse(keyword: string): WechatApiResponse {
  return {
    code: 0,
    msg: "ok",
    requestId: "req-history",
    data: {
      data: [
        {
          avatar: "https://example.com/avatar.png",
          classify: "出海",
          content: `${keyword} 的文章摘要`,
          ghid: "gh_history",
          ip_wording: "北京",
          is_original: 1,
          looking: 12,
          praise: 20,
          publish_time: 1711728000,
          publish_time_str: "2026-03-30 08:00:00",
          read: 3200,
          short_link: "https://short/history",
          title: `${keyword} 的公众号文章`,
          update_time: 1711731600,
          update_time_str: "2026-03-30 09:00:00",
          url: "https://example.com/history",
          wx_id: "wx_history",
          wx_name: "历史监控号"
        }
      ],
      data_number: 1,
      page: 1,
      total: 1,
      total_page: 1
    }
  };
}

test("initializeSearchHistoryDb creates the sqlite file and schema", async () => {
  const dbPath = createTempDbPath();

  await initializeSearchHistoryDb(dbPath);

  assert.equal(fs.existsSync(dbPath), true);
});

test("saveWechatSearchResult persists a keyword search and its linked articles", async () => {
  const dbPath = createTempDbPath();

  await initializeSearchHistoryDb(dbPath);
  const saved = await saveWechatSearchResult({
    dbPath,
    keyword: "网文出海",
    status: "success",
    response: createApiResponse("网文出海")
  });

  const history = await getRecentSearchHistory(dbPath);
  const detail = await getSearchDetail(dbPath, saved.searchId);

  assert.equal(history.length, 1);
  assert.equal(history[0]?.keyword, "网文出海");
  assert.equal(history[0]?.articleCount, 1);
  assert.equal(history[0]?.reportStatus, "pending");

  assert.equal(detail?.search.keyword, "网文出海");
  assert.equal(detail?.days.length, 1);
  assert.equal(detail?.days[0]?.items[0]?.title, "网文出海 的公众号文章");
  assert.equal(detail?.report.reportStatus, "pending");
});

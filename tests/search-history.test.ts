import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  getRecentSearchHistory,
  getSearchDetail,
  initializeSearchHistoryDb,
  saveWechatSearchResult,
  saveXiaohongshuSearchResult
} from "@/lib/search-history";
import { openDatabase, initializeDatabase } from "@/lib/db";
import type { WechatApiResponse } from "@/lib/wechat-monitor";
import type { XiaohongshuApiResponse } from "@/lib/xiaohongshu-monitor";

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

test("initializeSearchHistoryDb migrates a legacy topic_reports table to add task_id", async () => {
  const dbPath = createTempDbPath();
  const db = await openDatabase(dbPath);

  await db.exec(`
    CREATE TABLE topic_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      report_status TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      hot_insights TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  await db.close();

  const initializedDb = await openDatabase(dbPath);
  await initializeDatabase(initializedDb);
  await initializedDb.close();

  const migratedDb = await openDatabase(dbPath);
  const columns = await migratedDb.all<Array<{ name: string }>>("PRAGMA table_info(topic_reports)");
  await migratedDb.close();

  assert.equal(columns.some((column) => column.name === "task_id"), true);
});

test("initializeSearchHistoryDb migrates a legacy topic_suggestions table to add analysis columns", async () => {
  const dbPath = createTempDbPath();
  const db = await openDatabase(dbPath);

  await db.exec(`
    CREATE TABLE topic_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      brief TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  await db.close();

  const initializedDb = await openDatabase(dbPath);
  await initializeDatabase(initializedDb);
  await initializedDb.close();

  const migratedDb = await openDatabase(dbPath);
  const columns = await migratedDb.all<Array<{ name: string }>>(
    "PRAGMA table_info(topic_suggestions)"
  );
  await migratedDb.close();

  assert.equal(columns.some((column) => column.name === "why_now"), true);
  assert.equal(columns.some((column) => column.name === "entry_point"), true);
  assert.equal(columns.some((column) => column.name === "reference_items_json"), true);
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

function createXiaohongshuResponse(keyword: string): XiaohongshuApiResponse {
  return {
    code: 0,
    data: {
      can_cut: false,
      dqa_authorized_user_by_shared: false,
      is_broad_query: false,
      items: [
        {
          hot_query: {
            queries: [],
            source: 0,
            title: "",
            word_request_id: ""
          },
          model_type: "note",
          note: {
            advanced_widgets_groups: { groups: [] },
            collected: false,
            collected_count: 20,
            comments_count: 15,
            corner_tag_info: [],
            cover_image_index: 0,
            debug_info_str: "",
            desc: `${keyword} 的小红书笔记详情`,
            extract_text_enabled: 0,
            geo_info: { distance: "" },
            has_music: false,
            id: "xhs-note-1",
            images_list: [
              {
                fileid: "xhs-img-1",
                height: 1200,
                need_load_original_image: false,
                original: "https://example.com/xhs-original.jpg",
                trace_id: "xhs-trace-1",
                url: "https://example.com/xhs-cover.jpg",
                url_size_large: "https://example.com/xhs-cover-large.jpg",
                width: 900
              }
            ],
            interaction_area: { status: false, text: "", type: 0 },
            last_update_time: 1711728600,
            liked: false,
            liked_count: 100,
            nice_count: 0,
            niced: false,
            note_attributes: ["种草"],
            result_from: "search_result",
            shared_count: 8,
            tag_info: { title: "购物", type: "topic" },
            timestamp: 1711728000,
            title: `${keyword} 的小红书笔记`,
            type: "normal",
            update_time: 1711728600,
            user: {
              followed: false,
              images: "https://example.com/xhs-avatar.jpg",
              nickname: "小红书研究员",
              red_id: "xhs-research",
              red_official_verified: false,
              red_official_verify_type: 0,
              show_red_official_verify_icon: false,
              track_duration: 0,
              userid: "xhs-user-1"
            },
            widgets_context: ""
          }
        }
      ],
      query_debug_info: { is_forbidden: false },
      query_intent: {
        goodsIntent: 0,
        low_supply_intent: false,
        search_ask_intent: false
      },
      query_type: 0,
      request_dqa_instant: false,
      search_dqa_new_page_exp: 0,
      search_pull_down_opt_exp: 0,
      service_status: "online",
      strategy_info: {
        query_average_impression_count: 0,
        query_can_guide_to_feed: false
      }
    }
  };
}

test("saveXiaohongshuSearchResult persists a keyword search and its linked notes", async () => {
  const dbPath = createTempDbPath();

  await initializeSearchHistoryDb(dbPath);
  const saved = await saveXiaohongshuSearchResult({
    dbPath,
    keyword: "大众",
    status: "success",
    response: createXiaohongshuResponse("大众")
  });

  const history = await getRecentSearchHistory(dbPath);
  const detail = await getSearchDetail(dbPath, saved.searchId);

  assert.equal(history.length, 1);
  assert.equal(history[0]?.keyword, "大众");
  assert.equal(history[0]?.sourceType, "xiaohongshu");
  assert.equal(history[0]?.articleCount, 1);

  assert.equal(detail?.search.sourceType, "xiaohongshu");
  assert.equal(detail?.days.length, 1);
  assert.equal(detail?.days[0]?.leadPlatform, "小红书");
  assert.equal(detail?.days[0]?.items[0]?.title, "大众 的小红书笔记");
  assert.equal(detail?.report.reportStatus, "pending");
});

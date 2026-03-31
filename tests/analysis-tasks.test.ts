import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { initializeSearchHistoryDb, saveWechatSearchResult } from "@/lib/search-history";
import { openDatabase } from "@/lib/db";
import {
  createAnalysisTask,
  getAnalysisTasksForSearch,
  saveCompletedAnalysisResult
} from "@/lib/analysis-tasks";
import type { WechatApiResponse } from "@/lib/wechat-monitor";

function createTempDbPath() {
  return path.join(
    fs.mkdtempSync(path.join(os.tmpdir(), "analysis-tasks-")),
    "monitor.db"
  );
}

function createWechatResponse(): WechatApiResponse {
  return {
    code: 0,
    msg: "ok",
    requestId: "analysis-req-1",
    data: {
      data: [
        {
          avatar: "https://example.com/avatar.png",
          classify: "出海",
          content: "这是文章摘要，适合做选题分析。",
          ghid: "gh_analysis",
          ip_wording: "北京",
          is_original: 1,
          looking: 15,
          praise: 21,
          publish_time: 1711728000,
          publish_time_str: "2026-03-31 10:00:00",
          read: 3300,
          short_link: "https://short/analysis",
          title: "网文出海进入新阶段",
          update_time: 1711731600,
          update_time_str: "2026-03-31 11:00:00",
          url: "https://example.com/original",
          wx_id: "wx-analysis",
          wx_name: "出海观察"
        }
      ],
      data_number: 1,
      page: 1,
      total: 1,
      total_page: 1
    }
  };
}

test("createAnalysisTask creates a task under an existing search history record", async () => {
  const dbPath = createTempDbPath();

  await initializeSearchHistoryDb(dbPath);
  const search = await saveWechatSearchResult({
    dbPath,
    keyword: "网文出海",
    status: "success",
    response: createWechatResponse()
  });

  const task = await createAnalysisTask({
    dbPath,
    searchId: search.searchId,
    sourceType: "wechat",
    selectedItems: [
      {
        contentItemId: `${createWechatResponse().data.data[0].ghid}-${createWechatResponse().data.data[0].publish_time}-${createWechatResponse().data.data[0].wx_id}`,
        contentTitle: "网文出海进入新阶段",
        originalUrl: "https://example.com/original"
      }
    ]
  });

  assert.equal(task.status, "running");

  const tasks = await getAnalysisTasksForSearch(dbPath, search.searchId);
  assert.equal(tasks.length, 1);
  assert.equal(tasks[0]?.selectedCount, 1);
});

test("saveCompletedAnalysisResult stores per-item summaries and at least five topic suggestions", async () => {
  const dbPath = createTempDbPath();

  await initializeSearchHistoryDb(dbPath);
  const search = await saveWechatSearchResult({
    dbPath,
    keyword: "网文出海",
    status: "success",
    response: createWechatResponse()
  });

  const task = await createAnalysisTask({
    dbPath,
    searchId: search.searchId,
    sourceType: "wechat",
    selectedItems: [
      {
        contentItemId: `${createWechatResponse().data.data[0].ghid}-${createWechatResponse().data.data[0].publish_time}-${createWechatResponse().data.data[0].wx_id}`,
        contentTitle: "网文出海进入新阶段",
        originalUrl: "https://example.com/original"
      }
    ]
  });

  await saveCompletedAnalysisResult({
    dbPath,
    taskId: task.id,
    itemSummaries: [
      {
        contentItemId: task.items[0].contentItemId,
        summary: "这篇文章强调网文出海进入品牌化与工业化阶段。",
        keywords: ["网文出海", "品牌化", "工业化"],
        keyPoints: ["强调品牌化", "强调产业链成熟"],
        highlights: ["标题具有趋势判断感"],
        angles: ["从产业视角切入"],
        risks: ["观点型内容容易同质化"]
      }
    ],
    report: {
      summary: "网文出海内容正在从个案成功转向阶段性趋势判断。",
      hotInsights: "高阅读内容更偏向趋势总结与行业升级。",
      suggestions: [
        {
          title: "网文出海进入品牌竞争阶段",
          brief: "从行业升级切入。",
          whyNow: "读者开始关注长期增长逻辑。",
          entryPoint: "案例 + 趋势判断",
          referenceItemIds: [task.items[0].contentItemId]
        },
        {
          title: "出海网文为什么开始强调工业化生产",
          brief: "聚焦供给侧。",
          whyNow: "平台与内容供应更稳定。",
          entryPoint: "内容工厂视角",
          referenceItemIds: [task.items[0].contentItemId]
        },
        {
          title: "高阅读出海内容的标题都在强调什么",
          brief: "总结标题模板。",
          whyNow: "标题竞争正在加剧。",
          entryPoint: "标题拆解",
          referenceItemIds: [task.items[0].contentItemId]
        },
        {
          title: "网文出海如何从爆文走向品牌栏目",
          brief: "从单篇到系列。",
          whyNow: "读者需要稳定认知。",
          entryPoint: "栏目化运营",
          referenceItemIds: [task.items[0].contentItemId]
        },
        {
          title: "内容团队如何跟踪网文出海长期选题",
          brief: "建立持续监控机制。",
          whyNow: "话题已进入长期观察期。",
          entryPoint: "监控方法论",
          referenceItemIds: [task.items[0].contentItemId]
        }
      ]
    }
  });

  const tasks = await getAnalysisTasksForSearch(dbPath, search.searchId);
  assert.equal(tasks[0]?.status, "completed");
  assert.equal(tasks[0]?.suggestions.length, 5);
  assert.equal(tasks[0]?.itemSummaries.length, 1);
});

test("analysis completion works against a legacy report schema after database initialization", async () => {
  const dbPath = createTempDbPath();
  const db = await openDatabase(dbPath);

  await db.exec(`
    CREATE TABLE keyword_searches (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      keyword TEXT NOT NULL,
      source_type TEXT NOT NULL,
      status TEXT NOT NULL,
      article_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE wechat_articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      article_uid TEXT NOT NULL,
      title TEXT NOT NULL,
      author_name TEXT NOT NULL,
      wx_id TEXT NOT NULL,
      publish_time INTEGER NOT NULL,
      publish_time_str TEXT NOT NULL,
      read_count INTEGER NOT NULL DEFAULT 0,
      like_count INTEGER NOT NULL DEFAULT 0,
      looking_count INTEGER NOT NULL DEFAULT 0,
      is_original INTEGER NOT NULL DEFAULT 0,
      classify TEXT NOT NULL DEFAULT '',
      ip_wording TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      avatar TEXT NOT NULL DEFAULT '',
      raw_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE topic_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      search_id INTEGER NOT NULL,
      report_status TEXT NOT NULL,
      summary TEXT NOT NULL DEFAULT '',
      hot_insights TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE topic_suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      brief TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  await db.close();

  const search = await saveWechatSearchResult({
    dbPath,
    keyword: "网文出海",
    status: "success",
    response: createWechatResponse()
  });

  const contentItemId = `${createWechatResponse().data.data[0].ghid}-${createWechatResponse().data.data[0].publish_time}-${createWechatResponse().data.data[0].wx_id}`;
  const task = await createAnalysisTask({
    dbPath,
    searchId: search.searchId,
    sourceType: "wechat",
    selectedItems: [
      {
        contentItemId,
        contentTitle: "网文出海进入新阶段",
        originalUrl: "https://example.com/original"
      }
    ]
  });

  await saveCompletedAnalysisResult({
    dbPath,
    taskId: task.id,
    itemSummaries: [
      {
        contentItemId,
        summary: "文章围绕网文出海的趋势升级。",
        keywords: ["网文出海"],
        keyPoints: ["产业升级"],
        highlights: ["趋势明确"],
        angles: ["行业观察"],
        risks: ["容易同质化"]
      }
    ],
    report: {
      summary: "内容从案例总结转向趋势判断。",
      hotInsights: "用户更关注中长期机会。",
      suggestions: [
        { title: "题1", brief: "简述1", whyNow: "原因1", entryPoint: "切口1", referenceItemIds: [contentItemId] },
        { title: "题2", brief: "简述2", whyNow: "原因2", entryPoint: "切口2", referenceItemIds: [contentItemId] },
        { title: "题3", brief: "简述3", whyNow: "原因3", entryPoint: "切口3", referenceItemIds: [contentItemId] },
        { title: "题4", brief: "简述4", whyNow: "原因4", entryPoint: "切口4", referenceItemIds: [contentItemId] },
        { title: "题5", brief: "简述5", whyNow: "原因5", entryPoint: "切口5", referenceItemIds: [contentItemId] }
      ]
    }
  });

  const tasks = await getAnalysisTasksForSearch(dbPath, search.searchId);
  assert.equal(tasks[0]?.status, "completed");
  assert.equal(tasks[0]?.suggestions.length, 5);
});

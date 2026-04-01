import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWechatArticlesRequest,
  mapWechatArticlesResponse,
  shouldUseWechatLiveSource,
  type WechatApiResponse,
  type WechatArticle
} from "@/lib/wechat-monitor";

test("buildWechatArticlesRequest uses the provided keyword as the default search payload", () => {
  const payload = buildWechatArticlesRequest("网文出海");

  assert.deepEqual(payload, {
    kw: "网文出海",
    sort_type: 1,
    mode: 1,
    period: 7,
    page: 1,
    any_kw: "",
    ex_kw: "",
    verifycode: "",
    type: 1
  });
});

test("mapWechatArticlesResponse groups articles by publish date and maps article fields", () => {
  const response: WechatApiResponse = {
    code: 0,
    msg: "ok",
    requestId: "req-1",
    data: {
      data: [
        {
          avatar: "https://example.com/avatar-a.png",
          classify: "出海",
          content: "文章摘要 A",
          ghid: "gh_1",
          ip_wording: "广东",
          is_original: 1,
          looking: 250,
          praise: 33,
          publish_time: 1711728000,
          publish_time_str: "2026-03-30 08:30:00",
          read: 4200,
          short_link: "https://short/a",
          title: "网文出海还能做哪些细分赛道",
          update_time: 1711731600,
          update_time_str: "2026-03-30 09:30:00",
          url: "https://example.com/a",
          wx_id: "wx_1",
          wx_name: "出海观察局"
        },
        {
          avatar: "https://example.com/avatar-b.png",
          classify: "趋势",
          content: "文章摘要 B",
          ghid: "gh_2",
          ip_wording: "上海",
          is_original: 0,
          looking: 180,
          praise: 18,
          publish_time: 1711641600,
          publish_time_str: "2026-03-29 07:30:00",
          read: 2100,
          short_link: "https://short/b",
          title: "网文出海内容为什么开始强调商业化",
          update_time: 1711645200,
          update_time_str: "2026-03-29 08:30:00",
          url: "https://example.com/b",
          wx_id: "wx_2",
          wx_name: "内容增长周刊"
        }
      ],
      data_number: 2,
      page: 1,
      total: 2,
      total_page: 1
    }
  };

  const mapped = mapWechatArticlesResponse(response);

  assert.equal(mapped.total, 2);
  assert.equal(mapped.days.length, 2);
  assert.equal(mapped.days[0]?.date, "2026-03-30");
  assert.equal(mapped.days[0]?.totalItems, 1);
  assert.equal(mapped.days[0]?.leadPlatform, "公众号");
  assert.equal(mapped.days[0]?.items[0]?.author, "出海观察局");
  assert.equal(mapped.days[0]?.items[0]?.heat, 4200);
  assert.equal(mapped.days[0]?.items[0]?.publishTime, "08:30");
  assert.deepEqual(mapped.days[0]?.items[0]?.tags, ["公众号", "原创", "出海", "广东"]);
});

test("mapWechatArticlesResponse tolerates missing optional fields when building content cards", () => {
  const response: WechatApiResponse = {
    code: 0,
    msg: "ok",
    requestId: "req-2",
    data: {
      data: [
        {
          avatar: "",
          classify: "",
          content: "",
          ghid: "gh_3",
          ip_wording: "",
          is_original: 0,
          looking: 0,
          praise: 0,
          publish_time: 1711728000,
          publish_time_str: "2026-03-30 10:00:00",
          read: 0,
          short_link: "",
          title: "只有标题的文章",
          update_time: 1711728600,
          update_time_str: "2026-03-30 10:10:00",
          url: "",
          wx_id: "wx_3",
          wx_name: "简报号"
        }
      ],
      data_number: 1,
      page: 1,
      total: 1,
      total_page: 1
    }
  };

  const mapped = mapWechatArticlesResponse(response);
  const article = mapped.days[0]?.items[0] as WechatArticle;

  assert.equal(article.summary, "暂无摘要，点击文章原链接查看完整内容。");
  assert.deepEqual(article.tags, ["公众号"]);
  assert.equal(article.url, "");
});

test("shouldUseWechatLiveSource only enables the live keyword search for the wechat monitor category", () => {
  assert.equal(shouldUseWechatLiveSource("wechat-monitor"), true);
  assert.equal(shouldUseWechatLiveSource("vibecoding"), false);
});

import test from "node:test";
import assert from "node:assert/strict";

import {
  buildXiaohongshuNotesRequest,
  mapXiaohongshuNotesResponse,
  type XiaohongshuApiResponse
} from "@/lib/xiaohongshu-monitor";

test("buildXiaohongshuNotesRequest uses the provided keyword as the default search payload", () => {
  const payload = buildXiaohongshuNotesRequest("大众");

  assert.deepEqual(payload, {
    type: 9,
    keyword: "大众",
    page: "1",
    sort: "comment_descending",
    note_type: "note",
    note_time: "day",
    searchId: "",
    sessionId: ""
  });
});

test("mapXiaohongshuNotesResponse groups notes by publish date and computes note heat", () => {
  const response: XiaohongshuApiResponse = {
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
            collected_count: 90,
            comments_count: 60,
            corner_tag_info: [],
            cover_image_index: 0,
            debug_info_str: "",
            desc: "这是一篇关于汽车品牌大众的深度笔记。",
            extract_text_enabled: 0,
            geo_info: { distance: "" },
            has_music: false,
            id: "note-1",
            images_list: [
              {
                fileid: "img-1",
                height: 1200,
                need_load_original_image: false,
                original: "https://example.com/original.jpg",
                trace_id: "trace-1",
                url: "https://example.com/cover.jpg",
                url_size_large: "https://example.com/cover-large.jpg",
                width: 900
              }
            ],
            interaction_area: { status: false, text: "", type: 0 },
            last_update_time: 1711780000,
            liked: false,
            liked_count: 120,
            nice_count: 0,
            niced: false,
            note_attributes: ["汽车", "测评"],
            result_from: "search_result",
            shared_count: 15,
            tag_info: { title: "汽车", type: "topic" },
            timestamp: 1711770000,
            title: "大众汽车最近值不值得买",
            type: "normal",
            update_time: 1711780000,
            user: {
              followed: false,
              images: "https://example.com/avatar.jpg",
              nickname: "汽车研究所",
              red_id: "auto-lab",
              red_official_verified: false,
              red_official_verify_type: 0,
              show_red_official_verify_icon: false,
              track_duration: 0,
              userid: "user-1"
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

  const mapped = mapXiaohongshuNotesResponse(response);

  assert.equal(mapped.total, 1);
  assert.equal(mapped.days.length, 1);
  assert.equal(mapped.days[0]?.leadPlatform, "小红书");
  assert.equal(mapped.days[0]?.items[0]?.author, "汽车研究所");
  assert.equal(mapped.days[0]?.items[0]?.heat, 270);
  assert.deepEqual(mapped.days[0]?.items[0]?.tags, ["小红书", "汽车", "汽车", "测评"]);
});

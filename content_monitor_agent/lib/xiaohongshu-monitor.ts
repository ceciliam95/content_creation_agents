import type { ContentDay, ContentItem } from "@/components/mock-data";

export type XiaohongshuRequest = {
  type: number;
  keyword: string;
  page: string;
  sort: string;
  note_type: string;
  note_time: string;
  searchId: string;
  sessionId: string;
};

export type XiaohongshuApiResponse = {
  code: number;
  data: {
    can_cut: boolean;
    dqa_authorized_user_by_shared: boolean;
    is_broad_query: boolean;
    items: XiaohongshuItem[];
    query_debug_info: {
      is_forbidden: boolean;
    };
    query_intent: {
      goodsIntent: number;
      low_supply_intent: boolean;
      search_ask_intent: boolean;
    };
    query_type: number;
    request_dqa_instant: boolean;
    search_dqa_new_page_exp: number;
    search_pull_down_opt_exp: number;
    service_status: string;
    strategy_info: {
      query_average_impression_count: number;
      query_can_guide_to_feed: boolean;
    };
  };
};

export type XiaohongshuItem = {
  hot_query: {
    queries: Array<{
      cover: string;
      id: string;
      name: string;
      search_word: string;
    }>;
    source: number;
    title: string;
    word_request_id: string;
  };
  model_type: string;
  note: XiaohongshuNote;
};

export type XiaohongshuNote = {
  abstract_show?: string;
  advanced_widgets_groups: {
    groups: Array<{
      fetch_types: string[];
      mode: number;
    }>;
  };
  collected: boolean;
  collected_count: number;
  comments_count: number;
  corner_tag_info: Array<{
    icon: string;
    location: number;
    poi_id: string;
    style: number;
    text: string;
    text_en: string;
    type: string;
  }>;
  cover_image_index: number;
  debug_info_str: string;
  desc: string;
  extract_text_enabled: number;
  geo_info: {
    distance: string;
  };
  has_music: boolean;
  id: string;
  images_list: Array<{
    fileid: string;
    height: number;
    need_load_original_image: boolean;
    original: string;
    trace_id: string;
    url: string;
    url_size_large: string;
    width: number;
  }>;
  interaction_area: {
    status: boolean;
    text: string;
    type: number;
  };
  last_update_time: number;
  liked: boolean;
  liked_count: number;
  nice_count: number;
  niced: boolean;
  note_attributes: string[];
  result_from: string;
  shared_count: number;
  tag_info: {
    title: string;
    type: string;
  };
  timestamp: number;
  title: string;
  type: string;
  update_time: number;
  user: {
    followed: boolean;
    images: string;
    nickname: string;
    red_id: string;
    red_official_verified: boolean;
    red_official_verify_type: number;
    show_red_official_verify_icon: boolean;
    track_duration: number;
    userid: string;
  };
  widgets_context: string;
};

export type XiaohongshuNoteItem = ContentItem & {
  sourceType: "xiaohongshu";
  avatar: string;
  likedCount: number;
  commentsCount: number;
  collectedCount: number;
  sharedCount: number;
  coverUrl: string;
  authorId: string;
};

export type XiaohongshuNotesResult = {
  total: number;
  days: ContentDay[];
};

export function buildXiaohongshuNotesRequest(
  keyword: string,
  overrides: Partial<XiaohongshuRequest> = {}
): XiaohongshuRequest {
  return {
    type: 9,
    keyword,
    page: "1",
    sort: "comment_descending",
    note_type: "note",
    note_time: "day",
    searchId: "",
    sessionId: "",
    ...overrides
  };
}

function formatUnixTimestamp(timestamp: number) {
  return new Date(timestamp * 1000).toISOString();
}

function formatTime(timestamp: number) {
  return formatUnixTimestamp(timestamp).slice(11, 16);
}

function buildSummary(note: XiaohongshuNote) {
  const source = note.abstract_show?.trim() || note.desc.trim();

  if (!source) {
    return "暂无笔记摘要，可在后续详情页补充原始笔记内容。";
  }

  return source.length > 120 ? `${source.slice(0, 120)}...` : source;
}

function buildTags(note: XiaohongshuNote) {
  return [
    "小红书",
    ...(note.tag_info.title ? [note.tag_info.title] : []),
    ...note.note_attributes
  ];
}

export function mapXiaohongshuNoteToContentItem(
  note: XiaohongshuNote
): XiaohongshuNoteItem {
  return {
    id: note.id,
    title: note.title || "未命名笔记",
    platform: "小红书",
    author: note.user.nickname,
    publishTime: formatTime(note.timestamp),
    heat: note.liked_count + note.comments_count + note.collected_count,
    tags: buildTags(note),
    summary: buildSummary(note),
    sourceType: "xiaohongshu",
    avatar: note.user.images,
    likedCount: note.liked_count,
    commentsCount: note.comments_count,
    collectedCount: note.collected_count,
    sharedCount: note.shared_count,
    coverUrl: note.images_list[0]?.url || "",
    authorId: note.user.userid
  };
}

export function mapXiaohongshuNotesResponse(
  response: XiaohongshuApiResponse
): XiaohongshuNotesResult {
  const grouped = new Map<string, XiaohongshuNoteItem[]>();

  for (const item of response.data.items) {
    const mapped = mapXiaohongshuNoteToContentItem(item.note);
    const date = formatUnixTimestamp(item.note.timestamp).slice(0, 10);
    const existing = grouped.get(date) ?? [];
    existing.push(mapped);
    grouped.set(date, existing);
  }

  const days = Array.from(grouped.entries())
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([date, items]) => ({
      date,
      totalItems: items.length,
      breakoutCount: items.filter((item) => item.heat >= 200).length,
      leadPlatform: "小红书" as const,
      items: items.sort((left, right) => right.heat - left.heat)
    }));

  return {
    total: response.data.items.length,
    days
  };
}

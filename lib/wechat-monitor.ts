import type { ContentDay, ContentItem } from "@/components/mock-data";

export type WechatApiArticle = {
  avatar: string;
  classify: string;
  content: string;
  ghid: string;
  ip_wording: string;
  is_original: number;
  looking: number;
  praise: number;
  publish_time: number;
  publish_time_str: string;
  read: number;
  short_link: string;
  title: string;
  update_time: number;
  update_time_str: string;
  url: string;
  wx_id: string;
  wx_name: string;
};

export type WechatApiResponse = {
  code: number;
  data: {
    data: WechatApiArticle[];
    data_number: number;
    page: number;
    total: number;
    total_page: number;
  };
  msg: string;
  requestId: string;
};

export type WechatArticlesRequest = {
  kw: string;
  sort_type: number;
  mode: number;
  period: number;
  page: number;
  any_kw: string;
  ex_kw: string;
  verifycode: string;
  type: number;
};

export type WechatArticle = ContentItem & {
  avatar: string;
  url: string;
  reads: number;
  likes: number;
  looking: number;
  isOriginal: boolean;
  accountId: string;
};

export type WechatArticlesResult = {
  total: number;
  page: number;
  totalPages: number;
  days: ContentDay[];
};

export function buildWechatArticlesRequest(
  keyword: string,
  overrides: Partial<WechatArticlesRequest> = {}
): WechatArticlesRequest {
  return {
    kw: keyword,
    sort_type: 1,
    mode: 1,
    period: 7,
    page: 1,
    any_kw: "",
    ex_kw: "",
    verifycode: "",
    type: 1,
    ...overrides
  };
}

export function shouldUseWechatLiveSource(categoryId: string) {
  return categoryId === "wechat-monitor";
}

function formatDateLabel(input: string) {
  return input.slice(0, 10);
}

function formatTimeLabel(input: string) {
  return input.slice(11, 16);
}

function createArticleTags(article: WechatApiArticle) {
  const tags = ["公众号"];

  if (article.is_original) {
    tags.push("原创");
  }

  if (article.classify) {
    tags.push(article.classify);
  }

  if (article.ip_wording) {
    tags.push(article.ip_wording);
  }

  return tags;
}

function createArticleSummary(article: WechatApiArticle) {
  const raw = article.content.trim();

  if (!raw) {
    return "暂无摘要，点击文章原链接查看完整内容。";
  }

  return raw.length > 120 ? `${raw.slice(0, 120)}...` : raw;
}

export function mapWechatArticleToContentItem(
  article: WechatApiArticle
): WechatArticle {
  return {
    id: `${article.ghid}-${article.publish_time}-${article.wx_id}`,
    title: article.title,
    platform: "公众号",
    author: article.wx_name,
    publishTime: formatTimeLabel(article.publish_time_str),
    heat: article.read,
    tags: createArticleTags(article),
    summary: createArticleSummary(article),
    avatar: article.avatar,
    url: article.url,
    reads: article.read,
    likes: article.praise,
    looking: article.looking,
    isOriginal: article.is_original === 1,
    accountId: article.wx_id
  };
}

export function mapWechatArticlesResponse(
  response: WechatApiResponse
): WechatArticlesResult {
  const grouped = new Map<string, WechatArticle[]>();

  for (const article of response.data.data) {
    const date = formatDateLabel(article.publish_time_str);
    const mapped = mapWechatArticleToContentItem(article);
    const existing = grouped.get(date) ?? [];
    existing.push(mapped);
    grouped.set(date, existing);
  }

  const days = Array.from(grouped.entries())
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([date, items]) => ({
      date,
      totalItems: items.length,
      breakoutCount: items.filter((item) => item.heat >= 3000).length,
      leadPlatform: "公众号" as const,
      items: items.sort((left, right) => right.heat - left.heat)
    }));

  return {
    total: response.data.total,
    page: response.data.page,
    totalPages: response.data.total_page,
    days
  };
}

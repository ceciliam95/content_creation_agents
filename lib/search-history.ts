import type { ContentDay } from "@/components/mock-data";
import { getInitializedDatabase } from "@/lib/db";
import {
  mapWechatArticleToContentItem,
  mapWechatArticlesResponse,
  type WechatApiResponse
} from "@/lib/wechat-monitor";

type SaveWechatSearchResultInput = {
  dbPath?: string;
  keyword: string;
  status: "success" | "failed";
  response: WechatApiResponse;
};

type SearchHistoryRow = {
  id: number;
  keyword: string;
  source_type: string;
  status: string;
  article_count: number;
  created_at: string;
  updated_at: string;
};

type WechatArticleRow = {
  id: number;
  search_id: number;
  title: string;
  author_name: string;
  wx_id: string;
  publish_time_str: string;
  read_count: number;
  summary: string;
  url: string;
  avatar: string;
  is_original: number;
  classify: string;
  ip_wording: string;
};

type TopicReportRow = {
  id: number;
  search_id: number;
  report_status: string;
  summary: string;
  hot_insights: string;
  created_at: string;
  updated_at: string;
};

export async function initializeSearchHistoryDb(dbPath?: string) {
  const db = await getInitializedDatabase(dbPath);
  await db.close();
}

export async function saveWechatSearchResult({
  dbPath,
  keyword,
  status,
  response
}: SaveWechatSearchResultInput) {
  const db = await getInitializedDatabase(dbPath);
  const now = new Date().toISOString();
  const mapped = mapWechatArticlesResponse(response);

  try {
    await db.exec("BEGIN");

    const search = await db.run(
      `
        INSERT INTO keyword_searches (
          keyword,
          source_type,
          status,
          article_count,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [keyword, "wechat", status, mapped.total, now, now]
    );

    const searchId = Number(search.lastID);

    for (const article of response.data.data) {
      const mappedArticle = mapWechatArticleToContentItem(article);

      await db.run(
        `
          INSERT INTO wechat_articles (
            search_id,
            article_uid,
            title,
            author_name,
            wx_id,
            publish_time,
            publish_time_str,
            read_count,
            like_count,
            looking_count,
            is_original,
            classify,
            ip_wording,
            summary,
            url,
            avatar,
            raw_json,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          searchId,
          `${article.ghid}-${article.publish_time}-${article.wx_id}`,
          article.title,
          article.wx_name,
          article.wx_id,
          article.publish_time,
          article.publish_time_str,
          article.read,
          article.praise,
          article.looking,
          article.is_original,
          article.classify,
          article.ip_wording,
          mappedArticle.summary,
          article.url,
          article.avatar,
          JSON.stringify(article),
          now
        ]
      );
    }

    await db.run(
      `
        INSERT INTO topic_reports (
          search_id,
          report_status,
          summary,
          hot_insights,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `,
      [searchId, "pending", "", "", now, now]
    );

    await db.exec("COMMIT");

    return {
      searchId,
      ...mapped
    };
  } catch (error) {
    await db.exec("ROLLBACK");
    throw error;
  } finally {
    await db.close();
  }
}

export async function getRecentSearchHistory(dbPath?: string) {
  const db = await getInitializedDatabase(dbPath);

  try {
    const rows = await db.all<
      (SearchHistoryRow & { report_status: string })[]
    >(
      `
        SELECT
          s.id,
          s.keyword,
          s.source_type,
          s.status,
          s.article_count,
          s.created_at,
          s.updated_at,
          COALESCE(r.report_status, 'pending') AS report_status
        FROM keyword_searches s
        LEFT JOIN topic_reports r ON r.search_id = s.id
        ORDER BY s.id DESC
        LIMIT 20
      `
    );

    return rows.map((row) => ({
      id: row.id,
      keyword: row.keyword,
      sourceType: row.source_type,
      status: row.status,
      articleCount: row.article_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      reportStatus: row.report_status
    }));
  } finally {
    await db.close();
  }
}

function mapRowsToContentDays(rows: WechatArticleRow[]): ContentDay[] {
  const grouped = new Map<string, ReturnType<typeof mapWechatArticleToContentItem>[]>();

  for (const row of rows) {
    const date = row.publish_time_str.slice(0, 10);
    const current = grouped.get(date) ?? [];

    current.push({
      id: `${row.search_id}-${row.id}`,
      title: row.title,
      platform: "公众号",
      author: row.author_name,
      publishTime: row.publish_time_str.slice(11, 16),
      heat: row.read_count,
      tags: [
        "公众号",
        ...(row.is_original ? ["原创"] : []),
        ...(row.classify ? [row.classify] : []),
        ...(row.ip_wording ? [row.ip_wording] : [])
      ],
      summary: row.summary || "暂无摘要，点击文章原链接查看完整内容。",
      avatar: row.avatar,
      url: row.url,
      reads: row.read_count,
      likes: 0,
      looking: 0,
      isOriginal: row.is_original === 1,
      accountId: row.wx_id
    });

    grouped.set(date, current);
  }

  return Array.from(grouped.entries())
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map(([date, items]) => ({
      date,
      totalItems: items.length,
      breakoutCount: items.filter((item) => item.heat >= 3000).length,
      leadPlatform: "公众号" as const,
      items: items.sort((left, right) => right.heat - left.heat)
    }));
}

export async function getSearchDetail(dbPath: string | undefined, searchId: number) {
  const db = await getInitializedDatabase(dbPath);

  try {
    const search = await db.get<SearchHistoryRow>(
      `
        SELECT *
        FROM keyword_searches
        WHERE id = ?
      `,
      [searchId]
    );

    if (!search) {
      return null;
    }

    const articles = await db.all<WechatArticleRow[]>(
      `
        SELECT *
        FROM wechat_articles
        WHERE search_id = ?
        ORDER BY publish_time DESC, read_count DESC
      `,
      [searchId]
    );

    const report = await db.get<TopicReportRow>(
      `
        SELECT *
        FROM topic_reports
        WHERE search_id = ?
        ORDER BY id DESC
        LIMIT 1
      `,
      [searchId]
    );

    return {
      search: {
        id: search.id,
        keyword: search.keyword,
        sourceType: search.source_type,
        status: search.status,
        articleCount: search.article_count,
        createdAt: search.created_at,
        updatedAt: search.updated_at
      },
      days: mapRowsToContentDays(articles),
      report: {
        reportStatus: report?.report_status ?? "pending",
        summary: report?.summary ?? "",
        hotInsights: report?.hot_insights ?? ""
      }
    };
  } finally {
    await db.close();
  }
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ContentTab } from "@/components/content-tab";
import {
  type ContentDay,
  type DashboardTab,
  type MonitoringCategory,
  type Platform,
  getCategories,
  getDefaultCategory,
  getDefaultContentDate,
  getDefaultPlatform,
  getDefaultReportDate
} from "@/components/mock-data";
import { ReportsTab } from "@/components/reports-tab";
import { SettingsTab } from "@/components/settings-tab";

const tabs: DashboardTab[] = ["内容", "选题分析与报告", "监控设置"];

type SourceType = "wechat" | "xiaohongshu";
type SearchTarget = SourceType | "all";

type SearchHistoryItem = {
  id: number;
  keyword: string;
  sourceType: SourceType;
  status: string;
  articleCount: number;
  createdAt: string;
  updatedAt: string;
  reportStatus: string;
};

type SearchHistoryDetail = {
  search: {
    id: number;
    keyword: string;
    sourceType: SourceType;
    status: string;
    articleCount: number;
    createdAt: string;
    updatedAt: string;
  };
  days: ContentDay[];
  report: {
    reportStatus: string;
    summary: string;
    hotInsights: string;
  };
};

type SearchApiResponse = {
  searchId: number;
  keyword: string;
  sourceType: SourceType;
  total?: number;
  days: ContentDay[];
};

function formatHistoryTime(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function sourceLabel(sourceType: SourceType) {
  return sourceType === "wechat" ? "微信" : "小红书";
}

function categorySource(categoryId: string): SourceType | null {
  if (categoryId === "wechat-monitor") {
    return "wechat";
  }

  if (categoryId === "xiaohongshu-monitor") {
    return "xiaohongshu";
  }

  return null;
}

export function Dashboard() {
  const categories = getCategories();
  const [activeCategoryId, setActiveCategoryId] = useState(getDefaultCategory().id);
  const [globalKeyword, setGlobalKeyword] = useState("网文出海");
  const [keywordInput, setKeywordInput] = useState("网文出海");
  const [searchTarget, setSearchTarget] = useState<SearchTarget>("all");

  const [activeTab, setActiveTab] = useState<DashboardTab>("内容");
  const [activePlatform, setActivePlatform] = useState<Platform>(
    getDefaultPlatform(getDefaultCategory())
  );
  const [activeContentDate, setActiveContentDate] = useState(
    getDefaultContentDate(getDefaultCategory())
  );
  const [activeReportDate, setActiveReportDate] = useState(
    getDefaultReportDate(getDefaultCategory())
  );
  const [reportMode, setReportMode] = useState<"日报" | "最近 7 天汇总">("日报");

  const [historyItems, setHistoryItems] = useState<SearchHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [activeSearchId, setActiveSearchId] = useState<number | null>(null);
  const [activeSearchDetail, setActiveSearchDetail] = useState<SearchHistoryDetail | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const activeCategoryBase =
    categories.find((category) => category.id === activeCategoryId) ?? getDefaultCategory();
  const activeCategoryType = categorySource(activeCategoryBase.id);

  const activeCategory = useMemo(() => {
    if (activeCategoryType && activeCategoryBase.liveSource) {
      return {
        ...activeCategoryBase,
        keywordCount: 1,
        summary: `当前通过顶部全局关键词搜索采集${sourceLabel(
          activeCategoryType
        )}内容，最近关键词为“${globalKeyword}”，结果会保存到 SQLite。`,
        settings: {
          ...activeCategoryBase.settings,
          keywords: [globalKeyword],
          schedule: {
            ...activeCategoryBase.settings.schedule,
            scope: `全局关键词搜索可以触发${sourceLabel(
              activeCategoryType
            )}采集，并将结果按来源分别保存到 SQLite`
          }
        },
        liveSource: {
          ...activeCategoryBase.liveSource,
          type: activeCategoryType,
          keyword: globalKeyword
        }
      };
    }

    return activeCategoryBase;
  }, [activeCategoryBase, activeCategoryType, globalKeyword]);

  const loadSearchDetail = useCallback(async (searchId: number) => {
    setSearchLoading(true);
    setSearchError(null);

    try {
      const response = await fetch(`/api/search-history?id=${searchId}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(error?.message ?? "历史查询详情加载失败。");
      }

      const payload = (await response.json()) as SearchHistoryDetail;
      setActiveSearchId(searchId);
      setActiveSearchDetail(payload);
      setGlobalKeyword(payload.search.keyword);
      setKeywordInput(payload.search.keyword);
      setActiveContentDate(payload.days[0]?.date ?? "");
      setActiveCategoryId(
        payload.search.sourceType === "wechat"
          ? "wechat-monitor"
          : "xiaohongshu-monitor"
      );
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "历史查询详情加载失败。");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const pickLatestHistoryId = useCallback(
    (items: SearchHistoryItem[], preferredSource: SourceType | null) => {
      if (!preferredSource) {
        return items[0]?.id ?? null;
      }

      const match = items.find((item) => item.sourceType === preferredSource);
      return match?.id ?? null;
    },
    []
  );

  const loadSearchHistory = useCallback(
    async (selectedId?: number | null, preferredSource?: SourceType | null) => {
      setHistoryLoading(true);
      setHistoryError(null);

      try {
        const response = await fetch("/api/search-history", { cache: "no-store" });

        if (!response.ok) {
          const error = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(error?.message ?? "历史关键词加载失败。");
        }

        const payload = (await response.json()) as { history: SearchHistoryItem[] };
        setHistoryItems(payload.history);

        const nextId =
          selectedId ?? pickLatestHistoryId(payload.history, preferredSource ?? activeCategoryType);

        if (nextId) {
          await loadSearchDetail(nextId);
        }
      } catch (error) {
        setHistoryError(error instanceof Error ? error.message : "历史关键词加载失败。");
      } finally {
        setHistoryLoading(false);
      }
    },
    [activeCategoryType, loadSearchDetail, pickLatestHistoryId]
  );

  useEffect(() => {
    setActivePlatform(getDefaultPlatform(activeCategoryBase));
    setActiveContentDate(getDefaultContentDate(activeCategoryBase));
    setActiveReportDate(getDefaultReportDate(activeCategoryBase));
    setReportMode("日报");
    setActiveTab("内容");
  }, [activeCategoryBase, activeCategoryId]);

  useEffect(() => {
    if (activeCategoryType) {
      void loadSearchHistory(activeSearchId, activeCategoryType);
    }
  }, [activeCategoryType, activeSearchId, loadSearchHistory]);

  const currentContentDays =
    activeCategoryType && activeSearchDetail?.search.sourceType === activeCategoryType
      ? activeSearchDetail.days
      : activeCategory.contentDays;

  const currentCategoryContentDate =
    currentContentDays.find((day) => day.date === activeContentDate)?.date ??
    currentContentDays[0]?.date ??
    "";

  const currentPlatforms =
    currentContentDays.length > 0
      ? Array.from(
          new Set(currentContentDays.flatMap((day) => day.items.map((item) => item.platform)))
        )
      : activeCategory.settings.platforms.map((platform) => platform.name);

  const metricsContentDay = currentContentDays[0];
  const currentHistoryMeta = historyItems.find((item) => item.id === activeSearchId) ?? null;

  async function runSourceSearch(source: SourceType, keyword: string) {
    const route =
      source === "wechat" ? "/api/wechat-articles" : "/api/xiaohongshu-notes";
    const params = new URLSearchParams({ kw: keyword });
    const response = await fetch(`${route}?${params.toString()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      const error = (await response.json().catch(() => null)) as { message?: string } | null;
      throw new Error(error?.message ?? `${sourceLabel(source)}采集失败。`);
    }

    return (await response.json()) as SearchApiResponse;
  }

  async function handleKeywordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextKeyword = keywordInput.trim();

    if (!nextKeyword) {
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const targets =
        searchTarget === "all" ? (["wechat", "xiaohongshu"] as const) : [searchTarget];
      const results = await Promise.all(targets.map((source) => runSourceSearch(source, nextKeyword)));
      setGlobalKeyword(nextKeyword);

      let preferredSource = activeCategoryType;

      if (!preferredSource) {
        preferredSource = results[0]?.sourceType ?? "wechat";
      } else if (searchTarget !== "all") {
        preferredSource = searchTarget;
      }

      const preferredResult =
        results.find((result) => result.sourceType === preferredSource) ?? results[0];

      await loadSearchHistory(preferredResult?.searchId ?? null, preferredSource);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "关键词采集失败。");
    } finally {
      setSearchLoading(false);
    }
  }

  return (
    <div className="page-shell">
      <div className="dashboard-shell">
        <aside className="panel sidebar">
          <div className="sidebar-header">
            <p className="eyebrow">Monitor Matrix</p>
            <h1>内容监控台</h1>
            <p className="sidebar-copy">
              顶部关键词搜索可以同时驱动微信和小红书采集，并将结果按来源分别保存到
              SQLite。
            </p>
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                className={`category-card ${
                  category.id === activeCategoryId ? "active" : ""
                }`}
                onClick={() => setActiveCategoryId(category.id)}
              >
                <div className="category-card-top">
                  <span className="category-card-title">{category.name}</span>
                  <span className="status-pill">{category.runStatus}</span>
                </div>
                <p className="category-summary">
                  {category.liveSource
                    ? `当前最近关键词为“${globalKeyword}”，支持独立回看${category.name}历史。`
                    : category.summary}
                </p>
                <div className="stat-row">
                  <span>{category.platformCount} 个平台</span>
                  <span>{category.keywordCount} 个关键词</span>
                  <span>{category.creatorCount} 个博主</span>
                </div>
                <p className="helper-text">
                  {category.liveSource && currentHistoryMeta
                    ? `当前历史：${formatHistoryTime(currentHistoryMeta.createdAt)}`
                    : `最近运行：${category.lastRun}`}
                </p>
              </button>
            ))}
          </div>

          <section className="history-panel">
            <div className="split-header">
              <div>
                <h4>历史关键词</h4>
                <p className="section-copy">同一关键词会按微信和小红书拆成两条历史记录。</p>
              </div>
              <span className="small-pill">{historyItems.length} 条</span>
            </div>

            {historyLoading ? (
              <div className="history-empty">正在加载历史记录...</div>
            ) : historyError ? (
              <div className="history-empty">{historyError}</div>
            ) : historyItems.length === 0 ? (
              <div className="history-empty">还没有历史关键词，先从顶部搜索一次。</div>
            ) : (
              <div className="history-list">
                {historyItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`history-card ${item.id === activeSearchId ? "active" : ""}`}
                    onClick={() => void loadSearchDetail(item.id)}
                  >
                    <div className="history-card-top">
                      <strong>{item.keyword}</strong>
                      <span className="small-pill">{sourceLabel(item.sourceType)}</span>
                    </div>
                    <div className="history-meta">
                      <span>{formatHistoryTime(item.createdAt)}</span>
                      <span>{item.articleCount} 条内容</span>
                    </div>
                    <p className="helper-text">选题状态：{item.reportStatus}</p>
                  </button>
                ))}
              </div>
            )}
          </section>
        </aside>

        <main className="panel main-panel">
          <section className="hero">
            <div className="hero-grid">
              <div>
                <p className="eyebrow">当前分类</p>
                <h2>{activeCategory.name}</h2>
                <p className="hero-copy">{activeCategory.summary}</p>

                <div className="hero-stats">
                  <div className="hero-stat">
                    <span className="metric-label">监控平台</span>
                    <span className="hero-stat-value">{activeCategory.platformCount}</span>
                  </div>
                  <div className="hero-stat">
                    <span className="metric-label">最近关键词</span>
                    <span className="hero-stat-value">{globalKeyword}</span>
                  </div>
                  <div className="hero-stat">
                    <span className="metric-label">历史记录</span>
                    <span className="hero-stat-value">{historyItems.length}</span>
                  </div>
                </div>
              </div>

              <div className="hero-side">
                <div className="hero-note">
                  <strong>当前搜索目标</strong>
                  <p>
                    {searchTarget === "all"
                      ? "全选"
                      : searchTarget === "wechat"
                        ? "微信"
                        : "小红书"}
                  </p>
                </div>
                <div className="hero-note">
                  <strong>当前历史来源</strong>
                  <p>{currentHistoryMeta ? sourceLabel(currentHistoryMeta.sourceType) : "未选择"}</p>
                </div>
                <div className="hero-note">
                  <strong>当前状态</strong>
                  <p>
                    {currentHistoryMeta
                      ? `${currentHistoryMeta.articleCount} 条内容，${currentHistoryMeta.reportStatus}`
                      : activeCategory.runStatus}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="metrics-row">
            <article className="metric-card">
              <span className="metric-label">最近采集内容</span>
              <span className="metric-value">{metricsContentDay?.totalItems ?? 0} 条</span>
            </article>
            <article className="metric-card">
              <span className="metric-label">最近爆款内容</span>
              <span className="metric-value">{metricsContentDay?.breakoutCount ?? 0} 条</span>
            </article>
            <article className="metric-card">
              <span className="metric-label">当前来源平台</span>
              <span className="metric-value">
                {currentHistoryMeta ? sourceLabel(currentHistoryMeta.sourceType) : "-"}
              </span>
            </article>
            <article className="metric-card">
              <span className="metric-label">默认运行时区</span>
              <span className="metric-value">{activeCategory.settings.schedule.timezone}</span>
            </article>
          </section>

          <div className="tabs">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tab-trigger ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          <section className="keyword-toolbar">
            <div className="keyword-toolbar-copy">
              <strong>关键词搜索</strong>
              <p className="section-copy">
                回车后可按平台选择触发微信、小红书或双平台采集，并分别写入历史记录。
              </p>
            </div>
            <form className="keyword-search-form" onSubmit={handleKeywordSubmit}>
              <input
                className="keyword-search-input"
                type="text"
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="输入关键词后按回车，例如：网文出海"
              />
              <select
                className="keyword-search-select"
                value={searchTarget}
                onChange={(event) => setSearchTarget(event.target.value as SearchTarget)}
              >
                <option value="all">全选</option>
                <option value="wechat">微信</option>
                <option value="xiaohongshu">小红书</option>
              </select>
              <button className="keyword-search-button" type="submit" disabled={searchLoading}>
                {searchLoading ? "搜索中..." : "搜索"}
              </button>
            </form>
          </section>

          {activeTab === "内容" && (
            <ContentTab
              platforms={currentPlatforms}
              selectedPlatform={activePlatform}
              onPlatformChange={setActivePlatform}
              days={currentContentDays}
              selectedDate={currentCategoryContentDate}
              onDateChange={setActiveContentDate}
              keyword={globalKeyword}
              isLoading={searchLoading}
              errorMessage={searchError}
            />
          )}

          {activeTab === "选题分析与报告" && (
            <ReportsTab
              category={activeCategory}
              reportMode={reportMode}
              onReportModeChange={setReportMode}
              selectedReportDate={activeReportDate}
              onReportDateChange={setActiveReportDate}
              historyContext={
                activeSearchDetail
                  ? {
                      keyword: activeSearchDetail.search.keyword,
                      createdAt: activeSearchDetail.search.createdAt,
                      reportStatus: activeSearchDetail.report.reportStatus,
                      sourceLabel: sourceLabel(activeSearchDetail.search.sourceType)
                    }
                  : undefined
              }
            />
          )}

          {activeTab === "监控设置" && (
            <SettingsTab
              category={activeCategory}
              persistenceHint={`当前关键词“${globalKeyword}”可以按微信、小红书或全选执行采集，结果会按来源分别保存到本地 SQLite。`}
            />
          )}
        </main>
      </div>
    </div>
  );
}

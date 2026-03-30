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
import { shouldUseWechatLiveSource } from "@/lib/wechat-monitor";

const tabs: DashboardTab[] = ["内容", "选题分析与报告", "监控设置"];

type SearchHistoryItem = {
  id: number;
  keyword: string;
  sourceType: string;
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
    sourceType: string;
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

type WechatArticlesApiResponse = {
  searchId: number;
  keyword: string;
  total: number;
  page: number;
  totalPages: number;
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

export function Dashboard() {
  const categories = getCategories();
  const [activeCategoryId, setActiveCategoryId] = useState(getDefaultCategory().id);
  const [wechatKeyword, setWechatKeyword] = useState("网文出海");
  const [keywordInput, setKeywordInput] = useState("网文出海");

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

  const activeCategory = useMemo(
    () =>
      activeCategoryBase.id === "wechat-monitor"
        ? {
            ...activeCategoryBase,
            keywordCount: 1,
            summary: `按关键词监控公众号文章热度，当前追踪词为“${wechatKeyword}”。历史查询会保存到本地 SQLite。`,
            settings: {
              ...activeCategoryBase.settings,
              keywords: [wechatKeyword],
              schedule: {
                ...activeCategoryBase.settings.schedule,
                scope: `以关键词“${wechatKeyword}”查询近 7 天公众号文章，并保存搜索历史`
              }
            },
            liveSource: {
              type: "wechat" as const,
              keyword: wechatKeyword
            }
          }
        : activeCategoryBase,
    [activeCategoryBase, wechatKeyword]
  );

  const isWechatCategory = shouldUseWechatLiveSource(activeCategory.id);

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
      setWechatKeyword(payload.search.keyword);
      setKeywordInput(payload.search.keyword);
      setActiveContentDate(payload.days[0]?.date ?? "");
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "历史查询详情加载失败。");
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const loadSearchHistory = useCallback(async (selectedId?: number | null) => {
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

      const nextId = selectedId ?? payload.history[0]?.id ?? null;

      if (isWechatCategory && nextId) {
        await loadSearchDetail(nextId);
      }
    } catch (error) {
      setHistoryError(error instanceof Error ? error.message : "历史关键词加载失败。");
    } finally {
      setHistoryLoading(false);
    }
  }, [isWechatCategory, loadSearchDetail]);

  useEffect(() => {
    setActivePlatform(getDefaultPlatform(activeCategoryBase));
    setActiveContentDate(getDefaultContentDate(activeCategoryBase));
    setActiveReportDate(getDefaultReportDate(activeCategoryBase));
    setReportMode("日报");
    setActiveTab("内容");
  }, [activeCategoryId, activeCategoryBase]);

  useEffect(() => {
    if (isWechatCategory) {
      void loadSearchHistory(activeSearchId);
    }
  }, [activeSearchId, isWechatCategory, loadSearchHistory]);

  const currentContentDays =
    isWechatCategory && activeSearchDetail ? activeSearchDetail.days : activeCategory.contentDays;

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

  async function handleKeywordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isWechatCategory) {
      return;
    }

    const nextKeyword = keywordInput.trim();

    if (!nextKeyword) {
      return;
    }

    setSearchLoading(true);
    setSearchError(null);

    try {
      const params = new URLSearchParams({ kw: nextKeyword });
      const response = await fetch(`/api/wechat-articles?${params.toString()}`, {
        cache: "no-store"
      });

      if (!response.ok) {
        const error = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(error?.message ?? "公众号文章拉取失败。");
      }

      const payload = (await response.json()) as WechatArticlesApiResponse;
      setWechatKeyword(nextKeyword);
      await loadSearchHistory(payload.searchId);
      setActiveSearchId(payload.searchId);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "公众号文章拉取失败。");
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
              按分类独立管理平台、关键词和对标博主，并将公众号查询历史持久化到本地
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
                  {category.id === "wechat-monitor"
                    ? `按关键词监控公众号文章热度，当前追踪词为“${wechatKeyword}”。`
                    : category.summary}
                </p>
                <div className="stat-row">
                  <span>{category.platformCount} 个平台</span>
                  <span>{category.id === "wechat-monitor" ? 1 : category.keywordCount} 个关键词</span>
                  <span>{category.creatorCount} 个博主</span>
                </div>
                <p className="helper-text">
                  {category.id === "wechat-monitor" && currentHistoryMeta
                    ? `最近查询：${formatHistoryTime(currentHistoryMeta.createdAt)}`
                    : `最近运行：${category.lastRun}`}
                </p>
              </button>
            ))}
          </div>

          <section className="history-panel">
            <div className="split-header">
              <div>
                <h4>历史关键词</h4>
                <p className="section-copy">查看每次查询的关键词、文章数量和待分析状态。</p>
              </div>
              <span className="small-pill">{historyItems.length} 条</span>
            </div>

            {historyLoading ? (
              <div className="history-empty">正在加载历史记录...</div>
            ) : historyError ? (
              <div className="history-empty">{historyError}</div>
            ) : historyItems.length === 0 ? (
              <div className="history-empty">还没有历史关键词，先搜索一次公众号文章。</div>
            ) : (
              <div className="history-list">
                {historyItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`history-card ${item.id === activeSearchId ? "active" : ""}`}
                    onClick={() => {
                      setActiveCategoryId("wechat-monitor");
                      void loadSearchDetail(item.id);
                    }}
                  >
                    <div className="history-card-top">
                      <strong>{item.keyword}</strong>
                      <span className="small-pill">{item.reportStatus === "pending" ? "待分析" : item.reportStatus}</span>
                    </div>
                    <div className="history-meta">
                      <span>{formatHistoryTime(item.createdAt)}</span>
                      <span>{item.articleCount} 篇文章</span>
                    </div>
                    <p className="helper-text">状态：{item.status}</p>
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
                    <span className="metric-label">监控关键词</span>
                    <span className="hero-stat-value">{activeCategory.keywordCount}</span>
                  </div>
                  <div className="hero-stat">
                    <span className="metric-label">历史记录</span>
                    <span className="hero-stat-value">{historyItems.length}</span>
                  </div>
                </div>
              </div>

              <div className="hero-side">
                <div className="hero-note">
                  <strong>当前关键词</strong>
                  <p>{isWechatCategory ? wechatKeyword : activeCategory.settings.keywords.join(" / ")}</p>
                </div>
                <div className="hero-note">
                  <strong>数据落库</strong>
                  <p>{isWechatCategory ? "每次搜索都会写入 SQLite 历史表" : activeCategory.settings.schedule.runTime}</p>
                </div>
                <div className="hero-note">
                  <strong>当前状态</strong>
                  <p>
                    {isWechatCategory && currentHistoryMeta
                      ? `${currentHistoryMeta.articleCount} 篇文章，${currentHistoryMeta.reportStatus}`
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
              <span className="metric-label">当前历史记录</span>
              <span className="metric-value">{currentHistoryMeta?.id ?? "-"}</span>
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
                {isWechatCategory
                  ? `回车后会更新“公众号文章监控”的当前关键词，保存搜索历史并刷新左侧列表。当前关键词：${wechatKeyword}`
                  : "该搜索仅作用于“公众号文章监控”分类。"}
              </p>
            </div>
            <form className="keyword-search-form" onSubmit={handleKeywordSubmit}>
              <input
                className="keyword-search-input"
                type="text"
                value={keywordInput}
                onChange={(event) => setKeywordInput(event.target.value)}
                placeholder="输入关键词后按回车，例如：网文出海"
                disabled={!isWechatCategory}
              />
              <button
                className="keyword-search-button"
                type="submit"
                disabled={!isWechatCategory || searchLoading}
              >
                {searchLoading ? "搜索中..." : "回车搜索"}
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
              keyword={isWechatCategory ? wechatKeyword : activeCategory.liveSource?.keyword}
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
                isWechatCategory && activeSearchDetail
                  ? {
                      keyword: activeSearchDetail.search.keyword,
                      createdAt: activeSearchDetail.search.createdAt,
                      reportStatus: activeSearchDetail.report.reportStatus
                    }
                  : undefined
              }
            />
          )}

          {activeTab === "监控设置" && (
            <SettingsTab
              category={activeCategory}
              persistenceHint={
                isWechatCategory
                  ? `当前关键词“${wechatKeyword}”的查询结果会保存到本地 SQLite，历史记录显示在左侧。`
                  : undefined
              }
            />
          )}
        </main>
      </div>
    </div>
  );
}

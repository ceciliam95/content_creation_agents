"use client";

import { useEffect, useMemo, useState } from "react";
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

type WechatArticlesApiResponse = {
  keyword: string;
  total: number;
  page: number;
  totalPages: number;
  days: ContentDay[];
};

export function Dashboard() {
  const categories = getCategories();
  const [activeCategoryId, setActiveCategoryId] = useState(getDefaultCategory().id);
  const [wechatKeyword, setWechatKeyword] = useState("网文出海");
  const [keywordInput, setKeywordInput] = useState("网文出海");

  const activeCategoryBase =
    categories.find((category) => category.id === activeCategoryId) ?? getDefaultCategory();
  const activeCategory = useMemo(
    () =>
      activeCategoryBase.id === "wechat-monitor"
        ? {
            ...activeCategoryBase,
            keywordCount: 1,
            summary: `按关键词监控公众号文章热度，当前追踪词为“${wechatKeyword}”。`,
            settings: {
              ...activeCategoryBase.settings,
              keywords: [wechatKeyword],
              schedule: {
                ...activeCategoryBase.settings.schedule,
                scope: `以关键词“${wechatKeyword}”查询近 7 天公众号文章`
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

  const [activeTab, setActiveTab] = useState<DashboardTab>("内容");
  const [activePlatform, setActivePlatform] = useState<Platform>(
    getDefaultPlatform(activeCategory)
  );
  const [activeContentDate, setActiveContentDate] = useState(
    getDefaultContentDate(activeCategory)
  );
  const [activeReportDate, setActiveReportDate] = useState(
    getDefaultReportDate(activeCategory)
  );
  const [reportMode, setReportMode] = useState<"日报" | "最近 7 天汇总">("日报");

  const [liveContentDays, setLiveContentDays] = useState<Record<string, ContentDay[]>>({});
  const [liveLoading, setLiveLoading] = useState<Record<string, boolean>>({});
  const [liveErrors, setLiveErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    setActivePlatform(getDefaultPlatform(activeCategory));
    setActiveContentDate(getDefaultContentDate(activeCategory));
    setActiveReportDate(getDefaultReportDate(activeCategory));
    setReportMode("日报");
    setActiveTab("内容");
  }, [activeCategoryId, activeCategory]);

  useEffect(() => {
    if (shouldUseWechatLiveSource(activeCategory.id)) {
      setKeywordInput(wechatKeyword);
    }
  }, [activeCategory.id, wechatKeyword]);

  useEffect(() => {
    if (
      !activeCategory.liveSource ||
      activeCategory.liveSource.type !== "wechat" ||
      !shouldUseWechatLiveSource(activeCategory.id)
    ) {
      return;
    }

    const controller = new AbortController();

    async function loadWechatArticles(category: MonitoringCategory) {
      setLiveLoading((current) => ({ ...current, [category.id]: true }));
      setLiveErrors((current) => ({ ...current, [category.id]: null }));

      try {
        const params = new URLSearchParams({
          kw: category.liveSource?.keyword ?? "网文出海"
        });
        const response = await fetch(`/api/wechat-articles?${params.toString()}`, {
          signal: controller.signal
        });

        if (!response.ok) {
          const error = (await response.json().catch(() => null)) as { message?: string } | null;
          throw new Error(error?.message ?? "公众号接口请求失败。");
        }

        const payload = (await response.json()) as WechatArticlesApiResponse;

        setLiveContentDays((current) => ({
          ...current,
          [category.id]: payload.days
        }));

        if (payload.days[0]?.date) {
          setActiveContentDate(payload.days[0].date);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setLiveErrors((current) => ({
          ...current,
          [category.id]:
            error instanceof Error ? error.message : "公众号文章拉取失败。"
        }));
      } finally {
        if (!controller.signal.aborted) {
          setLiveLoading((current) => ({ ...current, [category.id]: false }));
        }
      }
    }

    void loadWechatArticles(activeCategory);

    return () => {
      controller.abort();
    };
  }, [activeCategory]);

  const currentContentDays =
    activeCategory.liveSource?.type === "wechat"
      ? liveContentDays[activeCategory.id] ?? []
      : activeCategory.contentDays;

  const currentCategoryContentDate =
    currentContentDays.find((day) => day.date === activeContentDate)?.date ??
    currentContentDays[0]?.date ??
    "";

  const currentPlatforms =
    currentContentDays.length > 0
      ? Array.from(new Set(currentContentDays.flatMap((day) => day.items.map((item) => item.platform))))
      : activeCategory.settings.platforms.map((platform) => platform.name);

  const metricsContentDay = currentContentDays[0];
  const isWechatCategory = shouldUseWechatLiveSource(activeCategory.id);

  function handleKeywordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isWechatCategory) {
      return;
    }

    const nextKeyword = keywordInput.trim();

    if (!nextKeyword || nextKeyword === wechatKeyword) {
      return;
    }

    setWechatKeyword(nextKeyword);
    setLiveContentDays((current) => ({
      ...current,
      [activeCategory.id]: []
    }));
    setLiveErrors((current) => ({
      ...current,
      [activeCategory.id]: null
    }));
  }

  return (
    <div className="page-shell">
      <div className="dashboard-shell">
        <aside className="panel sidebar">
          <div className="sidebar-header">
            <p className="eyebrow">Monitor Matrix</p>
            <h1>内容监控台</h1>
            <p className="sidebar-copy">
              按分类独立管理平台、关键词和对标博主，并每天自动生成热门内容分析与选题建议。
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
                <p className="category-summary">{category.summary}</p>
                <div className="stat-row">
                  <span>{category.platformCount} 个平台</span>
                  <span>{category.keywordCount} 个关键词</span>
                  <span>{category.creatorCount} 个博主</span>
                </div>
                <p className="helper-text">最近运行：{category.lastRun}</p>
              </button>
            ))}
          </div>
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
                    <span className="metric-label">对标博主</span>
                    <span className="hero-stat-value">{activeCategory.creatorCount}</span>
                  </div>
                </div>
              </div>

              <div className="hero-side">
                <div className="hero-note">
                  <strong>每日自动运行</strong>
                  <p>{activeCategory.settings.schedule.runTime}</p>
                </div>
                <div className="hero-note">
                  <strong>默认关键词</strong>
                  <p>{activeCategory.settings.keywords.join(" / ")}</p>
                </div>
                <div className="hero-note">
                  <strong>当前状态</strong>
                  <p>{activeCategory.runStatus}</p>
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
              <span className="metric-label">最新报告日期</span>
              <span className="metric-value">{activeCategory.reportDays[0]?.date ?? "-"}</span>
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
                  ? `回车后会更新“公众号文章监控”的当前关键词，并重新拉取公众号文章。当前关键词：${wechatKeyword}`
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
                disabled={!isWechatCategory || liveLoading[activeCategory.id]}
              >
                {liveLoading[activeCategory.id] ? "搜索中..." : "回车搜索"}
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
              keyword={activeCategory.liveSource?.keyword}
              isLoading={liveLoading[activeCategory.id]}
              errorMessage={liveErrors[activeCategory.id]}
            />
          )}

          {activeTab === "选题分析与报告" && (
            <ReportsTab
              category={activeCategory}
              reportMode={reportMode}
              onReportModeChange={setReportMode}
              selectedReportDate={activeReportDate}
              onReportDateChange={setActiveReportDate}
            />
          )}

          {activeTab === "监控设置" && <SettingsTab category={activeCategory} />}
        </main>
      </div>
    </div>
  );
}

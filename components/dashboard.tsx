"use client";

import { useEffect, useState } from "react";
import { ContentTab } from "@/components/content-tab";
import {
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

export function Dashboard() {
  const categories = getCategories();
  const [activeCategoryId, setActiveCategoryId] = useState(getDefaultCategory().id);
  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) ?? getDefaultCategory();

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

  useEffect(() => {
    setActivePlatform(getDefaultPlatform(activeCategory));
    setActiveContentDate(getDefaultContentDate(activeCategory));
    setActiveReportDate(getDefaultReportDate(activeCategory));
    setReportMode("日报");
    setActiveTab("内容");
  }, [activeCategoryId, activeCategory]);

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
                  <p>{activeCategory.settings.schedule.runTime} 自动抓取并分析内容</p>
                </div>
                <div className="hero-note">
                  <strong>AI 输出</strong>
                  <p>基于热门前 10 内容生成日报、热点总结与选题建议</p>
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
              <span className="metric-value">
                {activeCategory.contentDays[0]?.totalItems ?? 0} 条
              </span>
            </article>
            <article className="metric-card">
              <span className="metric-label">最近爆款内容</span>
              <span className="metric-value">
                {activeCategory.contentDays[0]?.breakoutCount ?? 0} 条
              </span>
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

          {activeTab === "内容" && (
            <ContentTab
              platforms={activeCategory.settings.platforms.map((platform) => platform.name)}
              selectedPlatform={activePlatform}
              onPlatformChange={setActivePlatform}
              days={activeCategory.contentDays}
              selectedDate={activeContentDate}
              onDateChange={setActiveContentDate}
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


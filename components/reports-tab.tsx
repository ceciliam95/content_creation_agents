"use client";

import {
  type MonitoringCategory,
  getRecentTopics
} from "@/components/mock-data";

type ReportsTabProps = {
  category: MonitoringCategory;
  reportMode: "日报" | "最近 7 天汇总";
  onReportModeChange: (mode: "日报" | "最近 7 天汇总") => void;
  selectedReportDate: string;
  onReportDateChange: (date: string) => void;
};

export function ReportsTab({
  category,
  reportMode,
  onReportModeChange,
  selectedReportDate,
  onReportDateChange
}: ReportsTabProps) {
  const activeReport =
    category.reportDays.find((report) => report.date === selectedReportDate) ??
    category.reportDays[0];
  const recentTopics = getRecentTopics(category);

  return (
    <div className="tab-panel">
      <div className="toolbar">
        <div>
          <h3>选题分析与报告</h3>
          <p className="section-copy">
            默认展示最新报告，再用带摘要的日期卡片引导用户进入更有价值的历史日期。
          </p>
        </div>
        <div className="report-toggle-row">
          {(["日报", "最近 7 天汇总"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              className={`report-toggle ${reportMode === mode ? "active" : ""}`}
              onClick={() => onReportModeChange(mode)}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {reportMode === "日报" ? (
        <div className="report-layout">
          <div className="report-list">
            {category.reportDays.map((report) => (
              <button
                key={report.date}
                type="button"
                className={`report-preview-card ${
                  report.date === activeReport?.date ? "active" : ""
                }`}
                onClick={() => onReportDateChange(report.date)}
              >
                <strong>{report.date}</strong>
                <p>{report.preview}</p>
              </button>
            ))}
          </div>

          <div className="soft-panel">
            <div className="split-header">
              <div>
                <h4>{activeReport?.title}</h4>
                <p className="report-copy">{activeReport?.hotSummary}</p>
              </div>
              <span className="small-pill">最新聚焦 {activeReport?.date}</span>
            </div>

            <div className="insight-grid">
              <div className="settings-block">
                <h4>AI 观察结论</h4>
                <ul className="bullet-list">
                  {activeReport?.aiTakeaways.map((takeaway) => (
                    <li key={takeaway}>{takeaway}</li>
                  ))}
                </ul>
              </div>
              <div className="settings-block">
                <h4>建议重点跟进</h4>
                <ul className="bullet-list">
                  {activeReport?.suggestedFocus.map((focus) => (
                    <li key={focus}>{focus}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="topic-list">
              {activeReport?.topics.map((topic) => (
                <article key={topic.id} className="topic-card">
                  <div className="topic-meta">
                    <span className="small-pill">选题建议</span>
                    <span>{activeReport.date}</span>
                  </div>
                  <h4>{topic.title}</h4>
                  <p>{topic.brief}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="soft-panel">
          <div className="split-header">
            <div>
              <h4>最近 7 天选题汇总</h4>
              <p className="report-copy">
                把跨天选题集中展示，适合内容团队开选题会时快速扫全局。
              </p>
            </div>
            <span className="small-pill">{recentTopics.length} 个方向</span>
          </div>
          <div className="topic-list">
            {recentTopics.map((topic) => (
              <article key={`${topic.date}-${topic.id}`} className="topic-card">
                <div className="topic-meta">
                  <span className="small-pill">{topic.date}</span>
                  <span>{category.name}</span>
                </div>
                <h4>{topic.title}</h4>
                <p>{topic.brief}</p>
              </article>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


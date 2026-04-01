"use client";

import {
  type MonitoringCategory,
  getRecentTopics
} from "@/components/mock-data";

type AnalysisTaskView = {
  id: number;
  sourceType: "wechat" | "xiaohongshu";
  status: string;
  selectedCount: number;
  createdAt: string;
  itemSummaries: Array<{
    summary: string;
    keywords: string[];
    keyPoints: string[];
    highlights: string[];
    angles: string[];
    risks: string[];
  }>;
  report: {
    reportStatus: string;
    summary: string;
    hotInsights: string;
  } | null;
  suggestions: Array<{
    title: string;
    brief: string;
    whyNow: string;
    entryPoint: string;
    referenceItemIds: string[];
  }>;
};

type ReportsTabProps = {
  category: MonitoringCategory;
  reportMode: "日报" | "最近 7 天汇总";
  onReportModeChange: (mode: "日报" | "最近 7 天汇总") => void;
  selectedReportDate: string;
  onReportDateChange: (date: string) => void;
  historyContext?: {
    keyword: string;
    createdAt: string;
    reportStatus: string;
    sourceLabel: string;
  };
  analysisTasks?: AnalysisTaskView[];
  activeTaskId?: number | null;
  onTaskSelect?: (taskId: number) => void;
};

function sourceLabel(sourceType: "wechat" | "xiaohongshu") {
  return sourceType === "wechat" ? "微信" : "小红书";
}

export function ReportsTab({
  category,
  reportMode,
  onReportModeChange,
  selectedReportDate,
  onReportDateChange,
  historyContext,
  analysisTasks = [],
  activeTaskId,
  onTaskSelect
}: ReportsTabProps) {
  const activeReport =
    category.reportDays.find((report) => report.date === selectedReportDate) ??
    category.reportDays[0];
  const recentTopics = getRecentTopics(category);
  const activeTask = analysisTasks.find((task) => task.id === activeTaskId) ?? analysisTasks[0];

  if (analysisTasks.length > 0 && activeTask) {
    return (
      <div className="tab-panel">
        <div className="toolbar">
          <div>
            <h3>选题分析与报告</h3>
            <p className="section-copy">已选内容会先逐篇结构化分析，再聚合生成至少 5 条选题洞察。</p>
          </div>
          <span className="small-pill">{activeTask.status}</span>
        </div>

        <div className="report-layout">
          <div className="report-list">
            {analysisTasks.map((task) => (
              <button
                key={task.id}
                type="button"
                className={`report-preview-card ${task.id === activeTask.id ? "active" : ""}`}
                onClick={() => onTaskSelect?.(task.id)}
              >
                <strong>任务 #{task.id}</strong>
                <p>
                  {sourceLabel(task.sourceType)} / {task.selectedCount} 篇 / {task.status}
                </p>
              </button>
            ))}
          </div>

          <div className="soft-panel">
            <div className="split-header">
              <div>
                <h4>分析任务详情</h4>
                <p className="report-copy">
                  {historyContext?.keyword} / {sourceLabel(activeTask.sourceType)} / 创建于{" "}
                  {activeTask.createdAt}
                </p>
              </div>
              <span className="small-pill">{activeTask.selectedCount} 篇已选内容</span>
            </div>

            <div className="settings-block">
              <h4>综合洞察</h4>
              <p className="report-copy">
                {activeTask.report?.summary || "正在生成综合洞察..."}
              </p>
              <ul className="bullet-list">
                <li>{activeTask.report?.hotInsights || "正在生成热点总结..."}</li>
              </ul>
            </div>

            <div className="topic-list">
              {activeTask.itemSummaries.map((item, index) => (
                <article key={`${activeTask.id}-summary-${index}`} className="topic-card">
                  <div className="topic-meta">
                    <span className="small-pill">逐篇摘要</span>
                    <span>第 {index + 1} 篇</span>
                  </div>
                  <h4>{item.summary}</h4>
                  <p>关键词：{item.keywords.join(" / ")}</p>
                  <p>关键信息：{item.keyPoints.join("；")}</p>
                  <p>亮点：{item.highlights.join("；")}</p>
                  <p>切入角度：{item.angles.join("；")}</p>
                  <p>风险：{item.risks.join("；")}</p>
                </article>
              ))}
            </div>

            <div className="topic-list">
              {activeTask.suggestions.map((suggestion, index) => (
                <article key={`${activeTask.id}-suggestion-${index}`} className="topic-card">
                  <div className="topic-meta">
                    <span className="small-pill">选题建议</span>
                    <span>建议 {index + 1}</span>
                  </div>
                  <h4>{suggestion.title}</h4>
                  <p>{suggestion.brief}</p>
                  <p>为什么值得做：{suggestion.whyNow}</p>
                  <p>建议切入：{suggestion.entryPoint}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (historyContext) {
    return (
      <div className="tab-panel">
        <div className="toolbar">
          <div>
            <h3>选题分析与报告</h3>
            <p className="section-copy">
              当前历史查询已和未来的 AI 选题分析建立关联，本阶段先显示待分析占位。
            </p>
          </div>
          <span className="small-pill">
            {historyContext.reportStatus === "pending" ? "待分析" : historyContext.reportStatus}
          </span>
        </div>

        <div className="soft-panel">
          <div className="split-header">
            <div>
              <h4>该次历史查询的选题信息尚未生成</h4>
              <p className="report-copy">
                关键词“{historyContext.keyword}”的{historyContext.sourceLabel}
                结果已保存，后续可以直接基于这次查询结果生成选题分析与建议。
              </p>
            </div>
            <span className="small-pill">{historyContext.createdAt}</span>
          </div>
          <div className="insight-grid">
            <div className="settings-block">
              <h4>已完成</h4>
              <ul className="bullet-list">
                <li>关键词已保存到历史记录</li>
                <li>原始采集内容已落到 SQLite</li>
                <li>该次查询已具备创建分析任务的能力</li>
              </ul>
            </div>
            <div className="settings-block">
              <h4>后续这里会展示</h4>
              <ul className="bullet-list">
                <li>逐篇结构化摘要</li>
                <li>综合热点洞察</li>
                <li>至少 5 条结构化选题建议</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

"use client";

import type { ContentDay, Platform } from "@/components/mock-data";

type ContentTabProps = {
  platforms: Platform[];
  selectedPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
  days: ContentDay[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  keyword?: string;
  isLoading?: boolean;
  errorMessage?: string | null;
  inlineNotice?: string | null;
  selectedItemIds?: string[];
  onToggleItem?: (itemId: string) => void;
  onClearSelection?: () => void;
  onAnalyzeSelection?: () => void;
  analyzeDisabled?: boolean;
};

export function ContentTab({
  platforms,
  selectedPlatform,
  onPlatformChange,
  days,
  selectedDate,
  onDateChange,
  keyword,
  isLoading = false,
  errorMessage,
  inlineNotice,
  selectedItemIds = [],
  onToggleItem,
  onClearSelection,
  onAnalyzeSelection,
  analyzeDisabled = false
}: ContentTabProps) {
  const activeDay = days.find((day) => day.date === selectedDate) ?? days[0];
  const filteredItems = (activeDay?.items ?? []).filter(
    (item) => item.platform === selectedPlatform
  );

  return (
    <div className="tab-panel">
      <div className="toolbar">
        <div>
          <h3>内容时间线</h3>
          <p className="section-copy">
            {keyword
              ? `当前按关键词“${keyword}”查看采集结果，可多选内容后进行两阶段 AI 选题分析。`
              : "用横向日期卡片替代日历输入，让用户优先看到有内容、有爆款的日期。"}
          </p>
        </div>
        <div className="platform-row">
          {platforms.map((platform) => (
            <button
              key={platform}
              type="button"
              className={`platform-chip ${
                platform === selectedPlatform ? "active" : ""
              }`}
              onClick={() => onPlatformChange(platform)}
            >
              {platform}
            </button>
          ))}
        </div>
      </div>

      {inlineNotice ? (
        <div className="inline-notice" role="status">
          {inlineNotice}
        </div>
      ) : null}

      {isLoading ? (
        <div className="content-card">
          <h4>正在加载内容</h4>
          <p>请稍候，系统正在拉取或分析当前关键词下的内容。</p>
        </div>
      ) : errorMessage ? (
        <div className="content-card">
          <h4>内容加载失败</h4>
          <p>{errorMessage}</p>
        </div>
      ) : days.length === 0 ? (
        <div className="content-card">
          <h4>没有查到匹配内容</h4>
          <p>当前关键词下没有返回内容，可以稍后更换关键词或重试。</p>
        </div>
      ) : (
        <>
          <div className="date-rail">
            {days.map((day) => (
              <button
                key={day.date}
                type="button"
                className={`date-card ${day.date === activeDay?.date ? "active" : ""}`}
                onClick={() => onDateChange(day.date)}
              >
                <strong>{day.date}</strong>
                <div className="content-meta">
                  <span>{day.totalItems} 条内容</span>
                  <span>{day.breakoutCount} 条爆款</span>
                </div>
                <span className="small-pill">主平台 {day.leadPlatform}</span>
              </button>
            ))}
          </div>

          <div className="split-layout">
            <div className="soft-panel">
              <div className="split-header">
                <div>
                  <h4>{activeDay?.date}</h4>
                  <p className="section-copy">采集概览</p>
                </div>
                <span className="small-pill">{selectedPlatform}</span>
              </div>
              <div className="settings-grid cols-2">
                <div className="metric-card">
                  <span className="metric-label">当日总内容</span>
                  <span className="metric-value">{activeDay?.totalItems ?? 0}</span>
                </div>
                <div className="metric-card">
                  <span className="metric-label">当日爆款</span>
                  <span className="metric-value">{activeDay?.breakoutCount ?? 0}</span>
                </div>
              </div>
              <p className="helper-text">勾选想分析的内容后，底部会出现“进行分析”操作栏。</p>
            </div>

            <div>
              <div className="split-header">
                <div>
                  <h4>{selectedPlatform} 热门内容</h4>
                  <p className="section-copy">默认按热度排序，支持多选后进行结构化选题分析。</p>
                </div>
              </div>
              <div className="content-list">
                {filteredItems.length > 0 ? (
                  filteredItems
                    .slice()
                    .sort((left, right) => right.heat - left.heat)
                    .map((item) => {
                      const checked = selectedItemIds.includes(item.id);

                      return (
                        <article key={item.id} className="content-card">
                          <div className="content-select-row">
                            <label className="content-checkbox">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() => onToggleItem?.(item.id)}
                              />
                              <span>选择用于分析</span>
                            </label>
                          </div>
                          <div className="content-meta">
                            <span className="small-pill">{item.platform}</span>
                            <span>{item.author}</span>
                            <span>{item.publishTime}</span>
                            <span>热度 {item.heat}</span>
                          </div>
                          <h4>{item.title}</h4>
                          <p>{item.summary}</p>
                          <div className="tag-row">
                            {item.tags.map((tag) => (
                              <span key={tag} className="tag">
                                {tag}
                              </span>
                            ))}
                          </div>
                          {item.url ? (
                            <div className="helper-text">
                              <a href={item.url} target="_blank" rel="noreferrer">
                                查看原文
                              </a>
                            </div>
                          ) : null}
                        </article>
                      );
                    })
                ) : (
                  <div className="content-card">
                    <h4>这个平台当天没有采集到重点内容</h4>
                    <p>保留空状态能帮助用户快速确认问题来自数据本身，而不是筛选器失效。</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {selectedItemIds.length > 0 ? (
            <div className="analysis-action-bar">
              <strong>已选 {selectedItemIds.length} 篇内容</strong>
              <div className="analysis-action-buttons">
                <button type="button" className="platform-chip" onClick={onClearSelection}>
                  清空选择
                </button>
                <button
                  type="button"
                  className="keyword-search-button"
                  disabled={analyzeDisabled}
                  onClick={onAnalyzeSelection}
                >
                  进行分析
                </button>
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

"use client";

import type { ContentDay, Platform } from "@/components/mock-data";

type ContentTabProps = {
  platforms: Platform[];
  selectedPlatform: Platform;
  onPlatformChange: (platform: Platform) => void;
  days: ContentDay[];
  selectedDate: string;
  onDateChange: (date: string) => void;
};

export function ContentTab({
  platforms,
  selectedPlatform,
  onPlatformChange,
  days,
  selectedDate,
  onDateChange
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
            用横向日期卡片替代日历输入，让用户优先看到有内容、有爆款的日期。
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
          <p className="helper-text">
            平台筛选保持平铺显示，适合运营人员高频在不同平台之间来回切换。
          </p>
        </div>

        <div>
          <div className="split-header">
            <div>
              <h4>{selectedPlatform} 热门内容</h4>
              <p className="section-copy">
                默认按热度排序，方便直接查看当天最值得拆解的内容。
              </p>
            </div>
          </div>
          <div className="content-list">
            {filteredItems.length > 0 ? (
              filteredItems
                .slice()
                .sort((left, right) => right.heat - left.heat)
                .map((item) => (
                  <article key={item.id} className="content-card">
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
                  </article>
                ))
            ) : (
              <div className="content-card">
                <h4>这个平台当天没有采集到重点内容</h4>
                <p>保留空状态能帮助用户快速确认问题来自数据本身，而不是筛选器失效。</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


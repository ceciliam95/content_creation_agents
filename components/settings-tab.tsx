import type { MonitoringCategory } from "@/components/mock-data";

type SettingsTabProps = {
  category: MonitoringCategory;
};

export function SettingsTab({ category }: SettingsTabProps) {
  return (
    <div className="tab-panel">
      <div className="toolbar">
        <div>
          <h3>监控设置</h3>
          <p className="section-copy">
            把平台、关键词、对标博主和运行规则拆成独立区块，降低理解成本。
          </p>
        </div>
        <span className="small-pill">{category.settings.schedule.runTime} 自动运行</span>
      </div>

      <div className="settings-grid cols-3">
        <section className="settings-block">
          <h4>监控平台</h4>
          <p className="settings-copy">支持多平台并行采集，平台状态与采集节奏直接可见。</p>
          <div className="creator-list">
            {category.settings.platforms.map((platform) => (
              <div key={platform.name} className="settings-list-item">
                <div>
                  <strong>{platform.name}</strong>
                  <p className="helper-text">{platform.cadence}</p>
                </div>
                <span className="small-pill">{platform.status}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="settings-block">
          <h4>对标关键词</h4>
          <p className="settings-copy">标签化展示便于快速确认当前分类的监控边界。</p>
          <div className="tag-row">
            {category.settings.keywords.map((keyword) => (
              <span key={keyword} className="tag">
                {keyword}
              </span>
            ))}
          </div>
        </section>

        <section className="settings-block">
          <h4>自动运行</h4>
          <p className="settings-copy">{category.settings.schedule.scope}</p>
          <ul className="bullet-list">
            <li>运行时间：{category.settings.schedule.runTime}</li>
            <li>时区：{category.settings.schedule.timezone}</li>
            <li>分类隔离：每个监控分类独立存储内容与报告</li>
          </ul>
        </section>
      </div>

      <section className="settings-block">
        <h4>对标博主 / 账号</h4>
        <p className="settings-copy">
          用列表保留平台信息和备注，帮助运营人员理解“为什么监控这个账号”。
        </p>
        <div className="creator-list">
          {category.settings.creators.map((creator) => (
            <div key={`${creator.platform}-${creator.name}`} className="settings-list-item">
              <div>
                <strong>{creator.name}</strong>
                <p className="helper-text">{creator.note}</p>
              </div>
              <span className="small-pill">{creator.platform}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}


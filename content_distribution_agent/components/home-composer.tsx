"use client";

import type { PlatformKey } from "@/lib/types";

type Props = {
  error: string | null;
  isGenerating: boolean;
  request: string;
  selectedPlatforms: PlatformKey[];
  onRequestChange: (value: string) => void;
  onTogglePlatform: (platform: PlatformKey) => void;
  onGenerate: () => void;
};

const platforms: Array<{ key: PlatformKey; label: string }> = [
  { key: "wechat", label: "公众号文章" },
  { key: "xiaohongshu", label: "小红书笔记" },
  { key: "twitter", label: "Twitter" },
  { key: "videoScript", label: "视频脚本" }
];

export function HomeComposer({
  error,
  isGenerating,
  request,
  selectedPlatforms,
  onRequestChange,
  onTogglePlatform,
  onGenerate
}: Props) {
  return (
    <section className="hero-composer">
      <div className="hero-shell">
        <p className="eyebrow">Content Factory</p>
        <h1>内容工厂创作 Agent</h1>
        <p className="lead">一次输入，先生成母稿，再延展成多平台内容初稿。</p>

        <label className="hero-label" htmlFor="request-box">
          创作需求
        </label>
        <textarea
          id="request-box"
          className="request-box"
          value={request}
          onChange={(event) => onRequestChange(event.target.value)}
          placeholder="输入创作主题、目标受众、内容角度和希望达成的效果"
        />

        <div className="hero-meta">
          <div>
            <p className="hero-label">生成平台</p>
            <div className="chip-row">
              {platforms.map((platform) => (
                <button
                  key={platform.key}
                  type="button"
                  className={selectedPlatforms.includes(platform.key) ? "chip active" : "chip"}
                  onClick={() => onTogglePlatform(platform.key)}
                >
                  {platform.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error ? <p className="notice error">{error}</p> : null}

        <div className="hero-actions">
          <button
            type="button"
            className="primary-button"
            onClick={onGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "生成中..." : "生成内容"}
          </button>
        </div>
      </div>
    </section>
  );
}

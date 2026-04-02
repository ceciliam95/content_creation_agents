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
      <p className="eyebrow">Content Factory</p>
      <h1>内容工厂创作 Agent</h1>
      <p className="lead">一次输入，先生成母稿，再展开为多平台内容初稿。</p>
      <textarea
        className="request-box"
        value={request}
        onChange={(event) => onRequestChange(event.target.value)}
        placeholder="输入创作需求、受众、目标和内容方向"
      />
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
      {error ? <p className="notice error">{error}</p> : null}
      <button
        type="button"
        className="primary-button"
        onClick={onGenerate}
        disabled={isGenerating}
      >
        {isGenerating ? "生成中..." : "生成内容"}
      </button>
    </section>
  );
}

"use client";

import { useState } from "react";
import { HomeComposer } from "@/components/home-composer";
import { WorkspaceShell } from "@/components/workspace-shell";
import { createGeneratedSessionState } from "@/lib/content-factory-state";
import { getMockSessions } from "@/lib/mock-data";
import { promptDefaults } from "@/lib/prompt-defaults";
import type { PlatformKey, SessionRecord } from "@/lib/types";

export function ContentFactoryApp() {
  const initialSessions = getMockSessions();
  const [sessions, setSessions] = useState(initialSessions);
  const [request, setRequest] = useState(initialSessions[0]?.request ?? "");
  const [selectedPlatforms, setSelectedPlatforms] = useState<PlatformKey[]>(
    initialSessions[0]?.selectedPlatforms ?? ["wechat", "xiaohongshu", "twitter", "videoScript"]
  );
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSession = sessions.find((item) => item.id === activeSessionId) ?? null;

  function togglePlatform(platform: PlatformKey) {
    setSelectedPlatforms((current) =>
      current.includes(platform)
        ? current.filter((item) => item !== platform)
        : [...current, platform]
    );
  }

  async function handleGenerate() {
    if (!request.trim()) {
      setError("请输入创作需求。");
      return;
    }

    if (!selectedPlatforms.includes("wechat")) {
      setError("第一阶段仅支持生成公众号内容，请至少选择公众号文章。");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-wechat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          request,
          wechatPrompt: promptDefaults.wechat
        })
      });
      const payload = (await response.json()) as { error?: string; session?: SessionRecord };

      if (!response.ok || !payload.session) {
        throw new Error(payload.error ?? "生成失败。");
      }

      const nextState = createGeneratedSessionState({
        existingSessions: sessions,
        session: payload.session
      });

      setSessions(nextState.sessions);
      setActiveSessionId(nextState.activeSessionId);
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : "生成失败。");
    } finally {
      setIsGenerating(false);
    }
  }

  if (!activeSession) {
    return (
      <HomeComposer
        error={error}
        isGenerating={isGenerating}
        request={request}
        selectedPlatforms={selectedPlatforms}
        onRequestChange={setRequest}
        onTogglePlatform={togglePlatform}
        onGenerate={handleGenerate}
      />
    );
  }

  return (
    <WorkspaceShell
      sessions={sessions}
      activeSession={activeSession}
      onSelectSession={setActiveSessionId}
    />
  );
}

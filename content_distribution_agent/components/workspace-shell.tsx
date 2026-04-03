"use client";

import { useState } from "react";
import { HistorySidebar } from "@/components/history-sidebar";
import { MasterTab } from "@/components/master-tab";
import { WechatEditor } from "@/components/wechat-editor";
import { XiaohongshuEditor } from "@/components/xiaohongshu-editor";
import { TwitterEditor } from "@/components/twitter-editor";
import { VideoScriptEditor } from "@/components/video-script-editor";
import { shouldShowPublishAction, workspaceTabs, type WorkspaceTab } from "@/lib/workspace-config";
import type { SessionRecord } from "@/lib/types";

export function WorkspaceShell({
  sessions,
  activeSession,
  onSelectSession
}: {
  sessions: SessionRecord[];
  activeSession: SessionRecord;
  onSelectSession: (sessionId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("总策划/母稿");

  return (
    <div className="workspace-layout">
      <HistorySidebar
        sessions={sessions}
        activeSessionId={activeSession.id}
        onSelect={onSelectSession}
      />
      <main className="workspace-main">
        <div className="workspace-toolbar">
          <div className="tab-row">
            {workspaceTabs.map((tab) => (
              <button
                key={tab}
                type="button"
                className={tab === activeTab ? "tab-button active" : "tab-button"}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="action-row">
            <button type="button" className="action-button">
              编辑
            </button>
            <button type="button" className="action-button">
              复制
            </button>
            {shouldShowPublishAction(activeTab) ? (
              <button type="button" className="action-button primary-action">
                发布
              </button>
            ) : null}
          </div>
        </div>
        {activeTab === "总策划/母稿" ? <MasterTab draft={activeSession.masterDraft} /> : null}
        {activeTab === "公众号" ? (
          activeSession.outputs.wechat ? (
            <WechatEditor output={activeSession.outputs.wechat} />
          ) : (
            <section className="editor-surface placeholder-surface">公众号内容尚未生成。</section>
          )
        ) : null}
        {activeTab === "小红书" ? (
          activeSession.outputs.xiaohongshu ? (
            <XiaohongshuEditor output={activeSession.outputs.xiaohongshu} />
          ) : (
            <section className="editor-surface placeholder-surface">小红书内容将在后续阶段接入。</section>
          )
        ) : null}
        {activeTab === "Twitter" ? (
          activeSession.outputs.twitter ? (
            <TwitterEditor output={activeSession.outputs.twitter} />
          ) : (
            <section className="editor-surface placeholder-surface">Twitter 内容将在后续阶段接入。</section>
          )
        ) : null}
        {activeTab === "视频脚本" ? (
          activeSession.outputs.videoScript ? (
            <VideoScriptEditor output={activeSession.outputs.videoScript} />
          ) : (
            <section className="editor-surface placeholder-surface">视频脚本将在后续阶段接入。</section>
          )
        ) : null}
      </main>
    </div>
  );
}

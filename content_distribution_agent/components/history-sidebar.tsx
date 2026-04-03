import Link from "next/link";
import type { SessionRecord } from "@/lib/types";

type Props = {
  sessions: SessionRecord[];
  activeSessionId: string;
  onSelect: (sessionId: string) => void;
};

export function HistorySidebar({ sessions, activeSessionId, onSelect }: Props) {
  return (
    <aside className="history-sidebar">
      <div className="history-sidebar-top">
        <p className="eyebrow">Workspace</p>
        <h2>历史记录</h2>
        <div className="history-list">
          {sessions.map((session) => (
            <button
              key={session.id}
              type="button"
              className={session.id === activeSessionId ? "history-card active" : "history-card"}
              onClick={() => onSelect(session.id)}
            >
              <strong>{session.title}</strong>
              <span>{session.createdAt}</span>
              <span>母稿 + {session.selectedPlatforms.length} 平台</span>
            </button>
          ))}
        </div>
      </div>

      <div className="history-sidebar-footer">
        <Link href="/settings" className="sidebar-settings-link">
          设置
        </Link>
      </div>
    </aside>
  );
}

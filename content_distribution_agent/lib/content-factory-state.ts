import type { SessionRecord } from "@/lib/types";

export function createGeneratedSessionState({
  existingSessions,
  session
}: {
  existingSessions: SessionRecord[];
  session: SessionRecord;
}) {
  return {
    sessions: [session, ...existingSessions],
    activeSessionId: session.id
  };
}

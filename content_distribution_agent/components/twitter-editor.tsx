"use client";

import { useState } from "react";
import type { SessionRecord } from "@/lib/types";

export function TwitterEditor({
  output
}: {
  output: NonNullable<SessionRecord["outputs"]["twitter"]>;
}) {
  const [mode, setMode] = useState<"single" | "thread">("single");

  return (
    <section className="editor-surface">
      <div className="tab-row">
        <button
          type="button"
          className={mode === "single" ? "tab-button active" : "tab-button"}
          onClick={() => setMode("single")}
        >
          单条推文
        </button>
        <button
          type="button"
          className={mode === "thread" ? "tab-button active" : "tab-button"}
          onClick={() => setMode("thread")}
        >
          Thread
        </button>
      </div>
      {mode === "single" ? (
        <>
          <p className="counter">{output.single.length}/280</p>
          <textarea className="field-area short" value={output.single} readOnly />
        </>
      ) : (
        <div className="thread-list">
          {output.thread.map((tweet) => (
            <textarea key={tweet} className="field-area short" value={tweet} readOnly />
          ))}
        </div>
      )}
    </section>
  );
}

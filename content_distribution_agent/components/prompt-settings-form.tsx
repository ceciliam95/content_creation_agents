"use client";

import { useState } from "react";
import { promptDefaults } from "@/lib/prompt-defaults";

export function PromptSettingsForm() {
  const [values, setValues] = useState(promptDefaults);

  return (
    <main className="settings-page">
      <h1>平台提示词设置</h1>
      {Object.entries(values).map(([key, value]) => (
        <section key={key} className="editor-surface">
          <h3>{key}</h3>
          <textarea
            className="field-area tall"
            value={value}
            onChange={(event) =>
              setValues((current) => ({ ...current, [key]: event.target.value }))
            }
          />
        </section>
      ))}
      <div className="action-row">
        <button type="button" onClick={() => setValues(promptDefaults)}>
          重置
        </button>
        <button type="button">保存</button>
      </div>
    </main>
  );
}

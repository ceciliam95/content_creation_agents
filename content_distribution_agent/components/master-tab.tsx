import type { MasterDraft } from "@/lib/types";

export function MasterTab({ draft }: { draft: MasterDraft }) {
  return (
    <section className="editor-surface">
      <h3>{draft.title}</h3>
      <p>受众：{draft.audience}</p>
      <p>目标：{draft.objective}</p>
      <p>核心观点：{draft.keyMessage}</p>
      <div>
        <h4>结构大纲</h4>
        <ul>
          {draft.outline.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4>平台拆分建议</h4>
        <ul>
          {draft.platformNotes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

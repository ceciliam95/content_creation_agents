import type { SessionRecord } from "@/lib/types";

export function VideoScriptEditor({
  output
}: {
  output: NonNullable<SessionRecord["outputs"]["videoScript"]>;
}) {
  return (
    <section className="editor-surface">
      <input className="field-input" value={output.title} readOnly />
      <textarea className="field-area short" value={output.hook} readOnly />
      <div className="thread-list">
        {output.sections.map((section) => (
          <textarea key={section} className="field-area short" value={section} readOnly />
        ))}
      </div>
      <textarea className="field-area short" value={output.closing} readOnly />
    </section>
  );
}

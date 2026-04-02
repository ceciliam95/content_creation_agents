import type { SessionRecord } from "@/lib/types";

export function WechatEditor({
  output
}: {
  output: NonNullable<SessionRecord["outputs"]["wechat"]>;
}) {
  return (
    <section className="editor-surface">
      <input className="field-input" value={output.title} readOnly />
      <textarea className="field-area short" value={output.abstract} readOnly />
      <textarea className="field-area tall" value={output.body} readOnly />
      <textarea className="field-area short" value={output.cta} readOnly />
    </section>
  );
}

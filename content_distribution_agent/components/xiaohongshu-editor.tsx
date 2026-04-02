import type { SessionRecord } from "@/lib/types";

export function XiaohongshuEditor({
  output
}: {
  output: NonNullable<SessionRecord["outputs"]["xiaohongshu"]>;
}) {
  return (
    <section className="editor-surface">
      <div className="image-strip">
        {output.images.map((image) => (
          <div key={image} className="image-card">
            {image}
          </div>
        ))}
      </div>
      <textarea className="field-area short" value={output.hook} readOnly />
      <textarea className="field-area tall" value={output.body} readOnly />
      <div className="tag-strip">
        {output.tags.map((tag) => (
          <span key={tag} className="tag-pill">
            {tag}
          </span>
        ))}
      </div>
      <textarea className="field-area short" value={output.prompt} readOnly />
    </section>
  );
}

import test from "node:test";
import assert from "node:assert/strict";
import { createEmptyTemplateDraft, selectTemplateForEdit } from "@/lib/prompt-settings-state";

test("selectTemplateForEdit returns the matching template draft", () => {
  const draft = selectTemplateForEdit({
    templates: [
      {
        id: "wechat-default",
        name: "默认",
        prompt: "prompt",
        updatedAt: "2026-04-03T00:00:00.000Z"
      }
    ],
    templateId: "wechat-default"
  });

  assert.equal(draft.name, "默认");
  assert.equal(draft.prompt, "prompt");
});

test("createEmptyTemplateDraft returns a blank editable draft", () => {
  const draft = createEmptyTemplateDraft();

  assert.equal(draft.name, "");
  assert.equal(draft.prompt, "");
});

import type { PromptTemplate } from "@/lib/prompt-defaults";

export function selectTemplateForEdit({
  templates,
  templateId
}: {
  templates: PromptTemplate[];
  templateId: string;
}) {
  const match = templates.find((item) => item.id === templateId);

  if (!match) {
    throw new Error("Prompt template was not found.");
  }

  return {
    id: match.id,
    name: match.name,
    prompt: match.prompt
  };
}

export function createEmptyTemplateDraft() {
  return {
    id: undefined,
    name: "",
    prompt: ""
  };
}

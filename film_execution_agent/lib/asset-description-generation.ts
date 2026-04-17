export type AssetDescriptionKind = "character" | "scene" | "item";

type AssetDescriptionInput = {
  model: string;
  assetKind: AssetDescriptionKind;
  assetName: string;
  assetDetail: string;
  currentPrompt: string;
  systemPrompt: string;
};

type ProviderTextResponse = {
  choices?: Array<{
    message?: {
      content?: string | Array<{ type?: string; text?: string }>;
    };
  }>;
};

export function buildAssetDescriptionPayload({
  model,
  assetKind,
  assetName,
  assetDetail,
  currentPrompt,
  systemPrompt,
}: AssetDescriptionInput) {
  const userContent = `Asset Type: ${assetKind}
Asset Name: ${assetName}

Existing Asset Detail:
${assetDetail || "(none provided)"}

Current Image Prompt:
${currentPrompt || "(none provided)"}

Please generate a focused production-ready asset description.`;

  return {
    model,
    messages: [
      {
        role: "system" as const,
        content: systemPrompt,
      },
      {
        role: "user" as const,
        content: userContent,
      },
    ],
  };
}

export function extractAssetDescriptionText(response: ProviderTextResponse): string {
  const content = response.choices?.[0]?.message?.content;

  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((block) => (block.type === "text" ? block.text ?? "" : ""))
      .join("")
      .trim();
  }

  throw new Error("Asset description response did not include text.");
}

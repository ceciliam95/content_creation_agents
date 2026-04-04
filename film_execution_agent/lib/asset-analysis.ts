export type DialogueAsset = {
  id: string;
  character: string;
  text: string;
  status: "reuse" | "ready";
};

export type VisualAsset = {
  id: string;
  name: string;
  detail: string;
  status: "reuse" | "ready";
};

export type AssetAnalysisResult = {
  dialogues: DialogueAsset[];
  characters: VisualAsset[];
  scenes: VisualAsset[];
  items: VisualAsset[];
};

type AnalyzeAssetsPayload = {
  model: string;
  temperature: number;
  response_format?: {
    type: "json_object";
  };
  messages: Array<{
    role: "system" | "user";
    content: string;
  }>;
};

type ProviderResponse = {
  choices?: Array<{
    message?: {
      content?:
        | string
        | Array<{
            type?: string;
            text?: string;
          }>;
    };
  }>;
};

type ProviderMessageContent =
  | string
  | Array<{
      type?: string;
      text?: string;
    }>
  | undefined;

const itemCandidates = [
  "coffee",
  "cup",
  "book",
  "letter",
  "ring",
  "gun",
  "phone",
  "camera",
  "bag",
  "key",
  "sword",
  "lamp",
  "train ticket",
];

function unique<T>(items: T[]): T[] {
  return Array.from(new Set(items));
}

function cleanQuotedText(value: string): string {
  return value.replace(/^["“”]+|["“”]+$/g, "").trim();
}

function extractMessageContent(content: ProviderMessageContent): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((block) => (block.type === "text" || !block.type ? block.text ?? "" : ""))
      .join("")
      .trim();
  }

  return "";
}

function normalizeDialogueAsset(asset: Partial<DialogueAsset>, index: number): DialogueAsset {
  return {
    id: asset.id?.trim() || `dialogue-${index + 1}`,
    character: asset.character?.trim() || `Character ${index + 1}`,
    text: asset.text?.trim() || "",
    status: asset.status === "reuse" ? "reuse" : "ready",
  };
}

function normalizeVisualAsset(asset: Partial<VisualAsset>, prefix: string, index: number): VisualAsset {
  return {
    id: asset.id?.trim() || `${prefix}-${index + 1}`,
    name: asset.name?.trim() || `${prefix} ${index + 1}`,
    detail: asset.detail?.trim() || "",
    status: asset.status === "reuse" ? "reuse" : "ready",
  };
}

function extractJsonObject(raw: string): string {
  const trimmed = raw.trim();

  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    return trimmed;
  }

  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");

  if (start >= 0 && end > start) {
    return trimmed.slice(start, end + 1);
  }

  throw new Error("No JSON object was returned by the AI provider.");
}

export function buildAnalyzeAssetsPayload({
  model,
  storyboard,
  systemPrompt,
}: {
  model: string;
  storyboard: string;
  systemPrompt: string;
}): AnalyzeAssetsPayload {
  return {
    model,
    temperature: 0.2,
    response_format: {
      type: "json_object",
    },
    messages: [
      {
        role: "system",
        content: systemPrompt.trim(),
      },
      {
        role: "user",
        content: `Analyze the following storyboard and return the extracted asset list as JSON only.\n\nStoryboard:\n${storyboard.trim()}`,
      },
    ],
  };
}

export function extractAssetAnalysisFromResponse(response: ProviderResponse): AssetAnalysisResult {
  const rawContent = extractMessageContent(response.choices?.[0]?.message?.content);
  const jsonText = extractJsonObject(rawContent);
  const parsed = JSON.parse(jsonText) as Partial<AssetAnalysisResult>;

  return {
    dialogues: (parsed.dialogues ?? []).map((asset, index) =>
      normalizeDialogueAsset(asset, index),
    ),
    characters: (parsed.characters ?? []).map((asset, index) =>
      normalizeVisualAsset(asset, "character", index),
    ),
    scenes: (parsed.scenes ?? []).map((asset, index) =>
      normalizeVisualAsset(asset, "scene", index),
    ),
    items: (parsed.items ?? []).map((asset, index) =>
      normalizeVisualAsset(asset, "item", index),
    ),
  };
}

export function analyzeStoryboardAssets(storyboard: string): AssetAnalysisResult {
  const source = storyboard.trim();

  if (!source) {
    return {
      dialogues: [],
      characters: [],
      scenes: [],
      items: [],
    };
  }

  const peopleMatches = Array.from(
    source.matchAll(/(?:人物|Characters?)[:：]\s*([^\n]+)/gi),
  );
  const sceneMatches = Array.from(
    source.matchAll(/(?:地点|场景|Location|Scene)[:：]\s*([^\n]+)/gi),
  );
  const dialogueMatches = Array.from(
    source.matchAll(/(?:台词(?:（VO）|\(VO\))?|Dialogue|VO)[:：]\s*([^\n]+)/gi),
  );
  const contentMatches = Array.from(
    source.matchAll(/(?:画面内容|Visuals?|Action)[:：]\s*([^\n]+)/gi),
  );

  const characters = unique(
    peopleMatches
      .flatMap((match) => match[1].split(/[，,、]/))
      .map((name) => name.trim())
      .filter(Boolean),
  );

  const scenes = unique(
    sceneMatches.map((match) => match[1].trim()).filter(Boolean),
  );

  const dialogues = dialogueMatches
    .map((match, index) => {
      const text = cleanQuotedText(match[1]);
      const character = characters[index % Math.max(characters.length, 1)] ?? `Character ${index + 1}`;

      return {
        id: `dialogue-${index + 1}`,
        character,
        text,
        status: index % 2 === 0 ? "ready" : "reuse",
      } as DialogueAsset;
    })
    .filter((item) => item.text);

  const visualDescriptions = contentMatches.map((match) => match[1].trim()).filter(Boolean);

  const items = unique(
    itemCandidates.filter((candidate) =>
      source.toLowerCase().includes(candidate.toLowerCase()),
    ),
  );

  return {
    dialogues:
      dialogues.length > 0
        ? dialogues
        : [
            {
              id: "dialogue-1",
              character: characters[0] ?? "Lead Character",
              text: "No dialogue detected yet. Add or refine this after parsing.",
              status: "ready",
            },
          ],
    characters:
      characters.length > 0
        ? characters.map((name, index) => ({
            id: `character-${index + 1}`,
            name,
            detail:
              visualDescriptions[index] ??
              `${name} needs identity-locked visual references and turnaround views.`,
            status: index % 2 === 0 ? "ready" : "reuse",
          }))
        : [
            {
              id: "character-1",
              name: "Lead Character",
              detail: "Primary character reference extracted from the storyboard.",
              status: "ready",
            },
          ],
    scenes:
      scenes.length > 0
        ? scenes.map((name, index) => ({
            id: `scene-${index + 1}`,
            name,
            detail:
              visualDescriptions[index] ??
              `${name} needs an environment reference for downstream generation.`,
            status: index % 2 === 0 ? "ready" : "reuse",
          }))
        : [
            {
              id: "scene-1",
              name: "Primary Scene",
              detail: "Environment reference extracted from the storyboard.",
              status: "ready",
            },
          ],
    items:
      items.length > 0
        ? items.map((name, index) => ({
            id: `item-${index + 1}`,
            name,
            detail: `Key item reference detected from the storyboard: ${name}.`,
            status: index % 2 === 0 ? "ready" : "reuse",
          }))
        : [
            {
              id: "item-1",
              name: "Key Prop",
              detail: "Important production item placeholder for concept generation.",
              status: "ready",
            },
          ],
  };
}

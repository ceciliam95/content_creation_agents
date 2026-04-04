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

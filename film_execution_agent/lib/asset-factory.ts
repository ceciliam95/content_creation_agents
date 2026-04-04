import type { DialogueAsset, VisualAsset } from "./asset-analysis";

export type ManualAssetKind = "dialogue" | "character" | "scene" | "item";

export type ManualAssetListEntry =
  | {
      kind: "dialogue";
      asset: DialogueAsset;
      title: string;
      subtitle: string;
      status: "reuse" | "ready";
    }
  | {
      kind: "character" | "scene" | "item";
      asset: VisualAsset;
      title: string;
      subtitle: string;
      status: "reuse" | "ready";
    };

export function createManualAsset(
  kind: ManualAssetKind,
  index: number,
): ManualAssetListEntry {
  if (kind === "dialogue") {
    return {
      kind,
      asset: {
        id: `dialogue-manual-${index}`,
        character: "VO",
        text: "",
        status: "ready",
      },
      title: "VO",
      subtitle: "Dialogue",
      status: "ready",
    };
  }

  if (kind === "character") {
    return {
      kind,
      asset: {
        id: `character-manual-${index}`,
        name: `New Character ${index}`,
        detail: "",
        status: "ready",
      },
      title: `New Character ${index}`,
      subtitle: "Character",
      status: "ready",
    };
  }

  if (kind === "scene") {
    return {
      kind,
      asset: {
        id: `scene-manual-${index}`,
        name: `New Scene ${index}`,
        detail: "",
        status: "ready",
      },
      title: `New Scene ${index}`,
      subtitle: "Scene",
      status: "ready",
    };
  }

  return {
    kind,
    asset: {
      id: `item-manual-${index}`,
      name: `New Item ${index}`,
      detail: "",
      status: "ready",
    },
    title: `New Item ${index}`,
    subtitle: "Item",
    status: "ready",
  };
}

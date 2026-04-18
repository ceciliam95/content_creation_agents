"use client";

import { type DragEvent, type ReactElement, useEffect, useRef, useState } from "react";
import {
  type AssetAnalysisResult,
  type DialogueAsset,
  type VisualAsset,
} from "@/lib/asset-analysis";
import {
  createManualAsset,
  type ManualAssetKind,
} from "@/lib/asset-factory";
import { getDefaultSystemPrompt } from "@/lib/default-prompts";
import {
  DEFAULT_DIALOGUE_VOICE_ID,
  createDialogueAudioFilename,
} from "@/lib/dialogue-tts";
import { DEFAULT_PROJECT_ROOT_FOLDER } from "@/lib/local-project-storage-config";
import {
  isVideoProjectFile,
  type VideoClipSelection,
} from "@/lib/video-editing-shared";

const sampleScript = `5 a.m. The city is not fully awake yet. She stands outside a corner convenience store holding a hot coffee, watching the bus stop across the street. The wind lifts her hair as a bus slowly approaches in the distance.`;
const sampleStoryboardAssetInput = `SCENE 1

人物：Eleanor, Duke
地点：Study（书房）

1
景别：Close-up
构图：Eleanor面部居中，背景书架虚化
运镜：轻推镜
机位：平视
光影：冷光
画面内容：Eleanor缓慢抬头直视前方，双手在胸前交握后慢慢收紧，桌面上放着一封拆开的信和一只咖啡杯。
台词（VO）："Eleanor Hackket is the daughter of an Earl."

SCENE 2

人物：Duke
地点：Hallway（走廊）

1
景别：Medium Shot
构图：Duke靠墙站立，画面右侧留白
运镜：静止
机位：平视
光影：暖灰侧光
画面内容：Duke低头看向手中的旧钥匙，走廊尽头有一盏昏黄台灯。
台词（VO）："We do not have much time left."`;

type TabKey = "scenes" | "video" | "assets" | "editing";
type AssetKind = "dialogue" | "character" | "scene" | "item";
type AssetListEntry =
  | { kind: "dialogue"; id: string; title: string; subtitle: string; status: "reuse" | "ready"; asset: DialogueAsset }
  | { kind: "character" | "scene" | "item"; id: string; title: string; subtitle: string; status: "reuse" | "ready"; asset: VisualAsset };
type DialogueAudioResult = {
  url: string;
  filename: string;
};
type GeneratedImageResult = {
  model: string;
  status: "completed" | "processing" | "failed";
  url: string;
  filename: string;
  taskId?: string;
  error?: string;
  diagnostics?: ImageGenerationDiagnostics;
  seed?: number;
  inferenceMs?: number;
};
type ImageGenerationDiagnostics = {
  provider?: string;
  endpoint?: string;
  httpStatus?: number;
  responseShape?: {
    topLevelKeys?: string[];
    hasImageUrlCandidate?: boolean;
    hasBase64Candidate?: boolean;
    idCandidate?: string;
    sampleImageUrlCandidate?: string;
    sampleBase64Candidate?: string;
  };
};
type SaveDraft = {
  name: string;
  path: string;
};
type SaveTarget = {
  panelKey: string;
  title: string;
  defaultName: string;
  defaultPath: string;
  extension: string;
  source:
    | {
        type: "text";
        content: string;
      }
    | {
        type: "blob-url";
        url: string;
      }
    | {
        type: "remote-url";
        url: string;
      };
};
type ProjectFileNode = {
  name: string;
  relativePath: string;
  kind: "directory" | "file";
  children?: ProjectFileNode[];
};
type RoughCutResult = {
  status: "ready";
  message: string;
  clipCount: number;
  fileName: string;
  fileId: string;
  previewUrl: string;
  downloadUrl: string;
  defaultFolder: string;
  aspectRatio: "16:9" | "9:16";
};
type PromptTemplate = {
  fileName: string;
  content: string;
};
type PromptLibraryKind = "image" | "description";
type PromptSaveDraft = {
  fileName: string;
};
type PromptSaveState = "idle" | "saved";
type ImageModelConfig = {
  mode: "text_to_image" | "image_to_image";
  models: string[];
  size: string;
  aspectRatio: string;
  outputFormat: string;
};
type ReferenceImage = {
  id: string;
  name: string;
  source: "upload" | "project";
  dataUrl?: string;
  previewUrl?: string;
  path?: string;
};

const emptyAssetAnalysis: AssetAnalysisResult = {
  dialogues: [],
  characters: [],
  scenes: [],
  items: [],
};

const defaultImageModelConfig: ImageModelConfig = {
  mode: "text_to_image",
  models: ["gemini-3.1-flash-image-preview"],
  size: "1K",
  aspectRatio: "1:1",
  outputFormat: "png",
};

const imageModelOptions = [
  {
    label: "Gemini 3.1 Flash Image Preview",
    value: "gemini-3.1-flash-image-preview",
  },
  {
    label: "Grok Imagine Image",
    value: "grok-imagine-image",
  },
  {
    label: "Midjourney",
    value: "midjourney",
  },
  {
    label: "Vidu Q2",
    value: "viduq2",
  },
];
const imageToImageModelOptions = imageModelOptions.filter((option) =>
  ["gemini-3.1-flash-image-preview", "midjourney"].includes(option.value),
);

const imageSizeOptions = ["1K", "2K"];
const imageAspectRatioOptions = ["1:1", "16:9", "9:16", "4:3", "3:4"];
const imageOutputFormatOptions = ["png", "jpg", "webp"];
const imageGenerationModeOptions = [
  {
    label: "Text to Image",
    value: "text_to_image",
    disabled: false,
  },
  {
    label: "Image to Image (Paused)",
    value: "image_to_image",
    disabled: true,
  },
] as const;

function getImageModelLabel(model: string) {
  return imageModelOptions.find((option) => option.value === model)?.label ?? model;
}

function getImageModelOptionsForMode(mode: ImageModelConfig["mode"]) {
  return mode === "image_to_image" ? imageToImageModelOptions : imageModelOptions;
}

function getDefaultImageModelsForMode(mode: ImageModelConfig["mode"]) {
  return mode === "image_to_image"
    ? ["gemini-3.1-flash-image-preview"]
    : defaultImageModelConfig.models;
}

function formatImageDiagnostics(diagnostics?: ImageGenerationDiagnostics) {
  if (!diagnostics) {
    return "";
  }

  const responseShape = diagnostics.responseShape;
  const parts = [
    diagnostics.provider ? `Provider: ${diagnostics.provider}` : "",
    typeof diagnostics.httpStatus === "number" ? `HTTP: ${diagnostics.httpStatus}` : "",
    responseShape?.topLevelKeys?.length
      ? `Keys: ${responseShape.topLevelKeys.join(", ")}`
      : "",
    typeof responseShape?.hasImageUrlCandidate === "boolean"
      ? `Image URL candidate: ${responseShape.hasImageUrlCandidate ? "yes" : "no"}`
      : "",
    typeof responseShape?.hasBase64Candidate === "boolean"
      ? `Base64 candidate: ${responseShape.hasBase64Candidate ? "yes" : "no"}`
      : "",
    responseShape?.idCandidate ? `ID: ${responseShape.idCandidate}` : "",
    responseShape?.sampleImageUrlCandidate
      ? `Sample URL: ${responseShape.sampleImageUrlCandidate}`
      : "",
    responseShape?.sampleBase64Candidate
      ? `Sample base64: ${responseShape.sampleBase64Candidate}`
      : "",
  ].filter(Boolean);

  return parts.join(" | ");
}

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>("scenes");
  const [script, setScript] = useState(sampleScript);
  const [sceneText, setSceneText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(() =>
    getDefaultSystemPrompt("script_to_scenes"),
  );
  const [generationError, setGenerationError] = useState("");
  const [assetStoryboard, setAssetStoryboard] = useState(sampleStoryboardAssetInput);
  const [assetAnalysis, setAssetAnalysis] = useState<AssetAnalysisResult>(emptyAssetAnalysis);
  const [manualAssets, setManualAssets] = useState<AssetListEntry[]>([]);
  const [hasAnalyzedAssets, setHasAnalyzedAssets] = useState(false);
  const [isAnalyzingAssets, setIsAnalyzingAssets] = useState(false);
  const [assetAnalysisError, setAssetAnalysisError] = useState("");
  const [showAnalyzePrompt, setShowAnalyzePrompt] = useState(false);
  const [analyzeSystemPrompt, setAnalyzeSystemPrompt] = useState(() =>
    getDefaultSystemPrompt("analyze_assets"),
  );
  const [selectedAssetKey, setSelectedAssetKey] = useState("");
  const [reusedAssetKeys, setReusedAssetKeys] = useState<string[]>([]);
  const [assetPromptDrafts, setAssetPromptDrafts] = useState<Record<string, string>>({});
  const [imageModelConfigs, setImageModelConfigs] = useState<Record<string, ImageModelConfig>>({});
  const [showImageModelSettingsKey, setShowImageModelSettingsKey] = useState("");
  const [referenceImages, setReferenceImages] = useState<Record<string, ReferenceImage[]>>({});
  const [assetDescriptionDrafts, setAssetDescriptionDrafts] = useState<Record<string, string>>({});
  const [descriptionPromptDrafts, setDescriptionPromptDrafts] = useState<Record<"character" | "scene" | "item", string>>({
    character:
      "Generate a concise production-ready character description covering appearance, clothing, identity cues, mood, and image-generation-relevant details.",
    scene:
      "Generate a concise production-ready scene description covering environment style, layout, lighting, materials, atmosphere, and key visual elements.",
    item:
      "Generate a concise production-ready item description covering shape, material, scale, silhouette, function, and image-generation-relevant details.",
  });
  const [showDescriptionPrompt, setShowDescriptionPrompt] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [descriptionGenerationError, setDescriptionGenerationError] = useState("");
  const [dialogueDrafts, setDialogueDrafts] = useState<Record<string, string>>({});
  const [dialogueOriginals, setDialogueOriginals] = useState<Record<string, string>>({});
  const [dialogueVoiceIds, setDialogueVoiceIds] = useState<Record<string, string>>({});
  const [dialogueAudioResults, setDialogueAudioResults] = useState<
    Record<string, DialogueAudioResult>
  >({});
  const [imageGenerationResults, setImageGenerationResults] = useState<
    Record<string, GeneratedImageResult[]>
  >({});
  const [showVoiceTaggingPrompt, setShowVoiceTaggingPrompt] = useState(false);
  const [voiceTaggingSystemPrompt, setVoiceTaggingSystemPrompt] = useState(() =>
    getDefaultSystemPrompt("voice_tagging"),
  );
  const [isVoiceTagging, setIsVoiceTagging] = useState(false);
  const [voiceTaggingError, setVoiceTaggingError] = useState("");
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [ttsError, setTtsError] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [imageGenerationError, setImageGenerationError] = useState("");
  const [checkingImageStatusKeys, setCheckingImageStatusKeys] = useState<string[]>([]);
  const dialogueAudioResultsRef = useRef<Record<string, DialogueAudioResult>>({});
  const [isProjectSidebarCollapsed, setIsProjectSidebarCollapsed] = useState(false);
  const [projectTreeOpen, setProjectTreeOpen] = useState(true);
  const [projectRootInput, setProjectRootInput] = useState(DEFAULT_PROJECT_ROOT_FOLDER);
  const [projectRootPath, setProjectRootPath] = useState(DEFAULT_PROJECT_ROOT_FOLDER);
  const [projectTree, setProjectTree] = useState<ProjectFileNode | null>(null);
  const [openProjectNodePaths, setOpenProjectNodePaths] = useState<Record<string, boolean>>({});
  const [isRefreshingProjectTree, setIsRefreshingProjectTree] = useState(false);
  const [projectTreeError, setProjectTreeError] = useState("");
  const [isPromptSidebarCollapsed, setIsPromptSidebarCollapsed] = useState(false);
  const [promptLibraryCollapsed, setPromptLibraryCollapsed] = useState(false);
  const [descriptionPromptLibraryCollapsed, setDescriptionPromptLibraryCollapsed] = useState(false);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [descriptionPromptTemplates, setDescriptionPromptTemplates] = useState<PromptTemplate[]>([]);
  const [isLoadingPromptTemplates, setIsLoadingPromptTemplates] = useState(false);
  const [promptLibraryError, setPromptLibraryError] = useState("");
  const [promptSaveStates, setPromptSaveStates] = useState<Record<string, PromptSaveState>>({});
  const [activePromptSaveAssetKey, setActivePromptSaveAssetKey] = useState("");
  const [promptSaveDrafts, setPromptSaveDrafts] = useState<Record<string, PromptSaveDraft>>({});
  const [saveDrafts, setSaveDrafts] = useState<Record<string, SaveDraft>>({});
  const [activeSavePanelKey, setActiveSavePanelKey] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");
  const [selectedVideoClips, setSelectedVideoClips] = useState<VideoClipSelection[]>([]);
  const [roughCutAspectRatio, setRoughCutAspectRatio] = useState<"16:9" | "9:16">("16:9");
  const [isCombiningVideos, setIsCombiningVideos] = useState(false);
  const [videoEditingError, setVideoEditingError] = useState("");
  const [roughCutResult, setRoughCutResult] = useState<RoughCutResult | null>(null);

  useEffect(() => {
    dialogueAudioResultsRef.current = dialogueAudioResults;
  }, [dialogueAudioResults]);

  useEffect(() => {
    return () => {
      Object.values(dialogueAudioResultsRef.current).forEach((result) => {
        URL.revokeObjectURL(result.url);
      });
    };
  }, []);

  useEffect(() => {
    void refreshProjectTree(DEFAULT_PROJECT_ROOT_FOLDER);
  }, []);

  useEffect(() => {
    void refreshPromptTemplates();
  }, []);

  async function handleGenerate() {
    if (!script.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setHasGenerated(false);
    setSceneText("");
    setGenerationError("");

    try {
      const response = await fetch("/api/generate-scenes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          script,
          systemPrompt,
        }),
      });

      const data = (await response.json()) as {
        sceneText?: string;
        error?: string;
      };

      if (!response.ok || !data.sceneText) {
        throw new Error(data.error ?? "Scene generation failed.");
      }

      setSceneText(data.sceneText);
      setHasGenerated(true);
      setCopyState("idle");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Scene generation failed.";

      setGenerationError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleCopy() {
    if (!sceneText) {
      return;
    }

    await navigator.clipboard.writeText(sceneText);
    setCopyState("copied");

    window.setTimeout(() => {
      setCopyState("idle");
    }, 1600);
  }

  function handleDownload() {
    if (!sceneText) {
      return;
    }

    const blob = new Blob([sceneText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scene-text.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleAnalyzeAssets() {
    if (!assetStoryboard.trim() || isAnalyzingAssets) {
      return;
    }

    setIsAnalyzingAssets(true);
    setAssetAnalysisError("");

    try {
      const response = await fetch("/api/analyze-assets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storyboard: assetStoryboard,
          systemPrompt: analyzeSystemPrompt,
        }),
      });

      const data = (await response.json()) as AssetAnalysisResult & {
        error?: string;
      };

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Asset analysis failed.");
      }

      const result: AssetAnalysisResult = {
        dialogues: data.dialogues ?? [],
        characters: data.characters ?? [],
        scenes: data.scenes ?? [],
        items: data.items ?? [],
      };

      setAssetAnalysis(result);
      setHasAnalyzedAssets(true);
      setManualAssets([]);
      setReusedAssetKeys([]);
      setAssetPromptDrafts({});
      setImageModelConfigs({});
      setReferenceImages({});
      setAssetDescriptionDrafts({});
      setDialogueDrafts({});
      setDialogueVoiceIds({});
      setImageGenerationResults({});
      setDialogueAudioResults((current) => {
        Object.values(current).forEach((result) => {
          URL.revokeObjectURL(result.url);
        });
        return {};
      });
      setDialogueOriginals(
        Object.fromEntries(
          result.dialogues.map((asset) => [`dialogue:${asset.id}`, asset.text]),
        ),
      );
      setVoiceTaggingError("");
      setTtsError("");

      const firstDialogue = result.dialogues[0];
      const firstCharacter = result.characters[0];
      const firstScene = result.scenes[0];
      const firstItem = result.items[0];
      const firstAssetKey = firstDialogue
        ? `dialogue:${firstDialogue.id}`
        : firstCharacter
          ? `character:${firstCharacter.id}`
          : firstScene
            ? `scene:${firstScene.id}`
            : firstItem
              ? `item:${firstItem.id}`
              : "";
      setSelectedAssetKey(firstAssetKey);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Asset analysis failed.";

      setAssetAnalysisError(message);
    } finally {
      setIsAnalyzingAssets(false);
    }
  }

  async function handleCopyDialogue(asset: DialogueAsset) {
    await navigator.clipboard.writeText(asset.text);
  }

  function handleDownloadText(filename: string, content: string) {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function handleDownloadBlobUrl(filename: string, blobUrl: string) {
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    link.click();
  }

  function createSaveTargetFromSceneText(): SaveTarget {
    return {
      panelKey: "script-to-scenes:scene-text",
      title: "Save this scene text",
      defaultName: "scene text",
      defaultPath: `${projectRootPath}\\剧情设计`,
      extension: "txt",
      source: {
        type: "text",
        content: sceneText,
      },
    };
  }

  function createSaveTargetFromAsset(asset: AssetListEntry): SaveTarget {
    const relativeBasePath =
      asset.kind === "dialogue"
        ? "assets/vo/"
        : asset.kind === "character"
          ? "assets/characters/"
          : asset.kind === "scene"
            ? "assets/scenes/"
            : "assets/items/";

    return {
      panelKey: `${asset.kind}:${asset.id}:source`,
      title: asset.kind === "dialogue" ? "Save this VO asset" : "Save this visual asset",
      defaultName: asset.kind === "dialogue" ? `${asset.asset.character} VO` : asset.title,
      defaultPath: `${projectRootPath}\\${relativeBasePath.replace(/\//g, "\\")}`,
      extension: "txt",
      source: {
        type: "text",
        content:
          asset.kind === "dialogue"
            ? dialogueDrafts[`${asset.kind}:${asset.id}`] ?? asset.asset.text
            : assetPromptDrafts[`${asset.kind}:${asset.id}`] ??
              `${asset.title}\n${asset.asset.detail}`,
      },
    };
  }

  function createSaveTargetFromDialogueAudio(asset: AssetListEntry): SaveTarget {
    return {
      panelKey: `${asset.kind}:${asset.id}:audio`,
      title: "Save this generated audio",
      defaultName:
        asset.kind === "dialogue" ? `${asset.asset.character} TTS` : `${asset.title} TTS`,
      defaultPath: `${projectRootPath}\\assets\\vo`,
      extension: "mp3",
      source: {
        type: "blob-url",
        url: dialogueAudioResults[`${asset.kind}:${asset.id}`]?.url ?? "",
      },
    };
  }

  function createSaveTargetFromGeneratedImage(asset: AssetListEntry): SaveTarget {
    const imageResult = imageGenerationResults[`${asset.kind}:${asset.id}`]?.find(
      (result) => result.status === "completed" && result.url,
    );
    const relativeBasePath =
      asset.kind === "character"
        ? "assets\\characters"
        : asset.kind === "scene"
          ? "assets\\scenes"
          : "assets\\items";

    return {
      panelKey: `${asset.kind}:${asset.id}:image`,
      title: "Save this generated image",
      defaultName: `${asset.title} image`,
      defaultPath: `${projectRootPath}\\${relativeBasePath}`,
      extension: "png",
      source: {
        type: "remote-url",
        url: imageResult?.url ?? "",
      },
    };
  }

  function createSaveTargetFromGeneratedImageResult(
    asset: AssetListEntry,
    imageResult: GeneratedImageResult,
  ): SaveTarget {
    const relativeBasePath =
      asset.kind === "character"
        ? "assets\\characters"
        : asset.kind === "scene"
          ? "assets\\scenes"
          : "assets\\items";

    return {
      panelKey: `${asset.kind}:${asset.id}:image:${imageResult.model}`,
      title: `Save ${getImageModelLabel(imageResult.model)} image`,
      defaultName: `${asset.title} ${getImageModelLabel(imageResult.model)} image`,
      defaultPath: `${projectRootPath}\\${relativeBasePath}`,
      extension: "png",
      source: {
        type: "remote-url",
        url: imageResult.url,
      },
    };
  }

  function createSaveTargetFromRoughCut(result: RoughCutResult): SaveTarget {
    return {
      panelKey: `video-editing:rough-cut:${result.fileId}`,
      title: "Save this rough cut",
      defaultName: result.fileName.replace(/\.mp4$/i, ""),
      defaultPath: `${projectRootPath}\\rough_cuts`,
      extension: "mp4",
      source: {
        type: "remote-url",
        url: result.downloadUrl,
      },
    };
  }

  function getDefaultSaveDraft(target: SaveTarget): SaveDraft {
    return {
      name: target.defaultName,
      path: target.defaultPath,
    };
  }

  function updateSaveDraft(panelKey: string, field: keyof SaveDraft, value: string) {
    setSaveDrafts((current) => ({
      ...current,
      [panelKey]: {
        ...(current[panelKey] ?? { name: "", path: "" }),
        [field]: value,
      },
    }));
  }

  function openSavePanel(target: SaveTarget) {
    setSaveDrafts((current) => ({
      ...current,
      [target.panelKey]: current[target.panelKey] ?? getDefaultSaveDraft(target),
    }));
    setActiveSavePanelKey(target.panelKey);
  }

  async function blobUrlToBase64(blobUrl: string): Promise<string> {
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";

    bytes.forEach((value) => {
      binary += String.fromCharCode(value);
    });

    return btoa(binary);
  }

  async function refreshProjectTree(rootPath: string) {
    setIsRefreshingProjectTree(true);
    setProjectTreeError("");

    try {
      const response = await fetch("/api/project-files", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rootPath }),
      });

      const data = (await response.json()) as {
        tree?: ProjectFileNode;
        error?: string;
      };

      if (!response.ok || !data.tree) {
        throw new Error(data.error ?? "Failed to load the project folder.");
      }

      const tree = data.tree;

      setProjectTree(tree);
      setProjectRootPath(rootPath);
      setOpenProjectNodePaths((current) => ({
        ...current,
        [tree.relativePath || "__root__"]: true,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load the project folder.";

      setProjectTreeError(message);
    } finally {
      setIsRefreshingProjectTree(false);
    }
  }

  async function refreshPromptTemplates() {
    setIsLoadingPromptTemplates(true);
    setPromptLibraryError("");

    try {
      const [imageResponse, descriptionResponse] = await Promise.all([
        fetch("/api/prompt-library?library=image", {
          method: "GET",
        }),
        fetch("/api/prompt-library?library=description", {
          method: "GET",
        }),
      ]);

      const imageData = (await imageResponse.json()) as {
        templates?: PromptTemplate[];
        error?: string;
      };
      const descriptionData = (await descriptionResponse.json()) as {
        templates?: PromptTemplate[];
        error?: string;
      };

      if (!imageResponse.ok || !imageData.templates) {
        throw new Error(imageData.error ?? "Failed to load image prompt templates.");
      }

      if (!descriptionResponse.ok || !descriptionData.templates) {
        throw new Error(
          descriptionData.error ?? "Failed to load description prompt templates.",
        );
      }

      setPromptTemplates(imageData.templates);
      setDescriptionPromptTemplates(descriptionData.templates);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load prompt templates.";

      setPromptLibraryError(message);
    } finally {
      setIsLoadingPromptTemplates(false);
    }
  }

  async function handleSetProjectRoot() {
    const trimmed = projectRootInput.trim();

    if (!trimmed) {
      return;
    }

    await refreshProjectTree(trimmed);
  }

  async function handleDeletePromptTemplate(
    fileName: string,
    library: PromptLibraryKind = "image",
  ) {
    setPromptLibraryError("");

    try {
      const response = await fetch("/api/prompt-library", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName, library }),
      });

      const data = (await response.json()) as {
        deleted?: boolean;
        error?: string;
      };

      if (!response.ok || !data.deleted) {
        throw new Error(data.error ?? "Failed to delete the prompt template.");
      }

      if (library === "description") {
        setDescriptionPromptTemplates((current) =>
          current.filter((template) => template.fileName !== fileName),
        );
      } else {
        setPromptTemplates((current) =>
          current.filter((template) => template.fileName !== fileName),
        );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to delete the prompt template.";

      setPromptLibraryError(message);
    }
  }

  async function handleSaveTarget(target: SaveTarget) {
    const draft = saveDrafts[target.panelKey] ?? getDefaultSaveDraft(target);
    const trimmedName = draft.name.trim();
    const trimmedPath = draft.path.trim();

    if (!trimmedName || !trimmedPath) {
      return;
    }

    setSaveError("");
    setSaveSuccessMessage("");

    try {
      const payload =
        target.source.type === "text"
          ? {
              rootPath: projectRootPath,
              relativeFolder: trimmedPath,
              fileName: trimmedName,
              extension: target.extension,
              textContent: target.source.content,
            }
          : target.source.type === "blob-url"
            ? {
                rootPath: projectRootPath,
                relativeFolder: trimmedPath,
                fileName: trimmedName,
                extension: target.extension,
                base64Content: await blobUrlToBase64(target.source.url),
              }
            : {
                rootPath: projectRootPath,
                relativeFolder: trimmedPath,
                fileName: trimmedName,
                extension: target.extension,
                remoteUrl: target.source.url,
              };

      const response = await fetch("/api/project-save", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = (await response.json()) as {
        saved?: boolean;
        relativeFilePath?: string;
        error?: string;
      };

      if (!response.ok || !data.saved) {
        throw new Error(data.error ?? "Failed to save the asset.");
      }

      setSaveSuccessMessage(`Saved to ${data.relativeFilePath}`);
      setProjectTreeOpen(true);
      setActiveSavePanelKey("");
      await refreshProjectTree(projectRootPath);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save the asset.";

      setSaveError(message);
    }
  }

  function renderSavePanel(target: SaveTarget) {
    return (
      <div className="save-panel">
        <div className="save-panel-header">
          <div>
            <span className="panel-label">Save to Project</span>
            <h4>{target.title}</h4>
          </div>
        </div>
        <div className="save-form-grid">
          <label className="save-field">
            <span>Asset name</span>
            <input
              type="text"
              className="workspace-input"
              value={
                saveDrafts[target.panelKey]?.name ??
                getDefaultSaveDraft(target).name
              }
              onChange={(event) =>
                updateSaveDraft(target.panelKey, "name", event.target.value)
              }
            />
          </label>
          <label className="save-field">
            <span>Path</span>
            <input
              type="text"
              className="workspace-input"
              value={
                saveDrafts[target.panelKey]?.path ??
                getDefaultSaveDraft(target).path
              }
              onChange={(event) =>
                updateSaveDraft(target.panelKey, "path", event.target.value)
              }
            />
          </label>
        </div>
        <div className="save-panel-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setActiveSavePanelKey("")}
          >
            Cancel
          </button>
          <button
            type="button"
            className="secondary-button save-confirm-button"
            onClick={() => handleSaveTarget(target)}
          >
            Confirm Save
          </button>
        </div>
      </div>
    );
  }

  function renderProjectTree(node: ProjectFileNode): ReactElement {
    const nodeKey = node.relativePath || "__root__";
    const isOpen = openProjectNodePaths[nodeKey] ?? true;

    return (
      <div className="project-asset-section" key={`${node.kind}:${node.relativePath || node.name}`}>
        <button
          type="button"
          className="project-tree-node nested directory-node"
          onClick={() =>
            setOpenProjectNodePaths((current) => ({
              ...current,
              [nodeKey]: !isOpen,
            }))
          }
        >
          <span>{isOpen ? "−" : "+"}</span>
          <strong>{node.name}</strong>
          <em>{node.children?.length ?? 0}</em>
        </button>
        <div className="project-asset-item path-meta">
          <span>{node.relativePath || projectRootPath}</span>
        </div>
        {node.kind === "directory" && node.children?.length ? (
          <div className={isOpen ? "project-asset-list" : "project-asset-list hidden"}>
            {node.children.map((child) =>
              child.kind === "directory" ? (
                renderProjectTree(child)
              ) : (
                (() => {
                  const isVideoFile = isVideoProjectFile(child.name);
                  const isSelectedVideo = selectedVideoClips.some(
                    (clip) => clip.relativePath === child.relativePath,
                  );

                  return (
                <div
                  key={`${child.kind}:${child.relativePath}`}
                  className={
                    isSelectedVideo
                      ? "project-asset-item file video-selected"
                      : "project-asset-item file"
                  }
                  draggable
                  onDragStart={(event) => {
                    event.dataTransfer.setData(
                      "application/json",
                      JSON.stringify({
                        name: child.name,
                        relativePath: child.relativePath,
                        kind: child.kind,
                      }),
                    );
                    event.dataTransfer.setData("text/plain", child.relativePath);
                    event.dataTransfer.effectAllowed = "copy";
                  }}
                >
                  <div className="project-file-row">
                    {isVideoFile ? (
                      <label
                        className="project-video-checkbox"
                        onClick={(event) => event.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelectedVideo}
                          onChange={() => toggleVideoClip(child)}
                        />
                        <span>Select</span>
                      </label>
                    ) : null}
                    <strong>{child.name}</strong>
                  </div>
                  <span>{child.relativePath}</span>
                </div>
                  );
                })()
              ),
            )}
          </div>
        ) : null}
      </div>
    );
  }

  function toggleVideoClip(file: ProjectFileNode) {
    if (file.kind !== "file" || !isVideoProjectFile(file.name)) {
      return;
    }

    setSelectedVideoClips((current) =>
      current.some((clip) => clip.relativePath === file.relativePath)
        ? current.filter((clip) => clip.relativePath !== file.relativePath)
        : [...current, { name: file.name, relativePath: file.relativePath }],
    );
    setRoughCutResult(null);
    setVideoEditingError("");
  }

  function removeVideoClip(relativePath: string) {
    setSelectedVideoClips((current) =>
      current.filter((clip) => clip.relativePath !== relativePath),
    );
    setRoughCutResult(null);
  }

  function moveVideoClip(index: number, direction: -1 | 1) {
    setSelectedVideoClips((current) => {
      const nextIndex = index + direction;

      if (nextIndex < 0 || nextIndex >= current.length) {
        return current;
      }

      const next = [...current];
      const [clip] = next.splice(index, 1);
      next.splice(nextIndex, 0, clip);
      return next;
    });
    setRoughCutResult(null);
  }

  async function handleCombineVideos() {
    if (!selectedVideoClips.length || isCombiningVideos) {
      return;
    }

    setIsCombiningVideos(true);
    setVideoEditingError("");
    setRoughCutResult(null);

    try {
      const response = await fetch("/api/video-editing/rough-cut", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          rootPath: projectRootPath,
          clips: selectedVideoClips,
          aspectRatio: roughCutAspectRatio,
        }),
      });
      const data = (await response.json()) as RoughCutResult & { error?: string };

      if (!response.ok || data.error) {
        throw new Error(data.error ?? "Failed to prepare the rough cut.");
      }

      setRoughCutResult({
        status: data.status,
        message: data.message,
        clipCount: data.clipCount,
        fileName: data.fileName,
        fileId: data.fileId,
        previewUrl: data.previewUrl,
        downloadUrl: data.downloadUrl,
        defaultFolder: data.defaultFolder,
        aspectRatio: data.aspectRatio,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to prepare the rough cut.";

      setVideoEditingError(message);
    } finally {
      setIsCombiningVideos(false);
    }
  }

  function toggleReuse(assetKey: string) {
    setReusedAssetKeys((current) =>
      current.includes(assetKey)
        ? current.filter((item) => item !== assetKey)
        : [...current, assetKey],
    );
  }

  function updateAssetPromptDraft(assetKey: string, value: string) {
    setAssetPromptDrafts((current) => ({
      ...current,
      [assetKey]: value,
    }));
  }

  function updateImageModelConfig(
    assetKey: string,
    field: keyof ImageModelConfig,
    value: ImageModelConfig[keyof ImageModelConfig],
  ) {
    setImageModelConfigs((current) => ({
      ...current,
      [assetKey]: {
        ...(current[assetKey] ?? defaultImageModelConfig),
        [field]: value,
      },
    }));
  }

  function updateImageGenerationMode(
    assetKey: string,
    mode: ImageModelConfig["mode"],
  ) {
    setImageModelConfigs((current) => ({
      ...current,
      [assetKey]: {
        ...(current[assetKey] ?? defaultImageModelConfig),
        mode,
        models: getDefaultImageModelsForMode(mode),
      },
    }));
  }

  function toggleImageModel(assetKey: string, model: string) {
    setImageModelConfigs((current) => {
      const currentConfig = current[assetKey] ?? defaultImageModelConfig;
      const availableModels = getImageModelOptionsForMode(currentConfig.mode).map(
        (option) => option.value,
      );

      if (!availableModels.includes(model)) {
        return current;
      }

      const currentModels = currentConfig.models.length
        ? currentConfig.models
        : defaultImageModelConfig.models;
      const nextModels = currentModels.includes(model)
        ? currentModels.filter((item) => item !== model)
        : [...currentModels, model];

      return {
        ...current,
        [assetKey]: {
          ...currentConfig,
          models: nextModels.length
            ? nextModels
            : getDefaultImageModelsForMode(currentConfig.mode),
        },
      };
    });
  }

  function addReferenceImage(assetKey: string, image: ReferenceImage) {
    setReferenceImages((current) => ({
      ...current,
      [assetKey]: [...(current[assetKey] ?? []), image],
    }));
  }

  function removeReferenceImage(assetKey: string, imageId: string) {
    setReferenceImages((current) => {
      const targetImage = (current[assetKey] ?? []).find((image) => image.id === imageId);

      if (targetImage?.previewUrl) {
        URL.revokeObjectURL(targetImage.previewUrl);
      }

      return {
        ...current,
        [assetKey]: (current[assetKey] ?? []).filter((image) => image.id !== imageId),
      };
    });
  }

  function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error("Failed to read the reference image."));
      reader.readAsDataURL(file);
    });
  }

  async function handleReferenceUpload(assetKey: string, files: FileList | null) {
    if (!files?.length) {
      return;
    }

    const uploadedImages = await Promise.all(
      Array.from(files).map(async (file) => ({
        id: `upload-${Date.now()}-${file.name}`,
        name: file.name,
        source: "upload" as const,
        dataUrl: await fileToDataUrl(file),
        previewUrl: URL.createObjectURL(file),
      })),
    );

    uploadedImages.forEach((image) => {
      addReferenceImage(assetKey, {
        ...image,
      });
    });
  }

  function handleReferenceDrop(
    event: DragEvent<HTMLDivElement>,
    assetKey: string,
  ) {
    event.preventDefault();
    const projectPayload = event.dataTransfer.getData("application/json");

    if (projectPayload) {
      try {
        const parsed = JSON.parse(projectPayload) as {
          name?: string;
          relativePath?: string;
        };

        if (parsed.name || parsed.relativePath) {
          addReferenceImage(assetKey, {
            id: `project-${Date.now()}-${parsed.relativePath ?? parsed.name}`,
            name: parsed.name ?? parsed.relativePath ?? "Project asset",
            source: "project",
            path: parsed.relativePath,
          });
          return;
        }
      } catch {
        // Fall through to plain text handling.
      }
    }

    const plainText = event.dataTransfer.getData("text/plain");

    if (plainText) {
      addReferenceImage(assetKey, {
        id: `project-${Date.now()}-${plainText}`,
        name: plainText.split(/[\\/]/).pop() || plainText,
        source: "project",
        path: plainText,
      });
    }
  }

  function updateAssetDescriptionDraft(assetKey: string, value: string) {
    setAssetDescriptionDrafts((current) => ({
      ...current,
      [assetKey]: value,
    }));
  }

  async function handleDescriptionGeneration(
    assetKey: string,
    asset: AssetListEntry,
    currentPrompt: string,
    systemPrompt: string,
  ) {
    if (asset.kind === "dialogue" || isGeneratingDescription) {
      return;
    }

    setIsGeneratingDescription(true);
    setDescriptionGenerationError("");

    try {
      const response = await fetch("/api/asset-description-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          assetKind: asset.kind,
          assetName: asset.title,
          assetDetail: asset.asset.detail,
          currentPrompt,
          systemPrompt,
        }),
      });

      const data = (await response.json()) as {
        description?: string;
        error?: string;
      };

      if (!response.ok || !data.description) {
        throw new Error(data.error ?? "Description generation failed.");
      }

      updateAssetDescriptionDraft(assetKey, data.description);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Description generation failed.";

      setDescriptionGenerationError(message);
    } finally {
      setIsGeneratingDescription(false);
    }
  }

  function updateDialogueDraft(assetKey: string, value: string) {
    setDialogueDrafts((current) => ({
      ...current,
      [assetKey]: value,
    }));
  }

  function buildAssetListEntries(analysis: AssetAnalysisResult): AssetListEntry[] {
    return [
      ...analysis.dialogues.map((asset) => ({
        kind: "dialogue" as const,
        id: asset.id,
        title: asset.character,
        subtitle: "Dialogue",
        status: asset.status,
        asset,
      })),
      ...analysis.characters.map((asset) => ({
        kind: "character" as const,
        id: asset.id,
        title: asset.name,
        subtitle: "Character",
        status: asset.status,
        asset,
      })),
      ...analysis.scenes.map((asset) => ({
        kind: "scene" as const,
        id: asset.id,
        title: asset.name,
        subtitle: "Scene",
        status: asset.status,
        asset,
      })),
      ...analysis.items.map((asset) => ({
        kind: "item" as const,
        id: asset.id,
        title: asset.name,
        subtitle: "Item",
        status: asset.status,
        asset,
      })),
    ];
  }

  function buildPrototypePrompt(asset: AssetListEntry): string {
    return `Generation Task:
${asset.kind === "character" ? "Character reference" : asset.kind === "scene" ? "Scene concept image" : "Item reference image"}

Style:
Dusty rose editorial concept art

Requirement:
Create an image prompt using the following asset information:
${asset.title}
${asset.kind !== "dialogue" ? asset.asset.detail : ""}

Do:
- Keep the visual language intentional
- Preserve key identity details
- Make the result production-friendly

Don't:
- Do not add random extra elements
- Do not change core identity cues
- Do not make the composition generic`;
  }

  function handlePromptTemplateDrop(
    event: DragEvent<HTMLTextAreaElement>,
    assetKey: string,
  ) {
    event.preventDefault();
    const templateContent = event.dataTransfer.getData("text/plain");

    if (!templateContent) {
      return;
    }

    updateAssetPromptDraft(assetKey, templateContent);
  }

  function handleDescriptionPromptTemplateDrop(
    event: DragEvent<HTMLTextAreaElement>,
    assetKind: "character" | "scene" | "item",
  ) {
    event.preventDefault();
    const templateContent = event.dataTransfer.getData("text/plain");

    if (!templateContent) {
      return;
    }

    setDescriptionPromptDrafts((current) => ({
      ...current,
      [assetKind]: templateContent,
    }));
  }

  function handlePromptTemplateSave(
    assetKey: string,
    fallbackPrompt: string,
    library: PromptLibraryKind = "image",
    promptOverride?: string,
  ) {
    const promptText =
      typeof promptOverride === "string"
        ? promptOverride
        : assetPromptDrafts[assetKey] ?? fallbackPrompt;
    const fileName = promptSaveDrafts[assetKey]?.fileName?.trim() ?? "";

    if (!promptText.trim() || !fileName) {
      return;
    }

    void (async () => {
      setPromptLibraryError("");

      try {
        const response = await fetch("/api/prompt-library", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName,
            content: promptText,
            library,
          }),
        });

        const data = (await response.json()) as {
          saved?: boolean;
          template?: PromptTemplate;
          error?: string;
        };

        if (!response.ok || !data.saved || !data.template) {
          throw new Error(data.error ?? "Failed to save the prompt template.");
        }

        const savedTemplate = data.template;

        if (library === "description") {
          setDescriptionPromptTemplates((current) => {
            const next = current.filter(
              (template) => template.fileName !== savedTemplate.fileName,
            );

            return [...next, savedTemplate].sort((a, b) =>
              a.fileName.localeCompare(b.fileName),
            );
          });
        } else {
          setPromptTemplates((current) => {
            const next = current.filter(
              (template) => template.fileName !== savedTemplate.fileName,
            );

            return [...next, savedTemplate].sort((a, b) =>
              a.fileName.localeCompare(b.fileName),
            );
          });
        }
        setPromptSaveStates((current) => ({
          ...current,
          [assetKey]: "saved",
        }));
        setActivePromptSaveAssetKey("");
        window.setTimeout(() => {
          setPromptSaveStates((current) => ({
            ...current,
            [assetKey]: "idle",
          }));
        }, 1600);
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to save the prompt template.";

        setPromptLibraryError(message);
      }
    })();
  }

  function openPromptSave(assetKey: string, fallbackName: string) {
    setPromptSaveDrafts((current) => ({
      ...current,
      [assetKey]: current[assetKey] ?? {
        fileName: fallbackName,
      },
    }));
    setActivePromptSaveAssetKey(assetKey);
  }

  function updatePromptSaveDraft(assetKey: string, value: string) {
    setPromptSaveDrafts((current) => ({
      ...current,
      [assetKey]: {
        fileName: value,
      },
    }));
  }

  function confirmPromptSave(
    assetKey: string,
    fallbackPrompt: string,
    library: PromptLibraryKind = "image",
    promptOverride?: string,
  ) {
    handlePromptTemplateSave(assetKey, fallbackPrompt, library, promptOverride);
    setActivePromptSaveAssetKey("");
  }

  function updateDialogueVoiceId(assetKey: string, value: string) {
    setDialogueVoiceIds((current) => ({
      ...current,
      [assetKey]: value,
    }));
  }

  function updateDialogueAudioResult(assetKey: string, result: DialogueAudioResult) {
    setDialogueAudioResults((current) => {
      const previous = current[assetKey];

      if (previous) {
        URL.revokeObjectURL(previous.url);
      }

      return {
        ...current,
        [assetKey]: result,
      };
    });
  }

  function clearDialogueAudioResult(assetKey: string) {
    setDialogueAudioResults((current) => {
      const previous = current[assetKey];

      if (!previous) {
        return current;
      }

      URL.revokeObjectURL(previous.url);
      const next = { ...current };
      delete next[assetKey];
      return next;
    });
  }

  function removeAsset(assetToRemove: AssetListEntry) {
    const removedKey = `${assetToRemove.kind}:${assetToRemove.id}`;
    const nextAssetAnalysis: AssetAnalysisResult = {
      dialogues:
        assetToRemove.kind === "dialogue"
          ? assetAnalysis.dialogues.filter((asset) => asset.id !== assetToRemove.id)
          : assetAnalysis.dialogues,
      characters:
        assetToRemove.kind === "character"
          ? assetAnalysis.characters.filter((asset) => asset.id !== assetToRemove.id)
          : assetAnalysis.characters,
      scenes:
        assetToRemove.kind === "scene"
          ? assetAnalysis.scenes.filter((asset) => asset.id !== assetToRemove.id)
          : assetAnalysis.scenes,
      items:
        assetToRemove.kind === "item"
          ? assetAnalysis.items.filter((asset) => asset.id !== assetToRemove.id)
          : assetAnalysis.items,
    };
    const nextManualAssets = manualAssets.filter(
      (asset) => `${asset.kind}:${asset.id}` !== removedKey,
    );
    const nextAssetList = [...nextManualAssets, ...buildAssetListEntries(nextAssetAnalysis)];
    const nextSelected = nextAssetList[0];

    setAssetAnalysis(nextAssetAnalysis);
    setManualAssets(nextManualAssets);
    setSelectedAssetKey(nextSelected ? `${nextSelected.kind}:${nextSelected.id}` : "");
    setReusedAssetKeys((currentKeys) => currentKeys.filter((key) => key !== removedKey));
    setAssetPromptDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[removedKey];
      return nextDrafts;
    });
    setAssetDescriptionDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[removedKey];
      return nextDrafts;
    });
    setImageModelConfigs((currentConfigs) => {
      const nextConfigs = { ...currentConfigs };
      delete nextConfigs[removedKey];
      return nextConfigs;
    });
    setReferenceImages((currentImages) => {
      const nextImages = { ...currentImages };
      delete nextImages[removedKey];
      return nextImages;
    });
    setDialogueDrafts((currentDrafts) => {
      const nextDrafts = { ...currentDrafts };
      delete nextDrafts[removedKey];
      return nextDrafts;
    });
    setDialogueOriginals((currentOriginals) => {
      const nextOriginals = { ...currentOriginals };
      delete nextOriginals[removedKey];
      return nextOriginals;
    });
    setDialogueVoiceIds((currentVoiceIds) => {
      const nextVoiceIds = { ...currentVoiceIds };
      delete nextVoiceIds[removedKey];
      return nextVoiceIds;
    });
    setImageGenerationResults((currentResults) => {
      const nextResults = { ...currentResults };
      delete nextResults[removedKey];
      return nextResults;
    });
    clearDialogueAudioResult(removedKey);
    setHasAnalyzedAssets(nextAssetList.length > 0);
  }

  function resetAssetList() {
    setAssetAnalysis(emptyAssetAnalysis);
    setManualAssets([]);
    setReusedAssetKeys([]);
    setAssetPromptDrafts({});
    setImageModelConfigs({});
    setReferenceImages({});
    setAssetDescriptionDrafts({});
    setDialogueDrafts({});
    setDialogueVoiceIds({});
    setImageGenerationResults({});
    setDialogueAudioResults((current) => {
      Object.values(current).forEach((result) => {
        URL.revokeObjectURL(result.url);
      });
      return {};
    });
    setDialogueOriginals({});
    setSelectedAssetKey("");
    setHasAnalyzedAssets(false);
    setAssetAnalysisError("");
    setTtsError("");
    setImageGenerationError("");
  }

  async function handleVoiceTagging(assetKey: string, text: string) {
    if (!text.trim() || isVoiceTagging) {
      return;
    }

    setIsVoiceTagging(true);
    setVoiceTaggingError("");

    try {
      const response = await fetch("/api/voice-tagging", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          systemPrompt: voiceTaggingSystemPrompt,
        }),
      });

      const data = (await response.json()) as {
        taggedText?: string;
        error?: string;
      };

      if (!response.ok || !data.taggedText) {
        throw new Error(data.error ?? "Voice tagging failed.");
      }

      updateDialogueDraft(assetKey, data.taggedText);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Voice tagging failed.";

      setVoiceTaggingError(message);
    } finally {
      setIsVoiceTagging(false);
    }
  }

  function resetDialogueText(assetKey: string, fallbackText: string) {
    const original = dialogueOriginals[assetKey] ?? fallbackText;
    updateDialogueDraft(assetKey, original);
    setVoiceTaggingError("");
  }

  async function handleDialogueTts(
    assetKey: string,
    character: string,
    text: string,
    voiceId: string,
  ) {
    if (!text.trim() || !voiceId.trim() || isGeneratingTts) {
      return;
    }

    setIsGeneratingTts(true);
    setTtsError("");

    try {
      const response = await fetch("/api/dialogue-tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          voiceId,
          filename: createDialogueAudioFilename(character),
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "TTS generation failed.");
      }

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const filename =
        response.headers.get("X-Dialogue-Tts-Filename") ??
        createDialogueAudioFilename(character);

      updateDialogueAudioResult(assetKey, {
        url: audioUrl,
        filename,
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "TTS generation failed.";

      setTtsError(message);
    } finally {
      setIsGeneratingTts(false);
    }
  }

  async function handleImageGeneration(
    assetKey: string,
    prompt: string,
    title: string,
    modelConfig: ImageModelConfig,
  ) {
    if (!prompt.trim() || isGeneratingImage) {
      return;
    }

    setIsGeneratingImage(true);
    setImageGenerationError("");

    try {
      const currentReferenceImages = referenceImages[assetKey] ?? [];

      if (modelConfig.mode === "image_to_image" && !currentReferenceImages.length) {
        throw new Error("Please add at least one reference image for image-to-image.");
      }

      const response = await fetch("/api/image-generation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
          mode: modelConfig.mode,
          models: modelConfig.models,
          size: modelConfig.size,
          aspectRatio: modelConfig.aspectRatio,
          outputFormat: modelConfig.outputFormat,
          projectRootPath,
          referenceImages:
            modelConfig.mode === "image_to_image"
              ? currentReferenceImages.map((image) => ({
                  name: image.name,
                  source: image.source,
                  dataUrl: image.dataUrl,
                  path: image.path,
                }))
              : [],
        }),
      });

      const data = (await response.json()) as {
        results?: Array<{
          model: string;
          status: "completed" | "processing" | "failed";
          imageUrl?: string;
          taskId?: string;
          error?: string;
          diagnostics?: ImageGenerationDiagnostics;
          inferenceMs?: number;
          seed?: number;
        }>;
        imageUrl?: string;
        inferenceMs?: number;
        seed?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Image generation failed.");
      }

      const results =
        data.results?.map((result) => ({
          model: result.model,
          status: result.status,
          url: result.imageUrl ?? "",
          filename: `${title.trim() || "generated-image"}-${getImageModelLabel(result.model)}.png`,
          taskId: result.taskId,
          error: result.error,
          diagnostics: result.diagnostics,
          seed: result.seed,
          inferenceMs: result.inferenceMs,
        })) ??
        (data.imageUrl
          ? [
              {
                model: modelConfig.models[0] ?? defaultImageModelConfig.models[0],
                status: "completed" as const,
                url: data.imageUrl,
                filename: `${title.trim() || "generated-image"}.png`,
                seed: data.seed,
                inferenceMs: data.inferenceMs,
              },
            ]
          : []);

      if (!results.length) {
        throw new Error(data.error ?? "Image generation failed.");
      }

      setImageGenerationResults((current) => ({
        ...current,
        [assetKey]: results,
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Image generation failed.";

      setImageGenerationError(message);
    } finally {
      setIsGeneratingImage(false);
    }
  }

  async function handleImageStatusCheck(
    assetKey: string,
    result: GeneratedImageResult,
    title: string,
  ) {
    if (!result.taskId) {
      return;
    }

    const statusKey = `${assetKey}:${result.model}`;

    if (checkingImageStatusKeys.includes(statusKey)) {
      return;
    }

    setCheckingImageStatusKeys((current) => [...current, statusKey]);
    setImageGenerationError("");

    try {
      const response = await fetch("/api/image-generation/status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: result.model,
          taskId: result.taskId,
        }),
      });
      const data = (await response.json()) as {
        model?: string;
        status?: "completed" | "processing" | "failed";
        imageUrl?: string;
        taskId?: string;
        error?: string;
        inferenceMs?: number;
        seed?: number;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Image status check failed.");
      }

      setImageGenerationResults((current) => ({
        ...current,
        [assetKey]: (current[assetKey] ?? []).map((item) =>
          item.model === result.model
            ? {
                ...item,
                status: data.status ?? item.status,
                url: data.imageUrl ?? item.url,
                filename: `${title.trim() || "generated-image"}-${getImageModelLabel(result.model)}.png`,
                taskId: data.taskId ?? item.taskId,
                error: data.error,
                seed: data.seed,
                inferenceMs: data.inferenceMs,
              }
            : item,
        ),
      }));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Image status check failed.";

      setImageGenerationResults((current) => ({
        ...current,
        [assetKey]: (current[assetKey] ?? []).map((item) =>
          item.model === result.model
            ? {
                ...item,
                status: "failed",
                error: message,
              }
            : item,
        ),
      }));
    } finally {
      setCheckingImageStatusKeys((current) =>
        current.filter((item) => item !== statusKey),
      );
    }
  }

  function addManualAsset(kind: ManualAssetKind) {
    const nextIndex =
      manualAssets.filter((asset) => asset.kind === kind).length + 1;
    const created = createManualAsset(kind, nextIndex);
    const assetEntry: AssetListEntry = {
      ...created,
      id: created.asset.id,
    };
    const assetKey = `${assetEntry.kind}:${assetEntry.id}`;

    setManualAssets((current) => [assetEntry, ...current]);
    setSelectedAssetKey(assetKey);
    setHasAnalyzedAssets(true);
    setAssetAnalysisError("");

    if (assetEntry.kind === "dialogue") {
      setDialogueOriginals((current) => ({
        ...current,
        [assetKey]: assetEntry.asset.text,
      }));
      setDialogueVoiceIds((current) => ({
        ...current,
        [assetKey]: DEFAULT_DIALOGUE_VOICE_ID,
      }));
    }
  }

  const analyzedAssetList: AssetListEntry[] = [
    ...assetAnalysis.dialogues.map((asset) => ({
      kind: "dialogue" as const,
      id: asset.id,
      title: asset.character,
      subtitle: "Dialogue",
      status: asset.status,
      asset,
    })),
    ...assetAnalysis.characters.map((asset) => ({
      kind: "character" as const,
      id: asset.id,
      title: asset.name,
      subtitle: "Character",
      status: asset.status,
      asset,
    })),
    ...assetAnalysis.scenes.map((asset) => ({
      kind: "scene" as const,
      id: asset.id,
      title: asset.name,
      subtitle: "Scene",
      status: asset.status,
      asset,
    })),
    ...assetAnalysis.items.map((asset) => ({
      kind: "item" as const,
      id: asset.id,
      title: asset.name,
      subtitle: "Item",
      status: asset.status,
      asset,
    })),
  ];

  const assetList: AssetListEntry[] = [...manualAssets, ...analyzedAssetList];

  const selectedAsset =
    assetList.find((asset) => `${asset.kind}:${asset.id}` === selectedAssetKey) ??
    assetList[0] ??
    null;

  const effectiveAssetKey = selectedAsset
    ? `${selectedAsset.kind}:${selectedAsset.id}`
    : "";

  return (
    <main className="page-shell">
      <div className="atmosphere atmosphere-left" />
      <div className="atmosphere atmosphere-right" />

      <div className="workspace-shell">
      <div className="sidebar-column">
      <aside
        className={
          isProjectSidebarCollapsed
            ? "project-sidebar collapsed"
            : "project-sidebar"
        }
      >
        <div className="project-sidebar-top">
          <div>
            <span className="panel-label">Library</span>
            {!isProjectSidebarCollapsed ? <h2>Project Assets</h2> : null}
          </div>
          <button
            type="button"
            className="secondary-button project-sidebar-toggle"
            onClick={() => setIsProjectSidebarCollapsed((current) => !current)}
          >
            {isProjectSidebarCollapsed ? "→" : "←"}
          </button>
        </div>

        {isProjectSidebarCollapsed ? (
          <div className="project-sidebar-collapsed-copy">
            <span>Project</span>
            <span>Assets</span>
          </div>
        ) : (
          <div className="project-tree">
            <div className="project-root-controls">
              <label className="save-field">
                <span>Project root folder</span>
                <input
                  type="text"
                  className="workspace-input project-root-input"
                  value={projectRootInput}
                  onChange={(event) => setProjectRootInput(event.target.value)}
                />
              </label>
              <div className="project-root-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void handleSetProjectRoot()}
                >
                  Set Root Folder
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void refreshProjectTree(projectRootPath)}
                  disabled={isRefreshingProjectTree}
                >
                  {isRefreshingProjectTree ? "Refreshing..." : "Refresh"}
                </button>
              </div>
            </div>

            {projectTreeError ? <p className="asset-inline-error sidebar-error">{projectTreeError}</p> : null}

            <button
              type="button"
              className="project-tree-node"
              onClick={() => setProjectTreeOpen((current) => !current)}
            >
              <span>{projectTreeOpen ? "−" : "+"}</span>
              <strong>Project</strong>
            </button>

            {projectTreeOpen ? (
              <div className="project-tree-branch">
                {projectTree ? renderProjectTree(projectTree) : <p className="project-asset-empty">No project folder loaded yet.</p>}
              </div>
            ) : null}
          </div>
        )}
      </aside>
      <aside
        className={
          isPromptSidebarCollapsed
            ? "prompt-sidebar collapsed"
            : "prompt-sidebar"
        }
      >
        <div className="project-sidebar-top">
          <div>
            <span className="panel-label">Library</span>
            {!isPromptSidebarCollapsed ? <h2>Prompt Library</h2> : null}
          </div>
          <button
            type="button"
            className="secondary-button project-sidebar-toggle"
            onClick={() => setIsPromptSidebarCollapsed((current) => !current)}
          >
            {isPromptSidebarCollapsed ? ">" : "<"}
          </button>
        </div>

        {isPromptSidebarCollapsed ? (
          <div className="project-sidebar-collapsed-copy prompt-collapsed-copy">
            <span>Prompt</span>
            <span>Library</span>
          </div>
        ) : (
          <div className="project-tree">
            {promptLibraryError ? (
              <p className="asset-inline-error sidebar-error">{promptLibraryError}</p>
            ) : null}
            <button
              type="button"
              className="project-tree-node prompt-tree-node"
              onClick={() => setPromptLibraryCollapsed((current) => !current)}
            >
              <span>{promptLibraryCollapsed ? "+" : "-"}</span>
              <strong>image_generation_prompts</strong>
              <em>{promptTemplates.length}</em>
            </button>

            {!promptLibraryCollapsed ? (
              <div className="project-asset-list prompt-template-list">
                {isLoadingPromptTemplates ? (
                  <p className="project-asset-empty">Loading prompt library...</p>
                ) : promptTemplates.length ? (
                  promptTemplates.map((template) => (
                    <div
                      key={template.fileName}
                      draggable
                      className="prompt-template-item"
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", template.content);
                        event.dataTransfer.effectAllowed = "copy";
                      }}
                    >
                      <strong>{template.fileName}</strong>
                      <button
                        type="button"
                        className="prompt-delete-button"
                        onClick={() => void handleDeletePromptTemplate(template.fileName, "image")}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="project-asset-empty">No prompt templates yet.</p>
                )}
              </div>
            ) : null}

            <button
              type="button"
              className="project-tree-node prompt-tree-node"
              onClick={() =>
                setDescriptionPromptLibraryCollapsed((current) => !current)
              }
            >
              <span>{descriptionPromptLibraryCollapsed ? "+" : "-"}</span>
              <strong>description_generation_prompts</strong>
              <em>{descriptionPromptTemplates.length}</em>
            </button>

            {!descriptionPromptLibraryCollapsed ? (
              <div className="project-asset-list prompt-template-list">
                {isLoadingPromptTemplates ? (
                  <p className="project-asset-empty">Loading prompt library...</p>
                ) : descriptionPromptTemplates.length ? (
                  descriptionPromptTemplates.map((template) => (
                    <div
                      key={`description:${template.fileName}`}
                      draggable
                      className="prompt-template-item"
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", template.content);
                        event.dataTransfer.effectAllowed = "copy";
                      }}
                    >
                      <strong>{template.fileName}</strong>
                      <button
                        type="button"
                        className="prompt-delete-button"
                        onClick={() =>
                          void handleDeletePromptTemplate(
                            template.fileName,
                            "description",
                          )
                        }
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="project-asset-empty">No description prompt templates yet.</p>
                )}
              </div>
            ) : null}
          </div>
        )}
      </aside>
      </div>

      <section className="workspace-frame">
        <header className="header-block">
          <div>
            <p className="eyebrow">Director Tool</p>
            <h1>Director Tool</h1>
          </div>
          <p className="intro-copy">An all-in-one directing workspace</p>
        </header>

        <nav className="tab-row" aria-label="Prototype tabs">
          <button
            type="button"
            className={activeTab === "scenes" ? "tab active" : "tab"}
            onClick={() => setActiveTab("scenes")}
          >
            Script to Scenes
          </button>
          <button
            type="button"
            className={activeTab === "assets" ? "tab active" : "tab"}
            onClick={() => setActiveTab("assets")}
          >
            Asset Generation
          </button>
          <button
            type="button"
            className={activeTab === "video" ? "tab active" : "tab"}
            onClick={() => setActiveTab("video")}
          >
            Video Generation
          </button>
          <button
            type="button"
            className={activeTab === "editing" ? "tab active" : "tab"}
            onClick={() => setActiveTab("editing")}
          >
            Video Editing
          </button>
        </nav>

        {activeTab === "scenes" ? (
          <div className="storyboard-layout">
            {(() => {
              const sceneTextSaveTarget = createSaveTargetFromSceneText();

              return (
                <>
            <section className="panel panel-input">
              <div className="panel-copy">
                <span className="panel-label">Input</span>
                <h2>Paste script</h2>
                <p>
                  Keep the input area open and quiet, so the script feels like the starting point of the page instead
                  of being interrupted by too many controls.
                </p>
              </div>

              <div className="prompt-tools">
                <button
                  type="button"
                  className={showSystemPrompt ? "secondary-button active" : "secondary-button"}
                  onClick={() => setShowSystemPrompt((current) => !current)}
                >
                  {showSystemPrompt ? "Hide System Prompt" : "View System Prompt"}
                </button>
              </div>

              {showSystemPrompt ? (
                <div className="system-prompt-wrap">
                  <label className="system-prompt-label" htmlFor="system-prompt">
                    Default system prompt
                  </label>
                  <textarea
                    id="system-prompt"
                    className="system-prompt-input"
                    value={systemPrompt}
                    onChange={(event) => setSystemPrompt(event.target.value)}
                    placeholder="Paste an optional system prompt here"
                  />
                </div>
              ) : null}

              <label className="sr-only" htmlFor="script-input">
                Script text input
              </label>
              <textarea
                id="script-input"
                className="script-input"
                value={script}
                onChange={(event) => setScript(event.target.value)}
                placeholder="Paste your script, narration, or scene text here"
              />

              <div className="input-footer">
                <p className="support-copy">Uses the local API route to call your configured AI model.</p>
                <button
                  type="button"
                  className={isGenerating ? "generate-button loading" : "generate-button"}
                  onClick={handleGenerate}
                  disabled={!script.trim() || isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate Scenes"}
                </button>
              </div>
            </section>

            <section className="panel panel-output">
              <div className="panel-heading">
                <div className="panel-copy">
                  <span className="panel-label">Output</span>
                  <h2>Scene text</h2>
                  <p>Keep the result in pure text form so the prototype stays light, calm, and easy to scan.</p>
                </div>
                <div className="output-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleCopy}
                    disabled={!sceneText || isGenerating}
                  >
                    {copyState === "copied" ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleDownload}
                    disabled={!sceneText || isGenerating}
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => openSavePanel(sceneTextSaveTarget)}
                    disabled={!sceneText || isGenerating}
                  >
                    Save
                  </button>
                </div>
              </div>

              <div
                className={
                  isGenerating
                    ? "result-surface is-loading"
                    : hasGenerated
                      ? "result-surface is-ready"
                      : "result-surface"
                }
              >
                {isGenerating ? (
                  <div className="loading-stack" aria-live="polite">
                    <div className="loading-orb" aria-hidden="true" />
                    <p className="loading-label">Generating scenes...</p>
                    <p className="loading-subcopy">AI is turning your script into a first-pass scene breakdown.</p>
                    <span className="loading-line short" />
                    <span className="loading-line medium" />
                    <span className="loading-line long" />
                    <span className="loading-line medium" />
                  </div>
                ) : generationError ? (
                  <div className="error-state">
                    <p className="empty-kicker">Generation failed</p>
                    <p>{generationError}</p>
                  </div>
                ) : sceneText ? (
                  <textarea
                    className="scene-text-editor"
                    value={sceneText}
                    onChange={(event) => setSceneText(event.target.value)}
                    aria-label="Editable generated scene text"
                  />
                ) : (
                  <div className="empty-state">
                    <p className="empty-kicker">Ready when you are</p>
                    <p>
                      Your generated scene text will appear here after the AI request completes.
                    </p>
                  </div>
                )}
              </div>
              {activeSavePanelKey === sceneTextSaveTarget.panelKey
                ? renderSavePanel(sceneTextSaveTarget)
                : null}
            </section>
                </>
              );
            })()}
          </div>
        ) : activeTab === "assets" ? (
          <div className="asset-layout">
            <section className="panel asset-input-panel">
              <div className="panel-copy">
                <span className="panel-label">Input</span>
                <h2>Paste storyboard</h2>
                <p>
                  Paste the storyboard text, analyze the asset list, then decide what should be reused and what should
                  be generated.
                </p>
              </div>

              <textarea
                className="script-input asset-storyboard-input"
                value={assetStoryboard}
                onChange={(event) => setAssetStoryboard(event.target.value)}
                placeholder="Paste your storyboard text here"
              />

              <div className="prompt-tools">
                <button
                  type="button"
                  className={showAnalyzePrompt ? "secondary-button active" : "secondary-button"}
                  onClick={() => setShowAnalyzePrompt((current) => !current)}
                >
                  {showAnalyzePrompt ? "Hide System Prompt" : "View System Prompt"}
                </button>
              </div>

              {showAnalyzePrompt ? (
                <div className="system-prompt-wrap">
                  <label className="system-prompt-label" htmlFor="analyze-system-prompt">
                    Analyze Assets system prompt
                  </label>
                  <textarea
                    id="analyze-system-prompt"
                    className="system-prompt-input"
                    value={analyzeSystemPrompt}
                    onChange={(event) => setAnalyzeSystemPrompt(event.target.value)}
                    placeholder="Edit the Analyze Assets system prompt"
                  />
                </div>
              ) : null}

              <div className="input-footer">
                <p className="support-copy">
                  This uses a dedicated LLM call to extract dialogue, characters, scenes, and items.
                </p>
                <button
                  type="button"
                  className={isAnalyzingAssets ? "generate-button loading" : "generate-button"}
                  onClick={handleAnalyzeAssets}
                  disabled={!assetStoryboard.trim() || isAnalyzingAssets}
                >
                  {isAnalyzingAssets ? "Analyzing..." : "Analyze Assets"}
                </button>
              </div>

              {assetAnalysisError ? <p className="asset-inline-error">{assetAnalysisError}</p> : null}
              {saveSuccessMessage ? <p className="asset-inline-success">{saveSuccessMessage}</p> : null}
              {saveError ? <p className="asset-inline-error">{saveError}</p> : null}
            </section>

            <section className="asset-analysis-shell">
              <section className="panel asset-summary-panel">
                <div className="asset-summary-row">
                  <div className="summary-chip">
                    <span>Dialogues</span>
                    <strong>{assetAnalysis.dialogues.length}</strong>
                  </div>
                  <div className="summary-chip">
                    <span>Characters</span>
                    <strong>{assetAnalysis.characters.length}</strong>
                  </div>
                  <div className="summary-chip">
                    <span>Scenes</span>
                    <strong>{assetAnalysis.scenes.length}</strong>
                  </div>
                  <div className="summary-chip">
                    <span>Items</span>
                    <strong>{assetAnalysis.items.length}</strong>
                  </div>
                </div>
              </section>

              <section className="panel asset-manual-entry-panel">
                <div className="asset-list-header">
                  <span className="panel-label">Manual Entry</span>
                  <h3>Create assets without analysis</h3>
                </div>

                <div className="asset-create-row">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => addManualAsset("dialogue")}
                  >
                    + Dialogue
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => addManualAsset("character")}
                  >
                    + Character
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => addManualAsset("scene")}
                  >
                    + Scene
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => addManualAsset("item")}
                  >
                    + Item
                  </button>
                </div>
              </section>

              {hasAnalyzedAssets ? (
                <div className="asset-groups">
                  <section className="asset-workbench">
                    <aside className="asset-list-panel">
                      <div className="asset-list-header">
                        <span className="panel-label">Asset List</span>
                        <h3>Scroll through extracted assets</h3>
                      </div>

                      <div className="asset-list-scroll">
                        {assetList.map((asset) => {
                          const assetKey = `${asset.kind}:${asset.id}`;
                          const isSelected = selectedAssetKey === assetKey;
                          const isReused = reusedAssetKeys.includes(assetKey);

                          return (
                            <button
                              key={assetKey}
                              type="button"
                              className={
                                isSelected
                                  ? isReused
                                    ? "asset-list-item selected reused"
                                    : "asset-list-item selected"
                                  : isReused
                                    ? "asset-list-item reused"
                                    : "asset-list-item"
                              }
                              onClick={() => setSelectedAssetKey(assetKey)}
                            >
                              <span className="asset-list-item-top">{asset.subtitle}</span>
                              <strong>{asset.title}</strong>
                            </button>
                          );
                        })}
                      </div>
                    </aside>

                    <section className="asset-workspace-panel">
                      {selectedAsset?.kind === "dialogue" ? (
                        (() => {
                          const dialogueText =
                            dialogueDrafts[effectiveAssetKey] ?? selectedAsset.asset.text;
                          const voiceId =
                            dialogueVoiceIds[effectiveAssetKey] ?? DEFAULT_DIALOGUE_VOICE_ID;
                          const audioResult = dialogueAudioResults[effectiveAssetKey];
                          const sourceSaveTarget = createSaveTargetFromAsset(selectedAsset);
                          const audioSaveTarget = createSaveTargetFromDialogueAudio(selectedAsset);

                          return (
                        <>
                          <div className="asset-group-header">
                            <div>
                              <span className="panel-label">Dialogue Workspace</span>
                              <h3>{selectedAsset.title}</h3>
                            </div>
                            <span
                              className={
                                reusedAssetKeys.includes(effectiveAssetKey)
                                  ? "status-chip reuse"
                                  : "status-chip ready"
                              }
                            >
                              {reusedAssetKeys.includes(effectiveAssetKey)
                                ? "Reused"
                                : "Ready for TTS"}
                            </span>
                          </div>

                          <div className="workspace-controls">
                            <div className="asset-style-picker compact">
                              <span>Voice ID</span>
                              <input
                                type="text"
                                className="workspace-input"
                                value={voiceId}
                                onChange={(event) =>
                                  updateDialogueVoiceId(effectiveAssetKey, event.target.value)
                                }
                                placeholder="Paste an ElevenLabs voice ID"
                              />
                            </div>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                handleDialogueTts(
                                  effectiveAssetKey,
                                  selectedAsset.asset.character,
                                  dialogueText,
                                  voiceId,
                                )
                              }
                              disabled={!dialogueText.trim() || !voiceId.trim() || isGeneratingTts}
                            >
                              {isGeneratingTts ? "Generating TTS..." : "TTS Generation"}
                            </button>
                          </div>

                          <div className="workspace-secondary-actions">
                            <button
                              type="button"
                              className={showVoiceTaggingPrompt ? "secondary-button active" : "secondary-button"}
                              onClick={() => setShowVoiceTaggingPrompt((current) => !current)}
                            >
                              {showVoiceTaggingPrompt ? "Hide System Prompt" : "View System Prompt"}
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => handleVoiceTagging(effectiveAssetKey, dialogueText)}
                              disabled={!dialogueText.trim() || isVoiceTagging}
                            >
                              {isVoiceTagging ? "Tagging..." : "Voice Tagging"}
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => resetDialogueText(effectiveAssetKey, selectedAsset.asset.text)}
                            >
                              Reset
                            </button>
                          </div>

                          {showVoiceTaggingPrompt ? (
                            <div className="system-prompt-wrap workspace-prompt-wrap">
                              <label className="system-prompt-label" htmlFor="voice-tagging-system-prompt">
                                Voice Tagging system prompt
                              </label>
                              <textarea
                                id="voice-tagging-system-prompt"
                                className="system-prompt-input"
                                value={voiceTaggingSystemPrompt}
                                onChange={(event) => setVoiceTaggingSystemPrompt(event.target.value)}
                                placeholder="Edit the Voice Tagging system prompt"
                              />
                            </div>
                          ) : null}

                          {voiceTaggingError ? (
                            <p className="asset-inline-error">{voiceTaggingError}</p>
                          ) : null}

                          {ttsError ? <p className="asset-inline-error">{ttsError}</p> : null}

                          <textarea
                            className="dialogue-text-block workspace-text prompt-editor"
                            value={dialogueText}
                            onChange={(event) =>
                              updateDialogueDraft(effectiveAssetKey, event.target.value)
                            }
                          />

                          <div className="asset-actions">
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                navigator.clipboard.writeText(dialogueText)
                              }
                            >
                              Copy
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() =>
                                handleDownloadText(
                                  `${selectedAsset.asset.character}-dialogue.txt`,
                                  dialogueText,
                                )
                              }
                            >
                              Download
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => openSavePanel(sourceSaveTarget)}
                            >
                              Save
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={() => toggleReuse(effectiveAssetKey)}
                            >
                              {reusedAssetKeys.includes(effectiveAssetKey) ? "Undo Reuse" : "Reuse"}
                            </button>
                            <button
                              type="button"
                              className="secondary-button danger-button"
                              onClick={() => removeAsset(selectedAsset)}
                            >
                              Delete
                            </button>
                          </div>

                          {activeSavePanelKey === sourceSaveTarget.panelKey
                            ? renderSavePanel(sourceSaveTarget)
                            : null}

                          {audioResult ? (
                            <div className="workspace-audio-card">
                              <div className="workspace-audio-header">
                                <div>
                                  <span className="panel-label">Latest Audio</span>
                                  <h4>Generated speech preview</h4>
                                </div>
                                <div className="workspace-audio-actions">
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => openSavePanel(audioSaveTarget)}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => handleDownloadBlobUrl(audioResult.filename, audioResult.url)}
                                  >
                                    Download
                                  </button>
                                </div>
                              </div>
                              <audio controls className="workspace-audio-player" src={audioResult.url}>
                                Your browser does not support the audio element.
                              </audio>
                              {activeSavePanelKey === audioSaveTarget.panelKey
                                ? renderSavePanel(audioSaveTarget)
                                : null}
                            </div>
                          ) : null}
                        </>
                          );
                        })()
                      ) : selectedAsset ? (
                        (() => {
                          const sourceSaveTarget = createSaveTargetFromAsset(selectedAsset);
                          const defaultPromptText = buildPrototypePrompt(selectedAsset);
                          const promptText =
                            assetPromptDrafts[effectiveAssetKey] ?? defaultPromptText;
                          const modelConfig =
                            imageModelConfigs[effectiveAssetKey] ?? defaultImageModelConfig;
                            const currentReferenceImages =
                              referenceImages[effectiveAssetKey] ?? [];
                            const availableImageModelOptions =
                              getImageModelOptionsForMode(modelConfig.mode);
                          const showModelSettings =
                            showImageModelSettingsKey === effectiveAssetKey;
                          const isImageToImageMode =
                            modelConfig.mode === "image_to_image";
                          const descriptionText =
                            assetDescriptionDrafts[effectiveAssetKey] ?? "";
                          const promptSaveState =
                            promptSaveStates[effectiveAssetKey] ?? "idle";
                          const imageResults =
                            imageGenerationResults[effectiveAssetKey] ?? [];
                          const imageResult = imageResults[0];
                          const imageSaveTarget = imageResult
                            ? createSaveTargetFromGeneratedImageResult(
                                selectedAsset,
                                imageResult,
                              )
                            : createSaveTargetFromGeneratedImage(selectedAsset);
                          const descriptionPromptSaveKey =
                            `${effectiveAssetKey}:description-prompt`;
                          const descriptionSaveTarget: SaveTarget = {
                            panelKey: `${selectedAsset.kind}:${selectedAsset.id}:description`,
                            title: "Save this asset description",
                            defaultName: `${selectedAsset.title} description`,
                            defaultPath:
                              selectedAsset.kind === "character"
                                ? `${projectRootPath}\\assets\\characters`
                                : selectedAsset.kind === "scene"
                                  ? `${projectRootPath}\\assets\\scenes`
                                  : `${projectRootPath}\\assets\\items`,
                            extension: "txt",
                            source: {
                              type: "text",
                              content: descriptionText,
                            },
                          };
                          const descriptionPrompt =
                            descriptionPromptDrafts[selectedAsset.kind];
                          const defaultPromptFileName = `${selectedAsset.title
                            .trim()
                            .replace(/\s+/g, "_")
                            .toLowerCase()}_template.txt`;

                          return (
                            <>
                              <div className="asset-group-header">
                                <div>
                                  <span className="panel-label">Image Workspace</span>
                                  <h3>{selectedAsset.title}</h3>
                                </div>
                                <span
                                  className={
                                    reusedAssetKeys.includes(effectiveAssetKey)
                                      ? "status-chip reuse"
                                      : "status-chip ready"
                                  }
                                >
                                  {reusedAssetKeys.includes(effectiveAssetKey)
                                    ? "Reused"
                                    : "Ready to Generate"}
                                </span>
                              </div>

                              <div className="workspace-description-card">
                                <div className="workspace-preview-header">
                                  <div>
                                    <span className="panel-label">Asset Description</span>
                                    <h4>Description workspace</h4>
                                  </div>
                                  <div className="workspace-audio-actions">
                                    <button
                                      type="button"
                                      className={
                                        showDescriptionPrompt
                                          ? "secondary-button active"
                                          : "secondary-button"
                                      }
                                      onClick={() =>
                                        setShowDescriptionPrompt((current) => !current)
                                      }
                                    >
                                      {showDescriptionPrompt
                                        ? "Hide System Prompt"
                                        : "View System Prompt"}
                                    </button>
                                    <button
                                      type="button"
                                      className={
                                        promptSaveState === "saved"
                                          ? "secondary-button active"
                                          : "secondary-button"
                                      }
                                      onClick={() =>
                                        openPromptSave(
                                          descriptionPromptSaveKey,
                                          `${selectedAsset.kind}_description_prompt`,
                                        )
                                      }
                                    >
                                      {promptSaveStates[descriptionPromptSaveKey] === "saved"
                                        ? "Prompt Saved"
                                        : "Save Prompt"}
                                    </button>
                                    <button
                                      type="button"
                                      className={
                                        isGeneratingDescription
                                          ? "generate-button compact loading"
                                          : "generate-button compact"
                                      }
                                      onClick={() =>
                                        handleDescriptionGeneration(
                                          effectiveAssetKey,
                                          selectedAsset,
                                          promptText,
                                          descriptionPrompt,
                                        )
                                      }
                                      disabled={isGeneratingDescription}
                                    >
                                      {isGeneratingDescription
                                        ? "Generating..."
                                        : "Description Generation"}
                                    </button>
                                  </div>
                                </div>

                                {showDescriptionPrompt ? (
                                  <div className="system-prompt-wrap description-prompt-wrap">
                                    {activePromptSaveAssetKey === descriptionPromptSaveKey ? (
                                      <div className="prompt-save-inline">
                                        <label className="save-field">
                                          <span>Template file name</span>
                                          <input
                                            type="text"
                                            className="workspace-input"
                                            value={
                                              promptSaveDrafts[descriptionPromptSaveKey]
                                                ?.fileName ??
                                              `${selectedAsset.kind}_description_prompt`
                                            }
                                            onChange={(event) =>
                                              updatePromptSaveDraft(
                                                descriptionPromptSaveKey,
                                                event.target.value,
                                              )
                                            }
                                          />
                                        </label>
                                        <div className="prompt-save-actions">
                                          <button
                                            type="button"
                                            className="secondary-button"
                                            onClick={() => setActivePromptSaveAssetKey("")}
                                          >
                                            Cancel
                                          </button>
                                          <button
                                            type="button"
                                            className="secondary-button save-confirm-button"
                                            onClick={() =>
                                              confirmPromptSave(
                                                descriptionPromptSaveKey,
                                                descriptionPrompt,
                                                "description",
                                                descriptionPrompt,
                                              )
                                            }
                                          >
                                            Confirm Save Template
                                          </button>
                                        </div>
                                      </div>
                                    ) : null}
                                    <label className="system-prompt-label">
                                      {selectedAsset.kind} description system prompt
                                    </label>
                                    <textarea
                                      className="system-prompt-input"
                                      value={descriptionPrompt}
                                      onDragOver={(event) => event.preventDefault()}
                                      onDrop={(event) =>
                                        handleDescriptionPromptTemplateDrop(
                                          event,
                                          selectedAsset.kind,
                                        )
                                      }
                                      onChange={(event) =>
                                        setDescriptionPromptDrafts((current) => ({
                                          ...current,
                                          [selectedAsset.kind]: event.target.value,
                                        }))
                                      }
                                    />
                                  </div>
                                ) : null}

                                <textarea
                                  className="dialogue-text-block workspace-text prompt-editor description-editor"
                                  value={descriptionText}
                                  onChange={(event) =>
                                    updateAssetDescriptionDraft(
                                      effectiveAssetKey,
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Generate or write a focused production description for this asset."
                                />

                                {descriptionGenerationError ? (
                                  <p className="asset-inline-error">
                                    {descriptionGenerationError}
                                  </p>
                                ) : null}

                                <div className="asset-actions">
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                      navigator.clipboard.writeText(descriptionText)
                                    }
                                    disabled={!descriptionText.trim()}
                                  >
                                    Copy
                                  </button>
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                      handleDownloadText(
                                        `${selectedAsset.title}-description.txt`,
                                        descriptionText,
                                      )
                                    }
                                    disabled={!descriptionText.trim()}
                                  >
                                    Download
                                  </button>
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() => openSavePanel(descriptionSaveTarget)}
                                    disabled={!descriptionText.trim()}
                                  >
                                    Save
                                  </button>
                                </div>

                                {activeSavePanelKey === descriptionSaveTarget.panelKey
                                  ? renderSavePanel(descriptionSaveTarget)
                                  : null}
                              </div>

                              {isImageToImageMode ? (
                              <div className="reference-images-card">
                                <div className="workspace-preview-header">
                                  <div>
                                    <span className="panel-label">Reference Images</span>
                                    <h4>Image-to-image visual inputs</h4>
                                  </div>
                                </div>
                                <div
                                  className="reference-dropzone"
                                  onDragOver={(event) => event.preventDefault()}
                                  onDrop={(event) =>
                                    handleReferenceDrop(event, effectiveAssetKey)
                                  }
                                >
                                  <p>Drop project assets here, or upload local reference images.</p>
                                  <label className="secondary-button reference-upload-button">
                                    Upload image
                                    <input
                                      type="file"
                                      accept="image/*"
                                      multiple
                                      onChange={(event) =>
                                        void handleReferenceUpload(
                                          effectiveAssetKey,
                                          event.target.files,
                                        )
                                      }
                                    />
                                  </label>
                                </div>
                                {currentReferenceImages.length ? (
                                  <div className="reference-image-list">
                                    {currentReferenceImages.map((image) => (
                                      <div className="reference-image-chip" key={image.id}>
                                        {image.previewUrl ? (
                                          <img src={image.previewUrl} alt={image.name} />
                                        ) : (
                                          <span className="reference-file-icon">File</span>
                                        )}
                                        <div>
                                          <strong>{image.name}</strong>
                                          <span>
                                            {image.source === "upload"
                                              ? "Uploaded reference"
                                              : image.path ?? "Project asset"}
                                          </span>
                                        </div>
                                        <button
                                          type="button"
                                          className="reference-remove-button"
                                          onMouseDown={(event) => event.stopPropagation()}
                                          onClick={(event) => {
                                            event.stopPropagation();
                                            removeReferenceImage(
                                              effectiveAssetKey,
                                              image.id,
                                            );
                                          }}
                                        >
                                          Delete
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                ) : null}
                              </div>
                              ) : null}

                              <div className="workspace-preview-card">
                                <div className="workspace-preview-header">
                                  <span className="panel-label">Prompt editor</span>
                                  <button
                                    type="button"
                                    className="secondary-button"
                                    onClick={() =>
                                      openPromptSave(
                                        effectiveAssetKey,
                                        defaultPromptFileName.replace(/\.txt$/i, ""),
                                      )
                                    }
                                  >
                                    {promptSaveState === "saved" ? "Prompt Saved" : "Save Prompt"}
                                  </button>
                                </div>
                                {activePromptSaveAssetKey === effectiveAssetKey ? (
                                  <div className="prompt-save-inline">
                                    <label className="save-field">
                                      <span>Template file name</span>
                                      <input
                                        type="text"
                                        className="workspace-input"
                                        value={
                                          promptSaveDrafts[effectiveAssetKey]?.fileName ??
                                          defaultPromptFileName.replace(/\.txt$/i, "")
                                        }
                                        onChange={(event) =>
                                          updatePromptSaveDraft(
                                            effectiveAssetKey,
                                            event.target.value,
                                          )
                                        }
                                      />
                                    </label>
                                    <div className="prompt-save-actions">
                                      <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={() => setActivePromptSaveAssetKey("")}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        className="secondary-button save-confirm-button"
                                        onClick={() =>
                                          confirmPromptSave(
                                            effectiveAssetKey,
                                            defaultPromptText,
                                          )
                                        }
                                      >
                                        Confirm Save Template
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                                <textarea
                                  className="dialogue-text-block workspace-text prompt-editor"
                                  value={promptText}
                                  onDragOver={(event) => event.preventDefault()}
                                  onDrop={(event) =>
                                    handlePromptTemplateDrop(event, effectiveAssetKey)
                                  }
                                  onChange={(event) =>
                                    updateAssetPromptDraft(
                                      effectiveAssetKey,
                                      event.target.value,
                                    )
                                  }
                                />
                                <div className="prompt-editor-footer">
                                  <span>
                                    Models: {modelConfig.models.map(getImageModelLabel).join(", ")}
                                  </span>
                                  <button
                                    type="button"
                                    className={
                                      showModelSettings
                                        ? "secondary-button active"
                                        : "secondary-button"
                                    }
                                    onClick={() =>
                                      setShowImageModelSettingsKey((current) =>
                                        current === effectiveAssetKey
                                          ? ""
                                          : effectiveAssetKey,
                                      )
                                    }
                                  >
                                    Model Settings
                                  </button>
                                </div>
                                {showModelSettings ? (
                                  <div className="model-settings-panel">
                                    <label className="save-field">
                                      <span>Generation Mode</span>
                                      <select
                                        className="workspace-input"
                                        value={modelConfig.mode}
                                        onChange={(event) =>
                                          updateImageGenerationMode(
                                            effectiveAssetKey,
                                            event.target.value as ImageModelConfig["mode"],
                                          )
                                        }
                                      >
                                        {imageGenerationModeOptions.map((option) => (
                                          <option
                                            key={option.value}
                                            value={option.value}
                                            disabled={option.disabled}
                                          >
                                            {option.label}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <div className="save-field model-picker-field">
                                      <span>Models</span>
                                      <div className="model-checkbox-list">
                                        {availableImageModelOptions.map((option) => (
                                          <label
                                            className="model-checkbox-item"
                                            key={option.value}
                                          >
                                            <input
                                              type="checkbox"
                                              checked={modelConfig.models.includes(option.value)}
                                              onChange={() =>
                                                toggleImageModel(
                                                  effectiveAssetKey,
                                                  option.value,
                                                )
                                              }
                                            />
                                            <span>{option.label}</span>
                                          </label>
                                        ))}
                                      </div>
                                    </div>
                                    <label className="save-field">
                                      <span>Size</span>
                                      <select
                                        className="workspace-input"
                                        value={modelConfig.size}
                                        onChange={(event) =>
                                          updateImageModelConfig(
                                            effectiveAssetKey,
                                            "size",
                                            event.target.value,
                                          )
                                        }
                                      >
                                        {imageSizeOptions.map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <label className="save-field">
                                      <span>Aspect Ratio</span>
                                      <select
                                        className="workspace-input"
                                        value={modelConfig.aspectRatio}
                                        onChange={(event) =>
                                          updateImageModelConfig(
                                            effectiveAssetKey,
                                            "aspectRatio",
                                            event.target.value,
                                          )
                                        }
                                      >
                                        {imageAspectRatioOptions.map((option) => (
                                          <option key={option} value={option}>
                                            {option}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <label className="save-field">
                                      <span>Output Format</span>
                                      <select
                                        className="workspace-input"
                                        value={modelConfig.outputFormat}
                                        onChange={(event) =>
                                          updateImageModelConfig(
                                            effectiveAssetKey,
                                            "outputFormat",
                                            event.target.value,
                                          )
                                        }
                                      >
                                        {imageOutputFormatOptions.map((option) => (
                                          <option key={option} value={option}>
                                            {option.toUpperCase()}
                                          </option>
                                        ))}
                                      </select>
                                    </label>
                                    <p className="model-settings-note">
                                      {isImageToImageMode
                                        ? "Image-to-image uses Gemini and Midjourney with the reference images above. Midjourney is async, so use Check Status if it is still processing."
                                        : "Text-to-image uses only the prompt text. Reference images are hidden for this mode."}
                                    </p>
                                  </div>
                                ) : null}
                              </div>

                              <div className="asset-actions">
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick={() => navigator.clipboard.writeText(promptText)}
                                >
                                  Copy
                                </button>
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick={() =>
                                    handleDownloadText(
                                      `${selectedAsset.title}-prompt.txt`,
                                      promptText,
                                    )
                                  }
                                >
                                  Download
                                </button>
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick={() => openSavePanel(sourceSaveTarget)}
                                >
                                  Save Asset
                                </button>
                                <button
                                  type="button"
                                  className={
                                    isGeneratingImage
                                      ? "generate-button compact loading"
                                      : "generate-button compact"
                                  }
                                  onClick={() =>
                                    void handleImageGeneration(
                                      effectiveAssetKey,
                                      promptText,
                                      selectedAsset.title,
                                      modelConfig,
                                    )
                                  }
                                  disabled={isGeneratingImage}
                                >
                                  {isGeneratingImage ? "Generating..." : "Asset Generation"}
                                </button>
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick={() => toggleReuse(effectiveAssetKey)}
                                >
                                  {reusedAssetKeys.includes(effectiveAssetKey) ? "Undo Reuse" : "Reuse"}
                                </button>
                                <button
                                  type="button"
                                  className="secondary-button danger-button"
                                  onClick={() => removeAsset(selectedAsset)}
                                >
                                  Delete
                                </button>
                              </div>

                              {activeSavePanelKey === sourceSaveTarget.panelKey
                                ? renderSavePanel(sourceSaveTarget)
                                : null}

                              {imageGenerationError ? (
                                <p className="asset-inline-error">{imageGenerationError}</p>
                              ) : null}

                              {imageResults.length ? (
                                <div className="workspace-image-card">
                                  <div className="workspace-preview-header">
                                    <div>
                                      <span className="panel-label">Latest Images</span>
                                      <h4>Generated image previews</h4>
                                    </div>
                                    {imageResult?.status === "completed" && imageResult.url ? (
                                    <div className="workspace-audio-actions">
                                      <a
                                        className="secondary-button image-download-link"
                                        href={imageResult.url}
                                        download={imageResult.filename}
                                        target="_blank"
                                        rel="noreferrer"
                                      >
                                        Download
                                      </a>
                                      <button
                                        type="button"
                                        className="secondary-button"
                                        onClick={() => openSavePanel(imageSaveTarget)}
                                      >
                                        Save
                                      </button>
                                    </div>
                                    ) : imageResult?.status === "processing" && imageResult.taskId ? (
                                      <div className="workspace-audio-actions">
                                        <button
                                          type="button"
                                          className="secondary-button"
                                          disabled={checkingImageStatusKeys.includes(
                                            `${effectiveAssetKey}:${imageResult.model}`,
                                          )}
                                          onClick={() =>
                                            handleImageStatusCheck(
                                              effectiveAssetKey,
                                              imageResult,
                                              selectedAsset.title,
                                            )
                                          }
                                        >
                                          {checkingImageStatusKeys.includes(
                                            `${effectiveAssetKey}:${imageResult.model}`,
                                          )
                                            ? "Checking..."
                                            : "Check Status"}
                                        </button>
                                      </div>
                                    ) : null}
                                  </div>
                                  {imageResult?.status === "completed" && imageResult.url ? (
                                  <>
                                  <img
                                    className="workspace-image-preview"
                                    src={imageResult.url}
                                    alt={`Generated preview for ${selectedAsset.title}`}
                                  />
                                  <p className="image-meta">
                                    {typeof imageResult.seed === "number"
                                      ? `Seed: ${imageResult.seed}`
                                      : "Seed: n/a"}
                                    {" · "}
                                    {typeof imageResult.inferenceMs === "number"
                                      ? `Inference: ${imageResult.inferenceMs} ms`
                                      : "Inference: n/a"}
                                  </p>
                                  {activeSavePanelKey === imageSaveTarget.panelKey
                                    ? renderSavePanel(imageSaveTarget)
                                    : null}
                                  </>
                                  ) : (
                                    <p className="image-meta">
                                      {imageResult?.status === "processing"
                                        ? `Task submitted. Task ID: ${imageResult.taskId ?? "n/a"}`
                                        : imageResult?.error ?? "Image generation is still waiting for an image URL."}
                                      {imageResult?.diagnostics
                                        ? ` ${formatImageDiagnostics(imageResult.diagnostics)}`
                                        : ""}
                                    </p>
                                  )}
                                  {imageResults.length > 1 ? (
                                    <div className="image-result-stack">
                                      {imageResults.slice(1).map((result) => {
                                        const perModelSaveTarget =
                                          createSaveTargetFromGeneratedImageResult(
                                            selectedAsset,
                                            result,
                                          );

                                        return (
                                          <div className="image-result-row" key={result.model}>
                                            <div>
                                              <strong>{getImageModelLabel(result.model)}</strong>
                                              <span>
                                                {result.status === "completed"
                                                  ? "Completed"
                                                  : result.status === "processing"
                                                    ? `Processing: ${result.taskId ?? "task submitted"}`
                                                    : result.error ?? "Failed"}
                                              </span>
                                              {result.diagnostics ? (
                                                <span>
                                                  {formatImageDiagnostics(result.diagnostics)}
                                                </span>
                                              ) : null}
                                            </div>
                                            {result.status === "completed" && result.url ? (
                                              <div className="workspace-audio-actions">
                                                <a
                                                  className="secondary-button image-download-link"
                                                  href={result.url}
                                                  download={result.filename}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                >
                                                  Download
                                                </a>
                                                <button
                                                  type="button"
                                                  className="secondary-button"
                                                  onClick={() =>
                                                    openSavePanel(perModelSaveTarget)
                                                  }
                                                >
                                                  Save
                                                </button>
                                              </div>
                                            ) : result.status === "processing" && result.taskId ? (
                                              <div className="workspace-audio-actions">
                                                <button
                                                  type="button"
                                                  className="secondary-button"
                                                  disabled={checkingImageStatusKeys.includes(
                                                    `${effectiveAssetKey}:${result.model}`,
                                                  )}
                                                  onClick={() =>
                                                    handleImageStatusCheck(
                                                      effectiveAssetKey,
                                                      result,
                                                      selectedAsset.title,
                                                    )
                                                  }
                                                >
                                                  {checkingImageStatusKeys.includes(
                                                    `${effectiveAssetKey}:${result.model}`,
                                                  )
                                                    ? "Checking..."
                                                    : "Check Status"}
                                                </button>
                                              </div>
                                            ) : null}
                                            {result.status === "completed" && result.url ? (
                                              <img
                                                className="workspace-image-preview"
                                                src={result.url}
                                                alt={`Generated preview for ${selectedAsset.title} from ${getImageModelLabel(result.model)}`}
                                              />
                                            ) : null}
                                            {activeSavePanelKey === perModelSaveTarget.panelKey
                                              ? renderSavePanel(perModelSaveTarget)
                                              : null}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  ) : null}
                                </div>
                              ) : null}
                            </>
                          );
                        })()
                      ) : null}
                    </section>
                  </section>

                  <div className="asset-footer-actions">
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={resetAssetList}
                    >
                      Reset Asset List
                    </button>
                  </div>
                </div>
              ) : (
                <section className="panel placeholder-panel">
                  <span className="panel-label">Ready to analyze</span>
                  <h2>Storyboard-driven asset workspace</h2>
                  <p>
                    Analyze the pasted storyboard to populate grouped sections for dialogue, characters, scenes, and
                    items. Each section is designed to separate reusable assets from new generations.
                  </p>
                </section>
              )}
            </section>
          </div>
        ) : activeTab === "editing" ? (
          <section className="video-editing-layout">
            {(() => {
              const roughCutSaveTarget = roughCutResult
                ? createSaveTargetFromRoughCut(roughCutResult)
                : null;

              return (
            <section className="panel video-editing-panel">
              <div className="panel-heading">
                <div>
                  <span className="panel-label">Video Editing</span>
                  <h2>Rough cut builder</h2>
                  <p>
                    Select local video files from the project library, arrange the order, then prepare a rough cut.
                    FFmpeg stitching is staged for the next backend pass.
                  </p>
                </div>
                <span className="status-chip ready">
                  {selectedVideoClips.length} clips selected
                </span>
              </div>

              <div className="video-editing-grid">
                <div className="rough-cut-list">
                  <div className="workspace-preview-header">
                    <div>
                      <span className="panel-label">Selected Clips</span>
                      <h4>Rough cut order</h4>
                    </div>
                  </div>

                  {selectedVideoClips.length ? (
                    <div className="clip-order-list">
                      {selectedVideoClips.map((clip, index) => (
                        <div className="clip-order-item" key={clip.relativePath}>
                          <span className="clip-order-index">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div>
                            <strong>{clip.name}</strong>
                            <span>{clip.relativePath}</span>
                          </div>
                          <div className="clip-order-actions">
                            <button
                              type="button"
                              className="secondary-button compact-icon"
                              onClick={() => moveVideoClip(index, -1)}
                              disabled={index === 0}
                            >
                              Up
                            </button>
                            <button
                              type="button"
                              className="secondary-button compact-icon"
                              onClick={() => moveVideoClip(index, 1)}
                              disabled={index === selectedVideoClips.length - 1}
                            >
                              Down
                            </button>
                            <button
                              type="button"
                              className="secondary-button danger-button compact-icon"
                              onClick={() => removeVideoClip(clip.relativePath)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="video-empty-state">
                      <span className="panel-label">No Clips Yet</span>
                      <p>
                        Use the checkboxes beside local video files in the project sidebar.
                      </p>
                    </div>
                  )}
                </div>

                <div className="rough-cut-output">
                  <div className="workspace-preview-header">
                    <div>
                      <span className="panel-label">Output</span>
                      <h4>Combined video placeholder</h4>
                    </div>
                  </div>
                  <div className="preview-frame rough-cut-preview">
                    {roughCutResult ? (
                      <div>
                        <strong>{roughCutResult.fileName}</strong>
                        <p>{roughCutResult.message}</p>
                        <span>
                          {roughCutResult.clipCount} clips · {roughCutResult.aspectRatio}
                        </span>
                        <video
                          className="rough-cut-video"
                          controls
                          src={roughCutResult.previewUrl}
                        >
                          Your browser does not support the video element.
                        </video>
                      </div>
                    ) : (
                      <div>
                        <strong>Rough cut will appear here</strong>
                        <p>Backend FFmpeg stitching is not connected yet.</p>
                      </div>
                    )}
                  </div>

                  <div className="rough-cut-settings">
                    <label className="save-field">
                      <span>Output Ratio</span>
                      <select
                        className="workspace-input"
                        value={roughCutAspectRatio}
                        onChange={(event) =>
                          setRoughCutAspectRatio(
                            event.target.value === "9:16" ? "9:16" : "16:9",
                          )
                        }
                      >
                        <option value="16:9">16:9 · 1280x720</option>
                        <option value="9:16">9:16 · 720x1280</option>
                      </select>
                    </label>
                  </div>

                  <div className="asset-actions">
                    <button
                      type="button"
                      className={
                        isCombiningVideos
                          ? "generate-button compact loading"
                          : "generate-button compact"
                      }
                      onClick={() => void handleCombineVideos()}
                      disabled={!selectedVideoClips.length || isCombiningVideos}
                    >
                      {isCombiningVideos ? "Preparing..." : "Combine Videos"}
                    </button>
                    <a
                      className={
                        roughCutResult
                          ? "secondary-button image-download-link"
                          : "secondary-button disabled-link"
                      }
                      href={roughCutResult?.downloadUrl ?? "#"}
                      download={roughCutResult?.fileName}
                      aria-disabled={!roughCutResult}
                      onClick={(event) => {
                        if (!roughCutResult) {
                          event.preventDefault();
                        }
                      }}
                    >
                      Download
                    </a>
                    <button
                      type="button"
                      className="secondary-button"
                      disabled={!roughCutSaveTarget}
                      onClick={() => {
                        if (roughCutSaveTarget) {
                          openSavePanel(roughCutSaveTarget);
                        }
                      }}
                    >
                      Save
                    </button>
                  </div>

                  {roughCutSaveTarget &&
                  activeSavePanelKey === roughCutSaveTarget.panelKey
                    ? renderSavePanel(roughCutSaveTarget)
                    : null}

                  {videoEditingError ? (
                    <p className="asset-inline-error">{videoEditingError}</p>
                  ) : null}
                  <p className="model-settings-note">
                    Clips are normalized to 720p, 24fps, H.264/AAC before stitching.
                    Save defaults to {projectRootPath}\rough_cuts and lets you rename the file.
                  </p>
                </div>
              </div>
            </section>
              );
            })()}
          </section>
        ) : (
          <section className="panel placeholder-panel">
            <span className="panel-label">Project-linked preview</span>
            <h2>Video generation workspace</h2>
            <p>
              This tab will later let you pull saved VO, scene frames, character references, and item assets directly
              from the project library before sending them into a video generation flow.
            </p>
            <div className="placeholder-note">
              <span className="dot" />
              Future step: select saved project assets for video generation
            </div>
          </section>
        )}
      </section>
      </div>
    </main>
  );
}

"use client";

import { type DragEvent, useEffect, useRef, useState } from "react";
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

type TabKey = "scenes" | "video" | "assets";
type AssetKind = "dialogue" | "character" | "scene" | "item";
type AssetListEntry =
  | { kind: "dialogue"; id: string; title: string; subtitle: string; status: "reuse" | "ready"; asset: DialogueAsset }
  | { kind: "character" | "scene" | "item"; id: string; title: string; subtitle: string; status: "reuse" | "ready"; asset: VisualAsset };
type DialogueAudioResult = {
  url: string;
  filename: string;
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
      };
};
type ProjectFileNode = {
  name: string;
  relativePath: string;
  kind: "directory" | "file";
  children?: ProjectFileNode[];
};
type PromptTemplate = {
  fileName: string;
  content: string;
};
type PromptSaveDraft = {
  fileName: string;
};
type PromptSaveState = "idle" | "saved";

const emptyAssetAnalysis: AssetAnalysisResult = {
  dialogues: [],
  characters: [],
  scenes: [],
  items: [],
};

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
  const [dialogueDrafts, setDialogueDrafts] = useState<Record<string, string>>({});
  const [dialogueOriginals, setDialogueOriginals] = useState<Record<string, string>>({});
  const [dialogueVoiceIds, setDialogueVoiceIds] = useState<Record<string, string>>({});
  const [dialogueAudioResults, setDialogueAudioResults] = useState<
    Record<string, DialogueAudioResult>
  >({});
  const [showVoiceTaggingPrompt, setShowVoiceTaggingPrompt] = useState(false);
  const [voiceTaggingSystemPrompt, setVoiceTaggingSystemPrompt] = useState(() =>
    getDefaultSystemPrompt("voice_tagging"),
  );
  const [isVoiceTagging, setIsVoiceTagging] = useState(false);
  const [voiceTaggingError, setVoiceTaggingError] = useState("");
  const [isGeneratingTts, setIsGeneratingTts] = useState(false);
  const [ttsError, setTtsError] = useState("");
  const dialogueAudioResultsRef = useRef<Record<string, DialogueAudioResult>>({});
  const [isProjectSidebarCollapsed, setIsProjectSidebarCollapsed] = useState(true);
  const [projectTreeOpen, setProjectTreeOpen] = useState(false);
  const [projectRootInput, setProjectRootInput] = useState(DEFAULT_PROJECT_ROOT_FOLDER);
  const [projectRootPath, setProjectRootPath] = useState(DEFAULT_PROJECT_ROOT_FOLDER);
  const [projectTree, setProjectTree] = useState<ProjectFileNode | null>(null);
  const [openProjectNodePaths, setOpenProjectNodePaths] = useState<Record<string, boolean>>({});
  const [isRefreshingProjectTree, setIsRefreshingProjectTree] = useState(false);
  const [projectTreeError, setProjectTreeError] = useState("");
  const [isPromptSidebarCollapsed, setIsPromptSidebarCollapsed] = useState(false);
  const [promptLibraryCollapsed, setPromptLibraryCollapsed] = useState(false);
  const [promptTemplates, setPromptTemplates] = useState<PromptTemplate[]>([]);
  const [isLoadingPromptTemplates, setIsLoadingPromptTemplates] = useState(false);
  const [promptLibraryError, setPromptLibraryError] = useState("");
  const [promptSaveStates, setPromptSaveStates] = useState<Record<string, PromptSaveState>>({});
  const [activePromptSaveAssetKey, setActivePromptSaveAssetKey] = useState("");
  const [promptSaveDrafts, setPromptSaveDrafts] = useState<Record<string, PromptSaveDraft>>({});
  const [saveDrafts, setSaveDrafts] = useState<Record<string, SaveDraft>>({});
  const [activeSavePanelKey, setActiveSavePanelKey] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

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
      setDialogueDrafts({});
      setDialogueVoiceIds({});
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

      setProjectTree(data.tree);
      setProjectRootPath(rootPath);
      setOpenProjectNodePaths((current) => ({
        ...current,
        [data.tree.relativePath || "__root__"]: true,
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
      const response = await fetch("/api/prompt-library", {
        method: "GET",
      });

      const data = (await response.json()) as {
        templates?: PromptTemplate[];
        error?: string;
      };

      if (!response.ok || !data.templates) {
        throw new Error(data.error ?? "Failed to load prompt templates.");
      }

      setPromptTemplates(data.templates);
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

  async function handleDeletePromptTemplate(fileName: string) {
    setPromptLibraryError("");

    try {
      const response = await fetch("/api/prompt-library", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName }),
      });

      const data = (await response.json()) as {
        deleted?: boolean;
        error?: string;
      };

      if (!response.ok || !data.deleted) {
        throw new Error(data.error ?? "Failed to delete the prompt template.");
      }

      setPromptTemplates((current) =>
        current.filter((template) => template.fileName !== fileName),
      );
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
          : {
              rootPath: projectRootPath,
              relativeFolder: trimmedPath,
              fileName: trimmedName,
              extension: target.extension,
              base64Content: await blobUrlToBase64(target.source.url),
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

  function renderProjectTree(node: ProjectFileNode): JSX.Element {
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
                <div
                  key={`${child.kind}:${child.relativePath}`}
                  className="project-asset-item file"
                >
                  <strong>{child.name}</strong>
                  <span>{child.relativePath}</span>
                </div>
              ),
            )}
          </div>
        ) : null}
      </div>
    );
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

  function handlePromptTemplateSave(assetKey: string, fallbackPrompt: string) {
    const promptText = assetPromptDrafts[assetKey] ?? fallbackPrompt;
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

        setPromptTemplates((current) => {
          const next = current.filter(
            (template) => template.fileName !== data.template?.fileName,
          );

          return [...next, data.template].sort((a, b) =>
            a.fileName.localeCompare(b.fileName),
          );
        });
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

  function confirmPromptSave(assetKey: string, fallbackPrompt: string) {
    handlePromptTemplateSave(assetKey, fallbackPrompt);
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
    clearDialogueAudioResult(removedKey);
    setHasAnalyzedAssets(nextAssetList.length > 0);
  }

  function resetAssetList() {
    setAssetAnalysis(emptyAssetAnalysis);
    setManualAssets([]);
    setReusedAssetKeys([]);
    setAssetPromptDrafts({});
    setDialogueDrafts({});
    setDialogueVoiceIds({});
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
                        onClick={() => void handleDeletePromptTemplate(template.fileName)}
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
        </nav>

        {activeTab === "scenes" ? (
          <div className="storyboard-layout">
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
                  <pre>{sceneText}</pre>
                ) : (
                  <div className="empty-state">
                    <p className="empty-kicker">Ready when you are</p>
                    <p>
                      Your generated scene text will appear here after the AI request completes.
                    </p>
                  </div>
                )}
              </div>
            </section>
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
                          const promptSaveState =
                            promptSaveStates[effectiveAssetKey] ?? "idle";
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
                                <button type="button" className="secondary-button">
                                  Asset Generation
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

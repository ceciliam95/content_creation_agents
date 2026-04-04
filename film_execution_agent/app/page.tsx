"use client";

import { useState } from "react";
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
  getTaskStylePromptConfig,
  listTaskStyleOptions,
  type RegistryTask,
} from "@/lib/task-style-registry";

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
type VoiceRole = "Narrator" | "Lead Female" | "Lead Male" | "Young Female" | "Young Male";

const emptyAssetAnalysis: AssetAnalysisResult = {
  dialogues: [],
  characters: [],
  scenes: [],
  items: [],
};

const dialogueStyleOptions = listTaskStyleOptions("dialogue_tts");
const characterStyleOptions = listTaskStyleOptions("character_image");
const sceneStyleOptions = listTaskStyleOptions("scene_image");
const itemStyleOptions = listTaskStyleOptions("item_image");
const voiceRoleOptions: VoiceRole[] = [
  "Narrator",
  "Lead Female",
  "Lead Male",
  "Young Female",
  "Young Male",
];

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
  const [dialogueStyle, setDialogueStyle] = useState(dialogueStyleOptions[0]?.value ?? "natural_drama");
  const [characterStyle, setCharacterStyle] = useState(characterStyleOptions[0]?.value ?? "2d_animation");
  const [sceneStyle, setSceneStyle] = useState(sceneStyleOptions[0]?.value ?? "2d_animation");
  const [itemStyle, setItemStyle] = useState(itemStyleOptions[0]?.value ?? "product_clean");
  const [selectedAssetKey, setSelectedAssetKey] = useState("");
  const [voiceRole, setVoiceRole] = useState<VoiceRole>("Narrator");
  const [reusedAssetKeys, setReusedAssetKeys] = useState<string[]>([]);
  const [assetPromptDrafts, setAssetPromptDrafts] = useState<Record<string, string>>({});
  const [dialogueDrafts, setDialogueDrafts] = useState<Record<string, string>>({});
  const [dialogueOriginals, setDialogueOriginals] = useState<Record<string, string>>({});
  const [showVoiceTaggingPrompt, setShowVoiceTaggingPrompt] = useState(false);
  const [voiceTaggingSystemPrompt, setVoiceTaggingSystemPrompt] = useState(() =>
    getDefaultSystemPrompt("voice_tagging"),
  );
  const [isVoiceTagging, setIsVoiceTagging] = useState(false);
  const [voiceTaggingError, setVoiceTaggingError] = useState("");

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
      setDialogueOriginals(
        Object.fromEntries(
          result.dialogues.map((asset) => [`dialogue:${asset.id}`, asset.text]),
        ),
      );
      setVoiceTaggingError("");

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

  function removeAsset(assetToRemove: AssetListEntry) {
    setAssetAnalysis((current) => {
      const next: AssetAnalysisResult = {
        dialogues:
          assetToRemove.kind === "dialogue"
            ? current.dialogues.filter((asset) => asset.id !== assetToRemove.id)
            : current.dialogues,
        characters:
          assetToRemove.kind === "character"
            ? current.characters.filter((asset) => asset.id !== assetToRemove.id)
            : current.characters,
        scenes:
          assetToRemove.kind === "scene"
            ? current.scenes.filter((asset) => asset.id !== assetToRemove.id)
            : current.scenes,
        items:
          assetToRemove.kind === "item"
            ? current.items.filter((asset) => asset.id !== assetToRemove.id)
            : current.items,
      };

      const nextList: AssetListEntry[] = [
        ...next.dialogues.map((asset) => ({
          kind: "dialogue" as const,
          id: asset.id,
          title: asset.character,
          subtitle: "Dialogue",
          status: asset.status,
          asset,
        })),
        ...next.characters.map((asset) => ({
          kind: "character" as const,
          id: asset.id,
          title: asset.name,
          subtitle: "Character",
          status: asset.status,
          asset,
        })),
        ...next.scenes.map((asset) => ({
          kind: "scene" as const,
          id: asset.id,
          title: asset.name,
          subtitle: "Scene",
          status: asset.status,
          asset,
        })),
        ...next.items.map((asset) => ({
          kind: "item" as const,
          id: asset.id,
          title: asset.name,
          subtitle: "Item",
          status: asset.status,
          asset,
        })),
      ];

      const removedKey = `${assetToRemove.kind}:${assetToRemove.id}`;
      const remainingSelected = nextList.find((asset) => `${asset.kind}:${asset.id}` !== removedKey);
      setSelectedAssetKey(remainingSelected ? `${remainingSelected.kind}:${remainingSelected.id}` : "");
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
      setHasAnalyzedAssets(nextList.length > 0);

      return next;
    });
  }

  function resetAssetList() {
    setAssetAnalysis(emptyAssetAnalysis);
    setManualAssets([]);
    setReusedAssetKeys([]);
    setAssetPromptDrafts({});
    setDialogueDrafts({});
    setDialogueOriginals({});
    setSelectedAssetKey("");
    setHasAnalyzedAssets(false);
    setAssetAnalysisError("");
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

  function getVisualWorkspaceConfig(kind: Exclude<AssetKind, "dialogue">) {
    if (kind === "character") {
      return {
        task: "character_image" as RegistryTask,
        style: characterStyle,
        setStyle: setCharacterStyle,
        styleOptions: characterStyleOptions,
        taskOptions: [
          { value: "turnaround_views", label: "Character Turnaround" },
          { value: "identity_sheet", label: "Identity Sheet" },
        ],
        selectedTask: "turnaround_views",
        generateLabel: "Asset Generation",
      };
    }

    if (kind === "scene") {
      return {
        task: "scene_image" as RegistryTask,
        style: sceneStyle,
        setStyle: setSceneStyle,
        styleOptions: sceneStyleOptions,
        taskOptions: [
          { value: "scene_frame", label: "Scene Frame" },
          { value: "environment_sheet", label: "Environment Sheet" },
        ],
        selectedTask: "scene_frame",
        generateLabel: "Asset Generation",
      };
    }

    return {
      task: "item_image" as RegistryTask,
      style: itemStyle,
      setStyle: setItemStyle,
      styleOptions: itemStyleOptions,
      taskOptions: [
        { value: "prop_reference", label: "Prop Reference" },
        { value: "hero_prop", label: "Hero Prop Shot" },
      ],
      selectedTask: "prop_reference",
      generateLabel: "Asset Generation",
    };
  }

  return (
    <main className="page-shell">
      <div className="atmosphere atmosphere-left" />
      <div className="atmosphere atmosphere-right" />

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
                              <span>Voice style</span>
                              <select
                                value={dialogueStyle}
                                onChange={(event) => setDialogueStyle(event.target.value)}
                              >
                                {dialogueStyleOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="asset-style-picker compact">
                              <span>Voice role</span>
                              <select
                                value={voiceRole}
                                onChange={(event) => setVoiceRole(event.target.value as VoiceRole)}
                              >
                                {voiceRoleOptions.map((option) => (
                                  <option key={option} value={option}>
                                    {option}
                                  </option>
                                ))}
                              </select>
                            </div>
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
                            <button type="button" className="secondary-button">
                              TTS Generation
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
                        </>
                          );
                        })()
                      ) : selectedAsset ? (
                        (() => {
                          const visualConfig = getVisualWorkspaceConfig(selectedAsset.kind);
                          const styleConfig = getTaskStylePromptConfig(
                            visualConfig.task,
                            visualConfig.style,
                          );
                          const defaultPromptText = styleConfig.userPromptTemplate.replace(
                            "{{input}}",
                            `${selectedAsset.title}\n${selectedAsset.asset.detail}`,
                          );
                          const promptText =
                            assetPromptDrafts[effectiveAssetKey] ?? defaultPromptText;

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

                              <div className="workspace-controls">
                                <div className="asset-style-picker compact">
                                  <span>Generation task</span>
                                  <select defaultValue={visualConfig.selectedTask}>
                                    {visualConfig.taskOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="asset-style-picker compact">
                                  <span>Style</span>
                                  <select
                                    value={visualConfig.style}
                                    onChange={(event) => visualConfig.setStyle(event.target.value)}
                                  >
                                    {visualConfig.styleOptions.map((option) => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>

                              <div className="workspace-preview-card">
                                <span className="panel-label">Prompt preview</span>
                                <textarea
                                  className="dialogue-text-block workspace-text prompt-editor"
                                  value={promptText}
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
            <span className="panel-label">Coming next</span>
            <h2>Storyboard to video</h2>
            <p>
              This area will later handle the flow of sending storyboard text to an API for video generation. For now,
              it stays as a simple placeholder.
            </p>
            <div className="placeholder-note">
              <span className="dot" />
              Video generation module placeholder
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

"use client";

import { useState } from "react";

const sampleScript = `5 a.m. The city is not fully awake yet. She stands outside a corner convenience store holding a hot coffee, watching the bus stop across the street. The wind lifts her hair as a bus slowly approaches in the distance.`;
const defaultSystemPrompt = `把输入剧本变成分镜表。输出 txt 文档，格式要求：人物： xxx,  场景 xxx,  分镜： 1.景别， 构图， 运镜， 机位, 光影，时长 （5s)  画面内容： Ma深吸一口气站直身体双手轻压桌面纸张,Eleanor坐在窗边椅子上背脊挺直侧脸冷静, 台词(人物感情)： xxx. 

输出范例： SCENE 1

人物：Eleanor, Duke
地点：Study（书房）

1

景别： Close-up
构图： Eleanor面部居中，背景书架虚化
运镜： 轻推镜
机位： 平视
光影： 冷光
画面内容： Eleanor缓慢抬头直视前方，双手在胸前交握后慢慢收紧，呼吸压低
台词（VO）：
"Eleanor Hackket is the daughter of an Earl."

要求：1. 在同一场景的人物必须一致，不可出现名字变化。 2.画面内容描写人物具体，可表演。 Do: Ma 神情悲伤，眉头微皱，眼角含泪； Don't: Ma 感到悲伤。 2. 台词必须保持和剧本一致，其他则输出中文。`;

type TabKey = "scenes" | "video" | "assets";

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>("scenes");
  const [script, setScript] = useState(sampleScript);
  const [sceneText, setSceneText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(defaultSystemPrompt);
  const [generationError, setGenerationError] = useState("");

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
          <section className="panel placeholder-panel">
            <span className="panel-label">Coming next</span>
            <h2>Asset generation</h2>
            <p>
              This area will later support generating visual assets, references, and production-ready materials from
              selected scenes. For now, it remains a lightweight placeholder.
            </p>
            <div className="placeholder-note">
              <span className="dot" />
              Asset generation module placeholder
            </div>
          </section>
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

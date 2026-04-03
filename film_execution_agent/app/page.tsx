"use client";

import { useState } from "react";

const sampleScript = `5 a.m. The city is not fully awake yet. She stands outside a corner convenience store holding a hot coffee, watching the bus stop across the street. The wind lifts her hair as a bus slowly approaches in the distance.`;

const mockStoryboard = `01. Wide shot of the early morning street, with a cool and quiet atmosphere.
02. The protagonist stands outside the convenience store holding a cup of hot coffee.
03. A closer moment as the wind moves her hair and sleeve, holding on her expression.
04. The bus approaches from the far end of the street, its headlights cutting through the blue-gray air.
05. Her gaze stays fixed on the bus stop, leaving a final beat of stillness and anticipation.`;

type TabKey = "storyboard" | "video";

export default function Page() {
  const [activeTab, setActiveTab] = useState<TabKey>("storyboard");
  const [script, setScript] = useState(sampleScript);
  const [storyboardText, setStoryboardText] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  function handleGenerate() {
    if (!script.trim() || isGenerating) {
      return;
    }

    setIsGenerating(true);
    setHasGenerated(false);
    setStoryboardText("");

    window.setTimeout(() => {
      setStoryboardText(mockStoryboard);
      setIsGenerating(false);
      setHasGenerated(true);
      setCopyState("idle");
    }, 1800);
  }

  async function handleCopy() {
    if (!storyboardText) {
      return;
    }

    await navigator.clipboard.writeText(storyboardText);
    setCopyState("copied");

    window.setTimeout(() => {
      setCopyState("idle");
    }, 1600);
  }

  function handleDownload() {
    if (!storyboardText) {
      return;
    }

    const blob = new Blob([storyboardText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "storyboard.txt";
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
            className={activeTab === "storyboard" ? "tab active" : "tab"}
            onClick={() => setActiveTab("storyboard")}
          >
            Script to Storyboard
          </button>
          <button
            type="button"
            className={activeTab === "video" ? "tab active" : "tab"}
            onClick={() => setActiveTab("video")}
          >
            Video Generation
          </button>
        </nav>

        {activeTab === "storyboard" ? (
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
                <p className="support-copy">Prototype only. No API calls, just a visual mock flow.</p>
                <button
                  type="button"
                  className={isGenerating ? "generate-button loading" : "generate-button"}
                  onClick={handleGenerate}
                  disabled={!script.trim() || isGenerating}
                >
                  {isGenerating ? "Generating..." : "Generate Storyboard"}
                </button>
              </div>
            </section>

            <section className="panel panel-output">
              <div className="panel-heading">
                <div className="panel-copy">
                  <span className="panel-label">Output</span>
                  <h2>Storyboard text</h2>
                  <p>Keep the result in pure text form so the prototype stays light, calm, and easy to scan.</p>
                </div>
                <div className="output-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleCopy}
                    disabled={!storyboardText || isGenerating}
                  >
                    {copyState === "copied" ? "Copied" : "Copy"}
                  </button>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={handleDownload}
                    disabled={!storyboardText || isGenerating}
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
                    <p className="loading-label">Generating storyboard...</p>
                    <p className="loading-subcopy">AI is turning your script into a first-pass storyboard text.</p>
                    <span className="loading-line short" />
                    <span className="loading-line medium" />
                    <span className="loading-line long" />
                    <span className="loading-line medium" />
                  </div>
                ) : storyboardText ? (
                  <pre>{storyboardText}</pre>
                ) : (
                  <div className="empty-state">
                    <p className="empty-kicker">Ready when you are</p>
                    <p>
                      Your generated storyboard text will appear here. This version only simulates the front-end flow,
                      without a real model or backend.
                    </p>
                  </div>
                )}
              </div>
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

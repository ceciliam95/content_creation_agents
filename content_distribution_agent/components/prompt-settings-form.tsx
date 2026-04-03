"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createEmptyTemplateDraft,
  selectTemplateForEdit
} from "@/lib/prompt-settings-state";
import type { PromptConfig, PromptPlatformKey } from "@/lib/prompt-defaults";

const platformLabels: Record<PromptPlatformKey, string> = {
  wechat: "公众号",
  xiaohongshu: "小红书",
  twitter: "Twitter",
  videoScript: "视频脚本"
};

type TemplateDraft = {
  id?: string;
  name: string;
  prompt: string;
};

export function PromptSettingsForm() {
  const [config, setConfig] = useState<PromptConfig | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<PromptPlatformKey>("wechat");
  const [draft, setDraft] = useState<TemplateDraft>(createEmptyTemplateDraft());
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void loadConfig();
  }, []);

  useEffect(() => {
    if (!config) {
      return;
    }

    const platformConfig = config[selectedPlatform];
    const nextTemplateId = editingTemplateId ?? platformConfig.activeTemplateId;

    try {
      setDraft(
        selectTemplateForEdit({
          templates: platformConfig.templates,
          templateId: nextTemplateId
        })
      );
      setEditingTemplateId(nextTemplateId);
    } catch {
      setDraft(createEmptyTemplateDraft());
      setEditingTemplateId(null);
    }
  }, [config, selectedPlatform, editingTemplateId]);

  async function loadConfig() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/prompt-settings");
      const payload = (await response.json()) as { config?: PromptConfig; error?: string };

      if (!response.ok || !payload.config) {
        throw new Error(payload.error ?? "加载设置失败。");
      }

      setConfig(payload.config);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载设置失败。");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!draft.name.trim() || !draft.prompt.trim()) {
      setError("模板名称和提示词内容不能为空。");
      return;
    }

    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/prompt-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action: "saveTemplate",
          platform: selectedPlatform,
          template: draft
        })
      });

      const payload = (await response.json()) as {
        config?: PromptConfig;
        error?: string;
      };

      if (!response.ok || !payload.config) {
        throw new Error(payload.error ?? "保存失败。");
      }

      setConfig(payload.config);
      const matchedTemplate = payload.config[selectedPlatform].templates.find(
        (item) => item.name === draft.name.trim() && item.prompt === draft.prompt.trim()
      );
      setEditingTemplateId(matchedTemplate?.id ?? null);
      setNotice("模板已保存。");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function handleSetActive(templateId: string) {
    await mutateConfig({
      action: "setActiveTemplate",
      templateId,
      successMessage: "已切换当前生效模板。"
    });
  }

  async function handleDelete(templateId: string) {
    await mutateConfig({
      action: "deleteTemplate",
      templateId,
      successMessage: "模板已删除。"
    });
  }

  async function mutateConfig({
    action,
    templateId,
    successMessage
  }: {
    action: "setActiveTemplate" | "deleteTemplate";
    templateId: string;
    successMessage: string;
  }) {
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch("/api/prompt-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          action,
          platform: selectedPlatform,
          templateId
        })
      });

      const payload = (await response.json()) as { config?: PromptConfig; error?: string };

      if (!response.ok || !payload.config) {
        throw new Error(payload.error ?? "设置更新失败。");
      }

      setConfig(payload.config);
      const nextPlatformConfig = payload.config[selectedPlatform];
      const nextSelectedId =
        action === "deleteTemplate" ? nextPlatformConfig.activeTemplateId : templateId;
      setEditingTemplateId(nextSelectedId);
      setDraft(
        selectTemplateForEdit({
          templates: nextPlatformConfig.templates,
          templateId: nextSelectedId
        })
      );
      setNotice(successMessage);
    } catch (mutationError) {
      setError(mutationError instanceof Error ? mutationError.message : "设置更新失败。");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <main className="settings-page">正在加载平台提示词设置...</main>;
  }

  if (!config) {
    return <main className="settings-page">设置加载失败，请刷新后重试。</main>;
  }

  const platformConfig = config[selectedPlatform];
  const activeTemplateName =
    platformConfig.templates.find((item) => item.id === platformConfig.activeTemplateId)?.name ?? "未设置";

  return (
    <main className="settings-page">
      <div className="settings-header">
        <div>
          <p className="eyebrow">Prompt Settings</p>
          <h1>平台提示词设置</h1>
        </div>
        <Link href="/" className="tab-button">
          返回创作台
        </Link>
      </div>

      <div className="settings-layout">
        <aside className="settings-platforms editor-surface">
          {Object.entries(platformLabels).map(([platform, label]) => (
            <button
              key={platform}
              type="button"
              className={platform === selectedPlatform ? "settings-platform active" : "settings-platform"}
              onClick={() => setSelectedPlatform(platform as PromptPlatformKey)}
            >
              {label}
            </button>
          ))}
        </aside>

        <section className="editor-surface settings-main">
          <div className="settings-main-header">
            <div>
              <h2>{platformLabels[selectedPlatform]}模板</h2>
              <p className="settings-subtle">当前生效模板：{activeTemplateName}</p>
            </div>
            <button
              type="button"
              className="tab-button"
              onClick={() => {
                setEditingTemplateId(null);
                setDraft(createEmptyTemplateDraft());
                setNotice(null);
                setError(null);
              }}
            >
              新建模板
            </button>
          </div>

          <div className="settings-template-list">
            {platformConfig.templates.map((template) => (
              <div key={template.id} className="settings-template-card">
                <div className="settings-template-copy">
                  <strong>{template.name}</strong>
                  {template.id === platformConfig.activeTemplateId ? (
                    <span className="tag-pill">生效中</span>
                  ) : null}
                </div>
                <div className="action-row">
                  <button
                    type="button"
                    className="tab-button"
                    onClick={() => {
                      setEditingTemplateId(template.id);
                      setDraft(
                        selectTemplateForEdit({
                          templates: platformConfig.templates,
                          templateId: template.id
                        })
                      );
                    }}
                  >
                    编辑
                  </button>
                  {template.id !== platformConfig.activeTemplateId ? (
                    <button
                      type="button"
                      className="tab-button"
                      onClick={() => void handleSetActive(template.id)}
                    >
                      设为生效
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="tab-button"
                    onClick={() => void handleDelete(template.id)}
                  >
                    删除
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="settings-form-grid">
            <label className="settings-field">
              <span>模板名称</span>
              <input
                className="field-input"
                value={draft.name}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    name: event.target.value
                  }))
                }
              />
            </label>
            <label className="settings-field">
              <span>System Prompt</span>
              <textarea
                className="field-area tall"
                value={draft.prompt}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    prompt: event.target.value
                  }))
                }
              />
            </label>
          </div>

          {error ? <p className="notice error">{error}</p> : null}
          {notice ? <p className="notice">{notice}</p> : null}

          <div className="action-row">
            <button
              type="button"
              className="tab-button"
              onClick={() => {
                const nextTemplateId = platformConfig.activeTemplateId;
                setEditingTemplateId(nextTemplateId);
                setDraft(
                  selectTemplateForEdit({
                    templates: platformConfig.templates,
                    templateId: nextTemplateId
                  })
                );
                setNotice(null);
                setError(null);
              }}
            >
              重置
            </button>
            <button
              type="button"
              className="primary-button settings-save-button"
              disabled={saving}
              onClick={() => void handleSave()}
            >
              {saving ? "保存中..." : "保存"}
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

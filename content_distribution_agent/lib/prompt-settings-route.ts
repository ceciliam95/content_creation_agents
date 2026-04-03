import { NextResponse } from "next/server";
import { createPromptConfigStore } from "@/lib/prompt-config-store";
import type { PromptConfig, PromptPlatformKey } from "@/lib/prompt-defaults";

type PromptSettingsRequestBody = {
  action?: string;
  platform?: PromptPlatformKey;
  template?: { id?: string; name?: string; prompt?: string };
  templateId?: string;
};

type PromptSettingsStore = {
  readConfig: () => Promise<PromptConfig>;
  saveTemplate?: (input: {
    platform: PromptPlatformKey;
    template: { id?: string; name: string; prompt: string };
  }) => Promise<unknown>;
  setActiveTemplate?: (input: {
    platform: PromptPlatformKey;
    templateId: string;
  }) => Promise<PromptConfig>;
  deleteTemplate?: (input: {
    platform: PromptPlatformKey;
    templateId: string;
  }) => Promise<PromptConfig>;
};

export function createPromptSettingsHandlers({
  store = createPromptConfigStore()
}: {
  store?: PromptSettingsStore;
} = {}) {
  return {
    async GET() {
      const config = await store.readConfig();
      return NextResponse.json({ config });
    },
    async POST(request: Request) {
      let body: PromptSettingsRequestBody;

      try {
        body = (await request.json()) as PromptSettingsRequestBody;
      } catch {
        return NextResponse.json({ error: "请求体不是合法的 JSON。" }, { status: 400 });
      }

      const action = body.action;
      const platform = body.platform;

      if (!action || !platform) {
        return NextResponse.json({ error: "缺少 action 或 platform。" }, { status: 400 });
      }

      try {
        if (action === "saveTemplate") {
          const template = body.template;

          if (!template?.name?.trim() || !template.prompt?.trim() || !store.saveTemplate) {
            return NextResponse.json({ error: "缺少模板名称或提示词内容。" }, { status: 400 });
          }

          const maybeConfig = await store.saveTemplate({
            platform,
            template: {
              id: template.id,
              name: template.name.trim(),
              prompt: template.prompt.trim()
            }
          });

          const config = isPromptConfig(maybeConfig) ? maybeConfig : await store.readConfig();
          return NextResponse.json({
            config,
            savedTemplate: {
              id: template.id,
              name: template.name.trim(),
              prompt: template.prompt.trim()
            }
          });
        }

        if (action === "setActiveTemplate") {
          if (!body.templateId || !store.setActiveTemplate) {
            return NextResponse.json({ error: "缺少 templateId。" }, { status: 400 });
          }

          const config = await store.setActiveTemplate({
            platform,
            templateId: body.templateId
          });
          return NextResponse.json({ config });
        }

        if (action === "deleteTemplate") {
          if (!body.templateId || !store.deleteTemplate) {
            return NextResponse.json({ error: "缺少 templateId。" }, { status: 400 });
          }

          const config = await store.deleteTemplate({
            platform,
            templateId: body.templateId
          });
          return NextResponse.json({ config });
        }

        return NextResponse.json({ error: "不支持的 action。" }, { status: 400 });
      } catch (error) {
        const message = error instanceof Error ? error.message : "设置保存失败。";
        return NextResponse.json({ error: message }, { status: 500 });
      }
    }
  };
}

function isPromptConfig(value: unknown): value is PromptConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "wechat" in value &&
    "xiaohongshu" in value &&
    "twitter" in value &&
    "videoScript" in value
  );
}

import path from "node:path";
import { promises as fs } from "node:fs";
import {
  promptDefaults,
  type PromptConfig,
  type PromptPlatformKey,
  type PromptTemplate
} from "@/lib/prompt-defaults";

const defaultConfigPath = path.join(process.cwd(), "config", "prompt-templates.json");

export function createPromptConfigStore({
  configPath = defaultConfigPath
}: {
  configPath?: string;
} = {}) {
  return {
    async readConfig() {
      return ensureConfigFile(configPath);
    },
    async saveTemplate({
      platform,
      template
    }: {
      platform: PromptPlatformKey;
      template: Pick<PromptTemplate, "name" | "prompt"> & Partial<Pick<PromptTemplate, "id">>;
    }) {
      const config = await ensureConfigFile(configPath);
      const current = config[platform];
      const templateId = template.id ?? `${platform}-${Date.now()}`;
      const nextTemplate: PromptTemplate = {
        id: templateId,
        name: template.name,
        prompt: template.prompt,
        updatedAt: new Date().toISOString()
      };
      const existingIndex = current.templates.findIndex((item) => item.id === templateId);
      const nextTemplates = [...current.templates];

      if (existingIndex >= 0) {
        nextTemplates[existingIndex] = nextTemplate;
      } else {
        nextTemplates.unshift(nextTemplate);
      }

      const nextConfig: PromptConfig = {
        ...config,
        [platform]: {
          ...current,
          templates: nextTemplates
        }
      };

      await writeConfigFile(configPath, nextConfig);
      return nextTemplate;
    },
    async setActiveTemplate({
      platform,
      templateId
    }: {
      platform: PromptPlatformKey;
      templateId: string;
    }) {
      const config = await ensureConfigFile(configPath);
      const current = config[platform];

      if (!current.templates.some((item) => item.id === templateId)) {
        throw new Error("Prompt template was not found.");
      }

      const nextConfig: PromptConfig = {
        ...config,
        [platform]: {
          ...current,
          activeTemplateId: templateId
        }
      };

      await writeConfigFile(configPath, nextConfig);
      return nextConfig;
    },
    async deleteTemplate({
      platform,
      templateId
    }: {
      platform: PromptPlatformKey;
      templateId: string;
    }) {
      const config = await ensureConfigFile(configPath);
      const current = config[platform];

      if (current.templates.length <= 1) {
        throw new Error("At least one template must remain for each platform.");
      }

      const nextTemplates = current.templates.filter((item) => item.id !== templateId);

      if (nextTemplates.length === current.templates.length) {
        throw new Error("Prompt template was not found.");
      }

      const nextConfig: PromptConfig = {
        ...config,
        [platform]: {
          activeTemplateId:
            current.activeTemplateId === templateId ? nextTemplates[0]?.id ?? "" : current.activeTemplateId,
          templates: nextTemplates
        }
      };

      await writeConfigFile(configPath, nextConfig);
      return nextConfig;
    }
  };
}

async function ensureConfigFile(configPath: string) {
  await fs.mkdir(path.dirname(configPath), { recursive: true });

  try {
    const raw = await fs.readFile(configPath, "utf8");
    return JSON.parse(raw) as PromptConfig;
  } catch {
    const seeded = buildDefaultPromptConfig();
    await writeConfigFile(configPath, seeded);
    return seeded;
  }
}

async function writeConfigFile(configPath: string, config: PromptConfig) {
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, "utf8");
}

function buildDefaultPromptConfig(): PromptConfig {
  const now = "2026-04-03T00:00:00.000Z";

  return {
    wechat: {
      activeTemplateId: "wechat-default",
      templates: [
        {
          id: "wechat-default",
          name: "默认深度稿",
          prompt: promptDefaults.wechat,
          updatedAt: now
        }
      ]
    },
    xiaohongshu: {
      activeTemplateId: "xiaohongshu-default",
      templates: [
        {
          id: "xiaohongshu-default",
          name: "默认种草笔记",
          prompt: promptDefaults.xiaohongshu,
          updatedAt: now
        }
      ]
    },
    twitter: {
      activeTemplateId: "twitter-default",
      templates: [
        {
          id: "twitter-default",
          name: "默认推文模板",
          prompt: promptDefaults.twitter,
          updatedAt: now
        }
      ]
    },
    videoScript: {
      activeTemplateId: "video-default",
      templates: [
        {
          id: "video-default",
          name: "默认视频脚本",
          prompt: promptDefaults.videoScript,
          updatedAt: now
        }
      ]
    }
  };
}

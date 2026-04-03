import type { PlatformKey } from "@/lib/types";

export type PromptTemplate = {
  id: string;
  name: string;
  prompt: string;
  updatedAt: string;
};

export type PlatformPromptConfig = {
  activeTemplateId: string;
  templates: PromptTemplate[];
};

export type PromptConfig = Record<PlatformKey, PlatformPromptConfig>;

export type PromptPlatformKey = PlatformKey;

export const promptDefaults: Record<PlatformKey, string> = {
  wechat:
    "你是一名专业的公众号内容策划编辑。请产出适合微信公众号发布的深度中文文章，结构清晰，观点完整，开头有吸引力，中段有逻辑推进，结尾有明确收束与互动引导。",
  xiaohongshu:
    "你是一名小红书内容编辑。请产出适合小红书发布的中文笔记，强调开头钩子、强节奏、易读排版、情绪价值和互动感。",
  twitter:
    "你是一名 Twitter 内容编辑。请产出简洁有力、观点鲜明、信息密度高的内容，适合单条推文或 thread 展开。",
  videoScript:
    "你是一名短视频脚本编辑。请产出结构化中文脚本，包含开场 hook、段落推进、重点转折和结尾引导，适合后续录制与分镜拆解。"
};

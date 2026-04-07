type SupportedTask =
  | "script_to_scenes"
  | "analyze_assets"
  | "voice_tagging"
  | "dialogue_tts"
  | "image_generation";

type TaskProviderConfig = {
  apiKey: string;
  model: string;
  baseUrl: string;
};

type EnvSource = Record<string, string | undefined>;

const TASK_ENV_KEYS: Record<
  SupportedTask,
  { apiKey: string; model: string; baseUrl: string }
> = {
  script_to_scenes: {
    apiKey: "SCRIPT_TO_SCENES_API_KEY",
    model: "SCRIPT_TO_SCENES_MODEL",
    baseUrl: "SCRIPT_TO_SCENES_BASE_URL",
  },
  analyze_assets: {
    apiKey: "ANALYZE_ASSETS_API_KEY",
    model: "ANALYZE_ASSETS_MODEL",
    baseUrl: "ANALYZE_ASSETS_BASE_URL",
  },
  voice_tagging: {
    apiKey: "VOICE_TAGGING_API_KEY",
    model: "VOICE_TAGGING_MODEL",
    baseUrl: "VOICE_TAGGING_BASE_URL",
  },
  dialogue_tts: {
    apiKey: "DIALOGUE_TTS_API_KEY",
    model: "DIALOGUE_TTS_MODEL",
    baseUrl: "DIALOGUE_TTS_BASE_URL",
  },
  image_generation: {
    apiKey: "IMAGE_GENERATION_API_KEY",
    model: "IMAGE_GENERATION_MODEL",
    baseUrl: "IMAGE_GENERATION_BASE_URL",
  },
};

export function getTaskProviderConfig(
  task: SupportedTask,
  env: EnvSource = process.env,
): TaskProviderConfig {
  const keys = TASK_ENV_KEYS[task];

  const apiKey = env[keys.apiKey]?.trim();
  const model = env[keys.model]?.trim();
  const baseUrl = env[keys.baseUrl]?.trim();

  if (!apiKey) {
    throw new Error(`Missing ${keys.apiKey} in the local environment.`);
  }

  if (!model) {
    throw new Error(`Missing ${keys.model} in the local environment.`);
  }

  if (!baseUrl) {
    throw new Error(`Missing ${keys.baseUrl} in the local environment.`);
  }

  return {
    apiKey,
    model,
    baseUrl,
  };
}

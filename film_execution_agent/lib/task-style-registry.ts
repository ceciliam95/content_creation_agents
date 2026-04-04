export type RegistryTask =
  | "dialogue_tts"
  | "character_image"
  | "scene_image"
  | "item_image";

export type StyleOption = {
  value: string;
  label: string;
};

export type TaskStylePromptConfig = {
  label: string;
  systemPrompt: string;
  userPromptTemplate: string;
};

const TASK_STYLE_REGISTRY: Record<
  RegistryTask,
  Record<string, TaskStylePromptConfig>
> = {
  dialogue_tts: {
    natural_drama: {
      label: "Natural Drama",
      systemPrompt:
        "You are a voice performance prompt writer for natural dramatic dialogue delivery.",
      userPromptTemplate:
        "Use the following dialogue text and produce a text-to-speech prompt that preserves emotional nuance, pacing, and clarity.\n\nDialogue text:\n{{input}}",
    },
    animation: {
      label: "Animation",
      systemPrompt:
        "You write expressive voice prompts for animation-oriented character dialogue.",
      userPromptTemplate:
        "Turn the following dialogue text into a stylized TTS prompt suitable for animation performances.\n\nDialogue text:\n{{input}}",
    },
    commercial: {
      label: "Commercial",
      systemPrompt:
        "You write concise, polished voice prompts for commercial and branded delivery.",
      userPromptTemplate:
        "Turn the following dialogue text into a polished commercial TTS prompt.\n\nDialogue text:\n{{input}}",
    },
  },
  character_image: {
    "2d_animation": {
      label: "2D Animation",
      systemPrompt:
        "You write image prompts for clean 2D animated character turnarounds.",
      userPromptTemplate:
        "Create a prompt for character turnaround sheets based on the following character information:\n{{input}}",
    },
    realistic_photo: {
      label: "Realistic Photo",
      systemPrompt:
        "You write photorealistic portrait prompts for character identity consistency.",
      userPromptTemplate:
        "Create a realistic character image prompt based on the following character information:\n{{input}}",
    },
    cinematic_illustration: {
      label: "Cinematic Illustration",
      systemPrompt:
        "You write cinematic illustration prompts for expressive character concept art.",
      userPromptTemplate:
        "Create a cinematic character concept prompt based on the following character information:\n{{input}}",
    },
  },
  scene_image: {
    "2d_animation": {
      label: "2D Animation",
      systemPrompt:
        "You write 2D animated background prompts for scene concept images.",
      userPromptTemplate:
        "Create a prompt for a 2D animated scene image using the following scene details:\n{{input}}",
    },
    realistic_photo: {
      label: "Realistic Photo",
      systemPrompt:
        "You write realistic environment prompts for scene reference photography.",
      userPromptTemplate:
        "Create a realistic scene image prompt using the following scene details:\n{{input}}",
    },
    concept_art: {
      label: "Concept Art",
      systemPrompt:
        "You write concept art prompts for cinematic scene development.",
      userPromptTemplate:
        "Create a concept art prompt using the following scene details:\n{{input}}",
    },
  },
  item_image: {
    product_clean: {
      label: "Product Clean",
      systemPrompt:
        "You write clean object prompt descriptions for isolated production item references.",
      userPromptTemplate:
        "Create a clean item image prompt using the following object details:\n{{input}}",
    },
    "2d_animation": {
      label: "2D Animation",
      systemPrompt:
        "You write stylized 2D object prompts for animated item design.",
      userPromptTemplate:
        "Create a 2D animation item prompt using the following object details:\n{{input}}",
    },
    realistic_photo: {
      label: "Realistic Photo",
      systemPrompt:
        "You write realistic object prompts for production item references.",
      userPromptTemplate:
        "Create a realistic item image prompt using the following object details:\n{{input}}",
    },
  },
};

export function listTaskStyleOptions(task: RegistryTask): StyleOption[] {
  return Object.entries(TASK_STYLE_REGISTRY[task]).map(([value, config]) => ({
    value,
    label: config.label,
  }));
}

export function getTaskStylePromptConfig(
  task: RegistryTask,
  style: string,
): TaskStylePromptConfig {
  const config = TASK_STYLE_REGISTRY[task][style];

  if (!config) {
    throw new Error(`Unknown style "${style}" for task "${task}".`);
  }

  return config;
}

export const DEFAULT_IMAGE_PROMPTS_FOLDER =
  "C:\\Users\\Cecilia\\Desktop\\Her Strength Studio\\dev\\content_creation_agents\\film_execution_agent\\image_generation_prompts";

export const DEFAULT_DESCRIPTION_PROMPTS_FOLDER =
  "C:\\Users\\Cecilia\\Desktop\\Her Strength Studio\\dev\\content_creation_agents\\film_execution_agent\\description_generation_prompts";

export type PromptLibraryKind = "image" | "description";

export function getPromptLibraryFolder(kind: PromptLibraryKind) {
  return kind === "description"
    ? DEFAULT_DESCRIPTION_PROMPTS_FOLDER
    : DEFAULT_IMAGE_PROMPTS_FOLDER;
}

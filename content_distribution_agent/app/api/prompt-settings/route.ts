import { createPromptSettingsHandlers } from "@/lib/prompt-settings-route";

const handlers = createPromptSettingsHandlers();

export const GET = handlers.GET;
export const POST = handlers.POST;

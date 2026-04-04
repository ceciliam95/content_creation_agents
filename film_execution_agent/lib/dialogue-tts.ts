export const DEFAULT_DIALOGUE_VOICE_ID = "P4DhdyNCB4Nl6MA0sL45";
export const DIALOGUE_TTS_OUTPUT_FORMAT = "mp3_44100_128";

export function createDialogueAudioFilename(character: string): string {
  const normalized = character
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `${normalized || "voiceover"}-tts.mp3`;
}

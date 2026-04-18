export type VideoClipSelection = {
  name: string;
  relativePath: string;
};

export type RoughCutAspectRatio = "16:9" | "9:16";

const VIDEO_FILE_EXTENSIONS = [".mp4", ".mov", ".m4v", ".webm"] as const;

export function isVideoProjectFile(fileName: string) {
  const normalized = fileName.trim().toLowerCase();

  return VIDEO_FILE_EXTENSIONS.some((extension) => normalized.endsWith(extension));
}

export function createRoughCutDraftFilename(date = new Date()) {
  const stamp = date
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}z$/i, "")
    .replace("T", "_");

  return `rough_cut_${stamp}.mp4`;
}

export function getRoughCutDimensions(aspectRatio: RoughCutAspectRatio) {
  return aspectRatio === "9:16"
    ? { width: 720, height: 1280 }
    : { width: 1280, height: 720 };
}

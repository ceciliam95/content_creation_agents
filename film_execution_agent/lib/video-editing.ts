import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { buildProjectFilePath } from "./local-project-storage";
import {
  createRoughCutDraftFilename,
  getRoughCutDimensions,
  isVideoProjectFile,
  type RoughCutAspectRatio,
  type VideoClipSelection,
} from "./video-editing-shared";

export type RoughCutOutput = {
  fileId: string;
  fileName: string;
  filePath: string;
  previewUrl: string;
  downloadUrl: string;
  clipCount: number;
  aspectRatio: RoughCutAspectRatio;
  message: string;
};

const ROUGH_CUT_TEMP_ROOT = path.join(process.cwd(), ".tmp", "rough-cuts");
const ROUGH_CUT_PREVIEW_ROOT = path.join(ROUGH_CUT_TEMP_ROOT, "previews");
const ROUGH_CUT_WORK_ROOT = path.join(ROUGH_CUT_TEMP_ROOT, "work");
const ROUGH_CUT_TTL_MS = 24 * 60 * 60 * 1000;

export { createRoughCutDraftFilename, getRoughCutDimensions, isVideoProjectFile };
export type { RoughCutAspectRatio, VideoClipSelection };

export function getRoughCutPreviewPath(fileId: string) {
  const safeFileId = path.basename(fileId);
  const filePath = path.resolve(ROUGH_CUT_PREVIEW_ROOT, safeFileId);
  const resolvedRoot = path.resolve(ROUGH_CUT_PREVIEW_ROOT);

  if (!filePath.startsWith(resolvedRoot)) {
    throw new Error("Invalid rough cut preview file.");
  }

  return filePath;
}

export async function cleanupOldRoughCutTempFiles(now = Date.now()) {
  await fs.mkdir(ROUGH_CUT_PREVIEW_ROOT, { recursive: true });
  await fs.mkdir(ROUGH_CUT_WORK_ROOT, { recursive: true });

  async function cleanupChildren(folderPath: string) {
    const entries = await fs.readdir(folderPath, { withFileTypes: true }).catch(() => []);

    await Promise.all(
      entries.map(async (entry) => {
        const entryPath = path.join(folderPath, entry.name);
        const stats = await fs.stat(entryPath).catch(() => null);

        if (!stats || now - stats.mtimeMs <= ROUGH_CUT_TTL_MS) {
          return;
        }

        await fs.rm(entryPath, { recursive: true, force: true });
      }),
    );
  }

  await cleanupChildren(ROUGH_CUT_PREVIEW_ROOT);
  await cleanupChildren(ROUGH_CUT_WORK_ROOT);
}

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, {
      windowsHide: true,
    });
    let stderr = "";

    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });
    child.on("error", (error) => {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        reject(
          new Error(
            "FFmpeg was not found. Please install FFmpeg and make sure it is available in PATH.",
          ),
        );
        return;
      }

      reject(error);
    });
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(stderr.trim() || `FFmpeg exited with code ${code}.`));
    });
  });
}

function buildNormalizeFilter(aspectRatio: RoughCutAspectRatio) {
  const { width, height } = getRoughCutDimensions(aspectRatio);

  return `fps=24,scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,setsar=1,format=yuv420p`;
}

function escapeConcatFilePath(filePath: string) {
  return filePath.replace(/\\/g, "/").replace(/'/g, "'\\''");
}

export async function createRoughCut({
  rootPath,
  clips,
  aspectRatio,
}: {
  rootPath: string;
  clips: VideoClipSelection[];
  aspectRatio: RoughCutAspectRatio;
}): Promise<RoughCutOutput> {
  await cleanupOldRoughCutTempFiles();

  if (!clips.length) {
    throw new Error("At least one video clip is required.");
  }

  const taskId = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const workFolder = path.join(ROUGH_CUT_WORK_ROOT, taskId);
  const outputFileName = createRoughCutDraftFilename();
  const outputFileId = `${taskId}_${outputFileName}`;
  const outputFilePath = path.join(ROUGH_CUT_PREVIEW_ROOT, outputFileId);
  const normalizedClipPaths: string[] = [];

  await fs.mkdir(workFolder, { recursive: true });
  await fs.mkdir(ROUGH_CUT_PREVIEW_ROOT, { recursive: true });

  try {
    for (const [index, clip] of clips.entries()) {
      if (!clip.relativePath?.trim() || !isVideoProjectFile(clip.name)) {
        throw new Error("Only local project video files can be added to a rough cut.");
      }

      const { filePath: inputPath } = buildProjectFilePath(rootPath, clip.relativePath);
      const normalizedPath = path.join(
        workFolder,
        `normalized_${String(index + 1).padStart(3, "0")}.mp4`,
      );

      await runFfmpeg([
        "-y",
        "-i",
        inputPath,
        "-vf",
        buildNormalizeFilter(aspectRatio),
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "20",
        "-c:a",
        "aac",
        "-ar",
        "48000",
        "-ac",
        "2",
        "-movflags",
        "+faststart",
        normalizedPath,
      ]);
      normalizedClipPaths.push(normalizedPath);
    }

    const concatListPath = path.join(workFolder, "clips.txt");
    const concatList = normalizedClipPaths
      .map((clipPath) => `file '${escapeConcatFilePath(clipPath)}'`)
      .join(os.EOL);

    await fs.writeFile(concatListPath, concatList, "utf8");
    await runFfmpeg([
      "-y",
      "-f",
      "concat",
      "-safe",
      "0",
      "-i",
      concatListPath,
      "-c",
      "copy",
      "-movflags",
      "+faststart",
      outputFilePath,
    ]);

    return {
      fileId: outputFileId,
      fileName: outputFileName,
      filePath: outputFilePath,
      previewUrl: `/api/video-editing/rough-cut/download?fileId=${encodeURIComponent(outputFileId)}`,
      downloadUrl: `/api/video-editing/rough-cut/download?fileId=${encodeURIComponent(outputFileId)}&download=1`,
      clipCount: clips.length,
      aspectRatio,
      message: "Rough cut preview is ready.",
    };
  } finally {
    await fs.rm(workFolder, { recursive: true, force: true });
  }
}

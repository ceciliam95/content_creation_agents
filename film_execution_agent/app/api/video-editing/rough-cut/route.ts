import { NextResponse } from "next/server";

import { ensureProjectRootExists } from "@/lib/local-project-storage";
import {
  createRoughCut,
  isVideoProjectFile,
  type RoughCutAspectRatio,
  type VideoClipSelection,
} from "@/lib/video-editing";

export const runtime = "nodejs";

type RoughCutRequest = {
  rootPath?: string;
  clips?: VideoClipSelection[];
  aspectRatio?: RoughCutAspectRatio;
};

export async function POST(request: Request) {
  const { rootPath, clips, aspectRatio }: RoughCutRequest = await request.json();

  try {
    const resolvedRoot = await ensureProjectRootExists(rootPath?.trim() ?? "");
    const selectedClips = clips ?? [];
    const outputRatio: RoughCutAspectRatio =
      aspectRatio === "9:16" ? "9:16" : "16:9";

    if (!selectedClips.length) {
      throw new Error("At least one video clip is required.");
    }

    selectedClips.forEach((clip) => {
      if (!clip.relativePath?.trim() || !isVideoProjectFile(clip.name)) {
        throw new Error("Only local project video files can be added to a rough cut.");
      }
    });

    const roughCut = await createRoughCut({
      rootPath: resolvedRoot,
      clips: selectedClips,
      aspectRatio: outputRatio,
    });

    return NextResponse.json({
      status: "ready",
      message: roughCut.message,
      clipCount: roughCut.clipCount,
      fileName: roughCut.fileName,
      fileId: roughCut.fileId,
      previewUrl: roughCut.previewUrl,
      downloadUrl: roughCut.downloadUrl,
      defaultFolder: "rough_cuts",
      aspectRatio: roughCut.aspectRatio,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to prepare the rough cut.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

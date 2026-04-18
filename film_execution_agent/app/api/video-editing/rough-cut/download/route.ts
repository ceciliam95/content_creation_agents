import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import { basename } from "node:path";
import { NextResponse } from "next/server";

import { getRoughCutPreviewPath } from "@/lib/video-editing";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const fileId = url.searchParams.get("fileId")?.trim();
  const shouldDownload = url.searchParams.get("download") === "1";

  try {
    if (!fileId) {
      throw new Error("Rough cut file id is required.");
    }

    const filePath = getRoughCutPreviewPath(fileId);
    const stats = await fs.stat(filePath).catch(() => null);

    if (!stats?.isFile()) {
      throw new Error("Rough cut preview file was not found.");
    }

    const stream = createReadStream(filePath);
    const headers = new Headers({
      "Content-Type": "video/mp4",
      "Content-Length": String(stats.size),
    });

    if (shouldDownload) {
      headers.set(
        "Content-Disposition",
        `attachment; filename="${basename(fileId).replace(/^[^_]+_/, "")}"`,
      );
    }

    return new Response(stream as unknown as BodyInit, {
      headers,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read the rough cut preview.";

    return NextResponse.json({ error: message }, { status: 404 });
  }
}

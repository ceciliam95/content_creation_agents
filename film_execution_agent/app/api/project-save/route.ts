import { promises as fs } from "node:fs";
import { NextResponse } from "next/server";

import {
  buildSavePath,
  ensureProjectRootExists,
} from "@/lib/local-project-storage";

export const runtime = "nodejs";

type ProjectSaveRequest = {
  rootPath?: string;
  relativeFolder?: string;
  fileName?: string;
  extension?: string;
  textContent?: string;
  base64Content?: string;
};

export async function POST(request: Request) {
  const {
    rootPath,
    relativeFolder,
    fileName,
    extension,
    textContent,
    base64Content,
  }: ProjectSaveRequest = await request.json();

  try {
    await ensureProjectRootExists(rootPath?.trim() ?? "");

    if (!fileName?.trim()) {
      throw new Error("Asset name is required.");
    }

    if (!extension?.trim()) {
      throw new Error("File extension is required.");
    }

    const { directoryPath, filePath, relativeFilePath } = buildSavePath(
      rootPath ?? "",
      relativeFolder ?? "",
      fileName,
      extension,
    );

    await fs.mkdir(directoryPath, { recursive: true });

    if (typeof textContent === "string") {
      await fs.writeFile(filePath, textContent, "utf8");
    } else if (typeof base64Content === "string") {
      await fs.writeFile(filePath, Buffer.from(base64Content, "base64"));
    } else {
      throw new Error("No file content was provided.");
    }

    return NextResponse.json({
      saved: true,
      relativeFilePath,
      filePath,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save the project asset.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

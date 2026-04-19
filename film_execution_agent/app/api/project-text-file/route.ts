import { NextResponse } from "next/server";

import { readProjectTextFile } from "@/lib/local-project-storage";

export const runtime = "nodejs";

type ProjectTextFileRequest = {
  rootPath?: string;
  relativePath?: string;
};

export async function POST(request: Request) {
  const { rootPath, relativePath }: ProjectTextFileRequest = await request.json();

  try {
    const content = await readProjectTextFile(
      rootPath?.trim() ?? "",
      relativePath?.trim() ?? "",
    );

    return NextResponse.json({ content });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read the project text file.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

import { NextResponse } from "next/server";

import { listProjectTree } from "@/lib/local-project-storage";

export const runtime = "nodejs";

type ProjectFilesRequest = {
  rootPath?: string;
};

export async function POST(request: Request) {
  const { rootPath }: ProjectFilesRequest = await request.json();

  try {
    const tree = await listProjectTree(rootPath?.trim() ?? "");
    return NextResponse.json({ tree });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to read the project folder.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

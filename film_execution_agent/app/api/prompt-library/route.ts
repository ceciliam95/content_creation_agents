import { NextResponse } from "next/server";

import {
  getPromptLibraryFolder,
  type PromptLibraryKind,
} from "@/lib/prompt-library-config";
import {
  deletePromptTemplate,
  listPromptTemplates,
  savePromptTemplate,
} from "@/lib/prompt-library";

export const runtime = "nodejs";

type PromptLibraryRequest = {
  fileName?: string;
  content?: string;
  library?: PromptLibraryKind;
};

function getLibraryFromRequest(request: Request): PromptLibraryKind {
  const url = new URL(request.url);
  const library = url.searchParams.get("library");

  return library === "description" ? "description" : "image";
}

export async function GET(request: Request) {
  try {
    const library = getLibraryFromRequest(request);
    const templates = await listPromptTemplates(getPromptLibraryFolder(library));
    return NextResponse.json({ templates });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load prompt templates.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const { fileName, content, library = "image" }: PromptLibraryRequest =
    await request.json();

  try {
    if (!fileName?.trim()) {
      throw new Error("Template name is required.");
    }

    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Prompt content is required.");
    }

    const template = await savePromptTemplate(
      getPromptLibraryFolder(library),
      fileName,
      content,
    );

    return NextResponse.json({ saved: true, template });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save the prompt template.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const { fileName, library = "image" }: PromptLibraryRequest = await request.json();

  try {
    if (!fileName?.trim()) {
      throw new Error("Template name is required.");
    }

    await deletePromptTemplate(getPromptLibraryFolder(library), fileName);

    return NextResponse.json({ deleted: true, fileName });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete the prompt template.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

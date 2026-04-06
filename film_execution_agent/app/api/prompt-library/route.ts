import { NextResponse } from "next/server";

import { DEFAULT_IMAGE_PROMPTS_FOLDER } from "@/lib/prompt-library-config";
import {
  deletePromptTemplate,
  listPromptTemplates,
  savePromptTemplate,
} from "@/lib/prompt-library";

export const runtime = "nodejs";

type PromptLibraryRequest = {
  fileName?: string;
  content?: string;
};

export async function GET() {
  try {
    const templates = await listPromptTemplates(DEFAULT_IMAGE_PROMPTS_FOLDER);
    return NextResponse.json({ templates });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load prompt templates.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const { fileName, content }: PromptLibraryRequest = await request.json();

  try {
    if (!fileName?.trim()) {
      throw new Error("Template name is required.");
    }

    if (typeof content !== "string" || !content.trim()) {
      throw new Error("Prompt content is required.");
    }

    const template = await savePromptTemplate(
      DEFAULT_IMAGE_PROMPTS_FOLDER,
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
  const { fileName }: PromptLibraryRequest = await request.json();

  try {
    if (!fileName?.trim()) {
      throw new Error("Template name is required.");
    }

    await deletePromptTemplate(DEFAULT_IMAGE_PROMPTS_FOLDER, fileName);

    return NextResponse.json({ deleted: true, fileName });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete the prompt template.";

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

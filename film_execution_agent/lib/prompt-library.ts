import { promises as fs } from "node:fs";
import path from "node:path";

export type PromptLibraryTemplate = {
  fileName: string;
  content: string;
};

export function resolvePromptLibraryRoot(folderPath: string): string {
  const trimmed = folderPath.trim();

  if (!trimmed) {
    throw new Error("Prompt library folder is required.");
  }

  const resolved = path.resolve(trimmed);

  if (!path.isAbsolute(resolved)) {
    throw new Error("Prompt library folder must be an absolute path.");
  }

  return resolved;
}

export async function ensurePromptLibraryExists(folderPath: string) {
  const resolvedRoot = resolvePromptLibraryRoot(folderPath);
  await fs.mkdir(resolvedRoot, { recursive: true });
  return resolvedRoot;
}

export function sanitizePromptTemplateName(fileName: string): string {
  const withoutExtension = fileName
    .trim()
    .replace(/\.txt$/i, "")
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const safeBase = withoutExtension || "untitled prompt";
  return `${safeBase}.txt`;
}

export function buildPromptTemplatePath(folderPath: string, fileName: string) {
  const root = resolvePromptLibraryRoot(folderPath);
  const safeFileName = sanitizePromptTemplateName(fileName);
  const filePath = path.resolve(path.join(root, safeFileName));

  if (!filePath.startsWith(root)) {
    throw new Error("Prompt template path must stay within the prompt library folder.");
  }

  return {
    root,
    fileName: safeFileName,
    filePath,
  };
}

export async function listPromptTemplates(folderPath: string): Promise<PromptLibraryTemplate[]> {
  const root = await ensurePromptLibraryExists(folderPath);
  const entries = await fs.readdir(root, { withFileTypes: true });
  const txtFiles = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".txt"))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const templates = await Promise.all(
    txtFiles.map(async (fileName) => ({
      fileName,
      content: await fs.readFile(path.join(root, fileName), "utf8"),
    })),
  );

  return templates;
}

export async function savePromptTemplate(
  folderPath: string,
  fileName: string,
  content: string,
): Promise<PromptLibraryTemplate> {
  const { root, fileName: safeFileName, filePath } = buildPromptTemplatePath(
    folderPath,
    fileName,
  );
  await ensurePromptLibraryExists(root);
  await fs.writeFile(filePath, content, "utf8");
  return {
    fileName: safeFileName,
    content,
  };
}

export async function deletePromptTemplate(folderPath: string, fileName: string) {
  const { filePath } = buildPromptTemplatePath(folderPath, fileName);
  await fs.unlink(filePath);
}

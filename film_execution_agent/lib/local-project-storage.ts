import { promises as fs } from "node:fs";
import path from "node:path";

export type ProjectFileNode = {
  name: string;
  relativePath: string;
  kind: "directory" | "file";
  children?: ProjectFileNode[];
};

export function resolveProjectRoot(rootPath: string): string {
  const trimmed = rootPath.trim();

  if (!trimmed) {
    throw new Error("Project root folder is required.");
  }

  const resolved = path.resolve(trimmed);

  if (!path.isAbsolute(resolved)) {
    throw new Error("Project root folder must be an absolute path.");
  }

  return resolved;
}

export function normalizeRelativeFolder(relativeFolder: string): string {
  const cleaned = relativeFolder
    .trim()
    .replace(/\\/g, "/")
    .replace(/^\/+|\/+$/g, "");

  if (!cleaned) {
    return "";
  }

  const parts = cleaned
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean)
    .filter((segment) => segment !== "." && segment !== "..");

  return parts.join("/");
}

export function sanitizeFileName(fileName: string, extension: string): string {
  const safeBase = fileName
    .trim()
    .replace(/[<>:"/\\|?*\u0000-\u001f]/g, "")
    .replace(/\s+/g, " ")
    .trim();

  const base = safeBase || "untitled";
  const normalizedExtension = extension.replace(/^\.+/, "").trim().toLowerCase();

  return normalizedExtension ? `${base}.${normalizedExtension}` : base;
}

export function buildSavePath(
  rootPath: string,
  folderInput: string,
  fileName: string,
  extension: string,
): { directoryPath: string; filePath: string; relativeFilePath: string } {
  const resolvedRoot = resolveProjectRoot(rootPath);
  const trimmedFolderInput = folderInput.trim();
  const safeFileName = sanitizeFileName(fileName, extension);
  const absoluteFolderCandidate = trimmedFolderInput
    ? path.resolve(trimmedFolderInput)
    : resolvedRoot;
  const shouldUseAbsoluteFolder =
    Boolean(trimmedFolderInput) && path.isAbsolute(trimmedFolderInput);
  const directoryPath = shouldUseAbsoluteFolder
    ? absoluteFolderCandidate
    : trimmedFolderInput
      ? path.join(resolvedRoot, normalizeRelativeFolder(trimmedFolderInput))
      : resolvedRoot;
  const filePath = path.join(directoryPath, safeFileName);
  const resolvedDirectoryPath = path.resolve(directoryPath);
  const resolvedFilePath = path.resolve(filePath);

  if (
    !resolvedDirectoryPath.startsWith(resolvedRoot) ||
    !resolvedFilePath.startsWith(resolvedRoot)
  ) {
    throw new Error("Save path must stay within the selected project root folder.");
  }

  const relativeDirectoryPath = path.relative(resolvedRoot, resolvedDirectoryPath);
  const normalizedRelativeDirectory = normalizeRelativeFolder(relativeDirectoryPath);
  const relativeFilePath = normalizedRelativeDirectory
    ? `${normalizedRelativeDirectory}/${safeFileName}`
    : safeFileName;

  return {
    directoryPath: resolvedDirectoryPath,
    filePath: resolvedFilePath,
    relativeFilePath,
  };
}

export function buildProjectFilePath(
  rootPath: string,
  relativeFilePath: string,
): { filePath: string; relativeFilePath: string } {
  const resolvedRoot = resolveProjectRoot(rootPath);
  const normalizedRelativePath = normalizeRelativeFolder(relativeFilePath);

  if (!normalizedRelativePath) {
    throw new Error("Project file path is required.");
  }

  const filePath = path.resolve(resolvedRoot, normalizedRelativePath);

  if (!filePath.startsWith(resolvedRoot)) {
    throw new Error("Project file path must stay within the selected project root folder.");
  }

  return {
    filePath,
    relativeFilePath: normalizedRelativePath,
  };
}

export async function readProjectFileAsDataUrl(
  rootPath: string,
  relativeFilePath: string,
): Promise<string> {
  const { filePath } = buildProjectFilePath(rootPath, relativeFilePath);
  const stats = await fs.stat(filePath).catch(() => null);

  if (!stats || !stats.isFile()) {
    throw new Error("The selected project reference image does not exist.");
  }

  const extension = path.extname(filePath).replace(/^\./, "").toLowerCase();
  const mimeType =
    extension === "jpg" || extension === "jpeg"
      ? "image/jpeg"
      : extension === "webp"
        ? "image/webp"
        : extension === "gif"
          ? "image/gif"
          : "image/png";
  const buffer = await fs.readFile(filePath);

  return `data:${mimeType};base64,${buffer.toString("base64")}`;
}

export async function ensureProjectRootExists(rootPath: string) {
  const resolvedRoot = resolveProjectRoot(rootPath);
  const stats = await fs.stat(resolvedRoot).catch(() => null);

  if (!stats || !stats.isDirectory()) {
    throw new Error("The selected project root folder does not exist.");
  }

  return resolvedRoot;
}

export async function listProjectTree(rootPath: string): Promise<ProjectFileNode> {
  const resolvedRoot = await ensureProjectRootExists(rootPath);

  async function readDirectory(currentPath: string, relativePath = ""): Promise<ProjectFileNode> {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    const children = await Promise.all(
      entries
        .filter((entry) => !entry.name.startsWith("."))
        .map(async (entry) => {
          const childRelativePath = relativePath
            ? `${relativePath}/${entry.name}`
            : entry.name;
          const childAbsolutePath = path.join(currentPath, entry.name);

          if (entry.isDirectory()) {
            return readDirectory(childAbsolutePath, childRelativePath);
          }

          return {
            name: entry.name,
            relativePath: childRelativePath,
            kind: "file" as const,
          };
        }),
    );

    children.sort((a, b) => {
      if (a.kind !== b.kind) {
        return a.kind === "directory" ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });

    return {
      name: relativePath ? path.basename(currentPath) : path.basename(resolvedRoot),
      relativePath,
      kind: "directory",
      children,
    };
  }

  return readDirectory(resolvedRoot);
}

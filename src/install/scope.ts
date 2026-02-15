import { readFile, writeFile, access } from "node:fs/promises";
import { homedir } from "node:os";
import type { InstallScope } from "../registry/types.js";

const GITIGNORE_HEADER = "# Claude Superpowers (local scope)";

export function resolveSkillsDir(scope: InstallScope): string {
  switch (scope) {
    case "user":
      return `${homedir()}/.claude/skills`;
    case "project":
    case "local":
      return ".claude/skills";
  }
}

export async function ensureGitignored(
  path: string,
  scope: InstallScope,
): Promise<void> {
  if (scope !== "local") return;

  const gitignorePath = ".gitignore";

  let content = "";
  try {
    await access(gitignorePath);
    content = await readFile(gitignorePath, "utf-8");
  } catch {
    // File doesn't exist, will create it
  }

  // Add header if not present
  if (!content.includes(GITIGNORE_HEADER)) {
    content += `\n${GITIGNORE_HEADER}\n`;
  }

  // Add path if not already listed
  if (!content.split("\n").includes(path)) {
    content += `${path}\n`;
  }

  await writeFile(gitignorePath, content);
}

/**
 * Scan installed skills from the filesystem.
 *
 * Reads `.claude/skills/` subdirectories and parses SKILL.md frontmatter
 * to extract skill metadata. Replaces the `listInstalledSkills` function
 * from the `skills` package with a minimal implementation.
 */

import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import type { SkillMetadata } from "../types.js";

/**
 * Parse YAML frontmatter from a SKILL.md file content.
 * Extracts simple key: value pairs between `---` delimiters.
 */
function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match?.[1]) return {};

  const result: Record<string, string> = {};
  for (const line of match[1].split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim();
    if (key) result[key] = value;
  }
  return result;
}

/**
 * Scan a directory for skill subdirectories containing SKILL.md files.
 */
async function scanSkillsDir(dir: string): Promise<SkillMetadata[]> {
  let entries: string[];
  try {
    entries = await readdir(dir);
  } catch {
    return [];
  }

  const skills: SkillMetadata[] = [];

  for (const entry of entries) {
    const skillMdPath = join(dir, entry, "SKILL.md");
    try {
      const content = await readFile(skillMdPath, "utf-8");
      const fm = parseFrontmatter(content);
      skills.push({
        name: fm.name || entry,
        description: fm.description || "",
        path: skillMdPath,
      });
    } catch {
      // Skip entries without a readable SKILL.md
    }
  }

  return skills;
}

/**
 * Retrieve metadata for all skills installed in the given directory.
 *
 * @param cwd - Project root to scan for installed skills
 * @returns Array of skill metadata (name, description, path)
 */
export async function getInstalledSkillMetadata(
  cwd: string,
): Promise<SkillMetadata[]> {
  const skillsDir = join(cwd, ".claude", "skills");
  return scanSkillsDir(skillsDir);
}

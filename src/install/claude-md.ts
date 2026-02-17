import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { theme } from "../ui/format.js";
import { resolveClaudeMdPath } from "./scope.js";
import type { SkillMetadata, InstallScope } from "../types.js";

const MARKER_START = "<!-- superpower-skills-start -->";
const MARKER_END = "<!-- superpower-skills-end -->";

export function generateClaudeMdSection(skills: SkillMetadata[]): string {
  if (skills.length === 0) return "";

  const lines: string[] = [
    MARKER_START,
    "# Superpowers Skills",
    "",
    "ALWAYS check if a superpowers skill applies before starting any task.",
    "",
  ];

  for (const skill of skills) {
    lines.push(`- Use ${skill.name} — ${skill.description}`);
  }

  lines.push(MARKER_END);
  return lines.join("\n");
}

export async function updateClaudeMd(
  skills: SkillMetadata[],
  scope: InstallScope,
): Promise<void> {
  if (skills.length === 0) return;

  const section = generateClaudeMdSection(skills);
  if (!section) return;

  const filePath = resolveClaudeMdPath(scope);

  try {
    await mkdir(dirname(filePath), { recursive: true });

    let existing = "";
    try {
      existing = await readFile(filePath, "utf-8");
    } catch {
      // File doesn't exist yet
    }

    let updated: string;
    const startIdx = existing.indexOf(MARKER_START);
    const endIdx = existing.indexOf(MARKER_END);

    if (startIdx !== -1 && endIdx !== -1) {
      updated =
        existing.slice(0, startIdx) +
        section +
        existing.slice(endIdx + MARKER_END.length);
    } else if (existing.length > 0) {
      updated = existing.trimEnd() + "\n\n" + section + "\n";
    } else {
      updated = section + "\n";
    }

    await writeFile(filePath, updated);
    console.log(
      `  ${theme.success("+")} Updated ${theme.bold(filePath)} with skill rules`,
    );
  } catch {
    console.log(
      `  ${theme.warn("!")} Could not update ${filePath} ${theme.dim("(write failed)")}`,
    );
  }
}

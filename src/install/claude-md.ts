import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { theme } from "../ui/format.js";
import { getSkillByName, getCategoryName } from "../registry/skills.js";
import { resolveClaudeMdPath } from "./scope.js";
import type { SkillsRegistry, InstallScope } from "../registry/types.js";

const MARKER_START = "<!-- superpower-skills-start -->";
const MARKER_END = "<!-- superpower-skills-end -->";

/**
 * Category rule templates.
 * `template` receives (skillName, skillDescription) and returns a markdown bullet.
 */
const categoryTemplates: Record<
  string,
  (name: string, desc: string) => string
> = {
  core: (name, desc) => `- ALWAYS use ${name} — ${desc}`,
  workflow: (name, desc) => `- Use ${name} for ${desc.toLowerCase()}`,
  git: (name, desc) => `- Use ${name} for ${desc.toLowerCase()}`,
  web: (name, desc) => `- Use ${name} when working on web projects — ${desc.toLowerCase()}`,
  mobile: (name, desc) => `- Use ${name} when working on mobile apps — ${desc.toLowerCase()}`,
  backend: (name, desc) => `- Use ${name} for backend/API work — ${desc.toLowerCase()}`,
  languages: (name, desc) => `- Use ${name} — ${desc}`,
  devops: (name, desc) => `- Use ${name} for DevOps tasks — ${desc.toLowerCase()}`,
  security: (name, desc) => `- Use ${name} for security analysis — ${desc.toLowerCase()}`,
  design: (name, desc) => `- Use ${name} — ${desc}`,
  documents: (name, desc) => `- Use ${name} — ${desc}`,
  meta: (name, desc) => `- Use ${name} — ${desc}`,
};

function defaultTemplate(name: string, desc: string): string {
  return `- Use ${name} — ${desc}`;
}

export function generateClaudeMdSection(
  skillNames: string[],
  skillsRegistry: SkillsRegistry,
): string {
  // Group installed skills by category
  const byCategory = new Map<string, { name: string; description: string }[]>();

  for (const skillName of skillNames) {
    const skill = getSkillByName(skillsRegistry, skillName);
    if (!skill) continue;

    const cat = skill.category;
    if (!byCategory.has(cat)) {
      byCategory.set(cat, []);
    }
    byCategory.get(cat)!.push({ name: skill.name, description: skill.description });
  }

  if (byCategory.size === 0) return "";

  // Maintain registry category order
  const categoryOrder = Object.keys(skillsRegistry.categories);
  const sortedCategories = [...byCategory.keys()].sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b),
  );

  const lines: string[] = [
    MARKER_START,
    "# Superpowers Skills",
    "",
    "ALWAYS check if a superpowers skill applies before starting any task.",
  ];

  for (const catId of sortedCategories) {
    const skills = byCategory.get(catId)!;
    const catName = getCategoryName(skillsRegistry, catId);
    const templateFn = categoryTemplates[catId] ?? defaultTemplate;

    lines.push("");
    lines.push(`## ${catName}`);
    for (const { name, description } of skills) {
      lines.push(templateFn(name, description));
    }
  }

  lines.push(MARKER_END);
  return lines.join("\n");
}

export async function updateClaudeMd(
  skillNames: string[],
  skillsRegistry: SkillsRegistry,
  scope: InstallScope,
): Promise<void> {
  if (skillNames.length === 0) return;

  const section = generateClaudeMdSection(skillNames, skillsRegistry);
  if (!section) return;

  const filePath = resolveClaudeMdPath(scope);

  try {
    // Ensure parent directory exists (for ~/.claude/CLAUDE.md)
    await mkdir(dirname(filePath), { recursive: true });

    let existing = "";
    try {
      existing = await readFile(filePath, "utf-8");
    } catch {
      // File doesn't exist yet — that's fine
    }

    let updated: string;
    const startIdx = existing.indexOf(MARKER_START);
    const endIdx = existing.indexOf(MARKER_END);

    if (startIdx !== -1 && endIdx !== -1) {
      // Replace existing section
      updated =
        existing.slice(0, startIdx) +
        section +
        existing.slice(endIdx + MARKER_END.length);
    } else if (existing.length > 0) {
      // Append to existing file
      updated = existing.trimEnd() + "\n\n" + section + "\n";
    } else {
      // New file
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

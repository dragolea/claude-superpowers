import { mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import * as p from "@clack/prompts";
import { theme, formatInstallSummary } from "../ui/format.js";
import { getSkillByName, getSourceUrl } from "../registry/skills.js";
import { ensureGitignored, resolveSkillsDir } from "./scope.js";
import type {
  SkillsRegistry,
  SourcesRegistry,
  InstallScope,
} from "../registry/types.js";

export async function downloadSkill(
  skillName: string,
  skillsRegistry: SkillsRegistry,
  sourcesRegistry: SourcesRegistry,
  skillsDir: string,
  scope: InstallScope,
): Promise<boolean> {
  const skill = getSkillByName(skillsRegistry, skillName);
  if (!skill) {
    console.log(`  ${theme.error("x")} ${skillName} ${theme.dim("(not found in registry)")}`);
    return false;
  }

  const baseUrl = getSourceUrl(sourcesRegistry, skill.source);
  const url = `${baseUrl}/${skill.path}`;
  const targetDir = join(skillsDir, skillName);

  try {
    await mkdir(targetDir, { recursive: true });

    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const content = await res.text();
    await writeFile(join(targetDir, "SKILL.md"), content);
    await ensureGitignored(`${skillsDir}/${skillName}/`, scope);

    console.log(`  ${theme.success("+")} ${skillName}`);
    return true;
  } catch {
    console.log(`  ${theme.error("x")} ${skillName} ${theme.dim("(download failed)")}`);
    try {
      await rm(targetDir, { recursive: true });
    } catch {
      // Ignore cleanup errors
    }
    return false;
  }
}

export async function installSkills(
  skillNames: string[],
  skillsRegistry: SkillsRegistry,
  sourcesRegistry: SourcesRegistry,
  scope: InstallScope,
): Promise<void> {
  const skillsDir = resolveSkillsDir(scope);
  const total = skillNames.length;
  let success = 0;
  let failed = 0;

  const s = p.spinner();
  s.start(`Installing skills (0/${total})...`);

  await mkdir(skillsDir, { recursive: true });

  for (const name of skillNames) {
    const ok = await downloadSkill(
      name,
      skillsRegistry,
      sourcesRegistry,
      skillsDir,
      scope,
    );
    if (ok) success++;
    else failed++;
    s.message(`Installing skills (${success + failed}/${total})...`);
  }

  s.stop(`Installed ${success} skills${failed > 0 ? ` (${failed} failed)` : ""}`);

  console.log(
    formatInstallSummary({
      type: "skills",
      success,
      failed,
      scope,
      skillsDir,
    }),
  );
}

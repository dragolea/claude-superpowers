import { readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename } from "node:path";
import { theme } from "../ui/format.js";
import {
  loadSkillsRegistry,
  loadSourcesRegistry,
  loadAgentsRegistry,
} from "../registry/loader.js";
import { installSkills } from "../install/skills.js";
import {
  updatePlugins,
  isClaudeCliAvailable,
  printClaudeCliError,
} from "../install/agents.js";
import { resolveSkillsDir } from "../install/scope.js";
import type { InstallScope } from "../registry/types.js";

export async function cmdUpdate(scope: InstallScope): Promise<void> {
  const registry = await loadSkillsRegistry();
  const sources = await loadSourcesRegistry();
  const skillsDir = resolveSkillsDir(scope);

  if (!existsSync(skillsDir)) {
    console.log(
      theme.warn("No skills installed yet. Run npx superpower-installer first."),
    );
    process.exit(0);
  }

  console.log(theme.bold("Updating installed skills..."));

  const installed: string[] = [];
  try {
    const entries = await readdir(skillsDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        installed.push(entry.name);
      }
    }
  } catch {
    // Directory might not exist or be empty
  }

  if (installed.length === 0) {
    console.log(theme.warn(`No skills found in ${skillsDir}/`));
    process.exit(0);
  }

  await installSkills(installed, registry, sources, scope);
}

export async function cmdAgentsUpdate(): Promise<void> {
  const registry = await loadAgentsRegistry();

  if (!(await isClaudeCliAvailable())) {
    printClaudeCliError();
    process.exit(1);
  }

  await updatePlugins(registry);
}

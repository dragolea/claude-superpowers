import { existsSync } from "node:fs";
import { theme, formatSkillLine, formatPluginLine } from "../ui/format.js";
import {
  loadSkillsRegistry,
  loadAgentsRegistry,
} from "../registry/loader.js";
import {
  getAllCategories,
  getCategoryName,
  getCategoryDesc,
  getSkillsByCategories,
} from "../registry/skills.js";
import {
  getAllPluginCategories,
  getPluginCategoryName,
  getPluginCategoryDesc,
  getPluginsByCategories,
} from "../registry/agents.js";
import { resolveSkillsDir } from "../install/scope.js";
import type { InstallScope } from "../registry/types.js";

export async function cmdList(scope: InstallScope): Promise<void> {
  const registry = await loadSkillsRegistry();
  const skillsDir = resolveSkillsDir(scope);

  console.log("");
  console.log(
    theme.bold(`Available Skills (${registry.skills.length} total)`),
  );
  console.log("");

  for (const catId of getAllCategories(registry)) {
    const catName = getCategoryName(registry, catId);
    const catDesc = getCategoryDesc(registry, catId);
    console.log(`  ${theme.heading(catName)} ${theme.dim(`— ${catDesc}`)}`);

    const skills = getSkillsByCategories(registry, [catId]);
    for (const skill of skills) {
      const installed = existsSync(`${skillsDir}/${skill.name}/SKILL.md`);
      console.log(formatSkillLine(skill.name, skill.description, installed));
      console.log(`    ${theme.dim(`Source: ${skill.source}`)}`);
      console.log("");
    }
  }
}

export async function cmdAgentsList(): Promise<void> {
  const registry = await loadAgentsRegistry();

  console.log("");
  console.log(
    theme.bold(
      `Available Plugins (${registry.plugins.length} total from 2 marketplaces)`,
    ),
  );
  console.log("");

  for (const catId of getAllPluginCategories(registry)) {
    const catName = getPluginCategoryName(registry, catId);
    const catDesc = getPluginCategoryDesc(registry, catId);
    console.log(`  ${theme.heading(catName)} ${theme.dim(`— ${catDesc}`)}`);

    const plugins = getPluginsByCategories(registry, [catId]);
    for (const plugin of plugins) {
      console.log(
        formatPluginLine(
          plugin.name,
          plugin.marketplace,
          plugin.agent_count,
          plugin.description,
        ),
      );
      console.log("");
    }
  }
}

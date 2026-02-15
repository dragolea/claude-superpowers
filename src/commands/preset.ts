import { theme } from "../ui/format.js";
import {
  loadSkillsRegistry,
  loadSourcesRegistry,
  loadAgentsRegistry,
} from "../registry/loader.js";
import {
  getPresetCategories,
  getSkillsByCategories,
  getAllPresetNames,
} from "../registry/skills.js";
import {
  getPluginPresetCategories,
  getPluginsByCategories,
  getAllPluginPresetNames,
} from "../registry/agents.js";
import { installSkills } from "../install/skills.js";
import { installPlugins } from "../install/agents.js";
import { isClaudeCliAvailable, printClaudeCliError } from "../install/agents.js";
import type { InstallScope } from "../registry/types.js";

export async function cmdPreset(
  presetName: string,
  scope: InstallScope,
): Promise<void> {
  const registry = await loadSkillsRegistry();
  const sources = await loadSourcesRegistry();

  const categories = getPresetCategories(registry, presetName);
  if (!categories) {
    console.log(theme.error(`Unknown preset: ${presetName}`));
    console.log("");
    console.log("Available presets:");
    for (const p of getAllPresetNames(registry)) {
      console.log(`  ${p}`);
    }
    process.exit(1);
  }

  console.log(
    theme.bold(`Installing preset: ${theme.accent(presetName)}`),
  );

  const skills = getSkillsByCategories(registry, categories);
  const skillNames = skills.map((s) => s.name);

  await installSkills(skillNames, registry, sources, scope);
}

export async function cmdAgentsPreset(
  presetName: string,
  scope: InstallScope,
): Promise<void> {
  const registry = await loadAgentsRegistry();

  if (!(await isClaudeCliAvailable())) {
    printClaudeCliError();
    process.exit(1);
  }

  const categories = getPluginPresetCategories(registry, presetName);
  if (!categories) {
    console.log(theme.error(`Unknown plugin preset: ${presetName}`));
    console.log("");
    console.log("Available presets:");
    for (const p of getAllPluginPresetNames(registry)) {
      console.log(`  ${p}`);
    }
    process.exit(1);
  }

  console.log(
    theme.bold(`Installing plugin preset: ${theme.accent(presetName)}`),
  );

  const plugins = getPluginsByCategories(registry, categories);
  const pluginNames = plugins.map((p) => p.name);

  await installPlugins(pluginNames, registry, scope);
}

import * as p from "@clack/prompts";
import { theme } from "../ui/format.js";
import { printBanner } from "../ui/banner.js";
import {
  loadSkillsRegistry,
  loadSourcesRegistry,
  loadAgentsRegistry,
} from "../registry/loader.js";
import { getSkillByName } from "../registry/skills.js";
import { getPluginByName } from "../registry/agents.js";
import { installSkills } from "../install/skills.js";
import { installPlugins, isClaudeCliAvailable, printClaudeCliError } from "../install/agents.js";
import { searchCheckboxMenu } from "../prompts/search-checkbox.js";
import { selectMenu } from "../prompts/select.js";
import type { InstallScope } from "../registry/types.js";

export async function cmdSearch(
  initialFilter: string,
  scope: InstallScope,
  scopeSetByFlag: boolean,
): Promise<void> {
  const registry = await loadSkillsRegistry();
  const sources = await loadSourcesRegistry();

  printBanner();

  const items = registry.skills.map((s) => ({
    name: s.name,
    description: s.description,
  }));

  console.log("");
  const selected = await searchCheckboxMenu(
    `Search skills (${registry.skills.length} available)`,
    items,
    initialFilter,
  );

  if (!selected || selected.length === 0) {
    if (selected === null) {
      console.log("");
      console.log(theme.warn("Search cancelled."));
    } else {
      console.log(theme.warn("No skills selected. Exiting."));
    }
    process.exit(0);
  }

  // Scope selection
  if (!scopeSetByFlag) {
    const scopeResult = await selectScopeMenu();
    if (scopeResult) scope = scopeResult;
  }

  // Confirmation
  console.log("");
  console.log(theme.bold(`Skills to install (${selected.length}):`));
  console.log(theme.dim(`  Scope: ${scope}`));
  console.log("");
  for (const name of selected) {
    const skill = getSkillByName(registry, name);
    console.log(
      `  ${theme.success("+")} ${theme.bold(name)}  ${theme.dim(skill?.description ?? "")}`,
    );
  }
  console.log("");

  const confirm = await p.confirm({ message: "Install these skills?" });
  if (p.isCancel(confirm) || !confirm) {
    console.log(theme.warn("Installation cancelled."));
    process.exit(0);
  }

  await installSkills(selected, registry, sources, scope);
}

export async function cmdAgentsSearch(
  initialFilter: string,
  scope: InstallScope,
  scopeSetByFlag: boolean,
): Promise<void> {
  const registry = await loadAgentsRegistry();

  if (!(await isClaudeCliAvailable())) {
    printClaudeCliError();
    process.exit(1);
  }

  printBanner();

  const items = registry.plugins.map((p) => ({
    name: p.name,
    description: p.description,
  }));

  console.log("");
  const selected = await searchCheckboxMenu(
    `Search plugins (${registry.plugins.length} available)`,
    items,
    initialFilter,
  );

  if (!selected || selected.length === 0) {
    if (selected === null) {
      console.log("");
      console.log(theme.warn("Search cancelled."));
    } else {
      console.log(theme.warn("No plugins selected. Exiting."));
    }
    process.exit(0);
  }

  // Scope selection
  if (!scopeSetByFlag) {
    const scopeResult = await selectAgentScopeMenu();
    if (scopeResult) scope = scopeResult;
  }

  // Confirmation
  console.log("");
  console.log(theme.bold(`Plugins to install (${selected.length}):`));
  console.log(theme.dim(`  Scope: ${scope}`));
  console.log("");
  for (const name of selected) {
    const plugin = getPluginByName(registry, name);
    if (plugin) {
      console.log(
        `  ${theme.success("+")} ${theme.bold(name)}@${plugin.marketplace} ${theme.dim(`(${plugin.agent_count} agents) ${plugin.description}`)}`,
      );
    }
  }
  console.log("");

  const confirm = await p.confirm({ message: "Install these plugins?" });
  if (p.isCancel(confirm) || !confirm) {
    console.log(theme.warn("Installation cancelled."));
    process.exit(0);
  }

  await installPlugins(selected, registry, scope);
}

export async function selectScopeMenu(): Promise<InstallScope | null> {
  const result = await selectMenu("Where should these be installed?", [
    {
      label: "Project scope",
      description: ".claude/ — shared with all collaborators via git",
      value: "project",
    },
    {
      label: "User scope",
      description: "~/.claude/ — available in all your projects",
      value: "user",
    },
    {
      label: "Local scope",
      description: ".claude/ + .gitignore — this repo only, not committed",
      value: "local",
    },
  ]);
  return result as InstallScope | null;
}

export async function selectAgentScopeMenu(): Promise<InstallScope | null> {
  const result = await selectMenu("Where should plugins be installed?", [
    {
      label: "Project scope",
      description: ".claude/settings.json — shared with collaborators via git",
      value: "project",
    },
    {
      label: "User scope",
      description: "~/.claude/settings.json — available in all your projects",
      value: "user",
    },
    {
      label: "Local scope",
      description:
        ".claude/settings.local.json — this repo only, auto-gitignored",
      value: "local",
    },
  ]);
  return result as InstallScope | null;
}

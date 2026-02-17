import * as p from "@clack/prompts";
import { theme } from "../ui/format.js";
import { printBanner } from "../ui/banner.js";
import { discoverSkillsForTags } from "../skills-bridge/discover.js";
import { installDiscoveredSkills } from "../skills-bridge/install.js";
import { getInstalledSkillMetadata } from "../skills-bridge/installed.js";
import { updateClaudeMd } from "../install/claude-md.js";
import { searchCheckboxMenu } from "../prompts/search-checkbox.js";
import { selectMenu } from "../prompts/select.js";
import type { InstallScope } from "../types.js";

export async function cmdSearch(
  initialFilter: string,
  scope: InstallScope,
  scopeSetByFlag: boolean,
): Promise<void> {
  printBanner();

  const tags = initialFilter ? [initialFilter] : ["general"];
  const s = p.spinner();
  s.start("Searching skills ecosystem...");
  let discovered;
  try {
    discovered = await discoverSkillsForTags(tags);
  } catch {
    s.stop("Search failed");
    console.log(theme.warn("Could not reach skills.sh."));
    return;
  }
  s.stop(`Found ${discovered.length} skills`);

  if (discovered.length === 0) {
    console.log(theme.warn("No skills found matching your search."));
    process.exit(0);
  }

  const items = discovered.map((sk) => ({
    name: sk.name,
    description: `${sk.installName}${sk.description ? " — " + sk.description : ""}`,
  }));

  console.log("");
  const selected = await searchCheckboxMenu(
    `Select skills (${discovered.length} found)`,
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

  if (!scopeSetByFlag) {
    const scopeResult = await selectScopeMenu();
    if (scopeResult) scope = scopeResult;
  }

  const selectedSkills = discovered.filter((s) => selected.includes(s.name));

  console.log("");
  console.log(theme.bold(`Skills to install (${selectedSkills.length}):`));
  console.log(theme.dim(`  Scope: ${scope}`));
  console.log("");
  for (const skill of selectedSkills) {
    console.log(`  ${theme.success("+")} ${theme.bold(skill.name)}  ${theme.dim(skill.installName)}`);
  }
  console.log("");

  const confirm = await p.confirm({ message: "Install these skills?" });
  if (p.isCancel(confirm) || !confirm) {
    console.log(theme.warn("Installation cancelled."));
    process.exit(0);
  }

  const cwd = process.cwd();
  const result = await installDiscoveredSkills(selectedSkills, scope, cwd);

  if (result.success > 0) {
    const installed = await getInstalledSkillMetadata(cwd);
    await updateClaudeMd(installed, scope);
  }
}

export async function selectScopeMenu(): Promise<InstallScope | null> {
  const result = await selectMenu("Where should these be installed?", [
    { label: "Project scope", description: ".claude/ — shared with all collaborators via git", value: "project" },
    { label: "User scope", description: "~/.claude/ — available in all your projects", value: "user" },
    { label: "Local scope", description: ".claude/ + .gitignore — this repo only, not committed", value: "local" },
  ]);
  return result as InstallScope | null;
}

import * as p from "@clack/prompts";
import { theme } from "../ui/format.js";
import { printBanner } from "../ui/banner.js";
import { discoverSkills } from "../skills-bridge/discover.js";
import { installDiscoveredSkills } from "../skills-bridge/install.js";
import { getInstalledSkillMetadata } from "../skills-bridge/installed.js";
import { updateClaudeMd } from "../install/claude-md.js";
import { checkboxMenu } from "../prompts/checkbox.js";
import { selectScopeMenu } from "./search.js";
import { runDetection } from "./scan.js";
import type { InstallScope } from "../types.js";

export async function cmdInteractive(
  scope: InstallScope,
  scopeSetByFlag: boolean,
): Promise<void> {
  printBanner();

  // Step 1: Scan
  const detection = await runDetection();
  if (detection.techs.length > 0) {
    console.log("");
    console.log(`  ${theme.success("Detected:")} ${theme.bold(detection.techs.join(", "))}`);
    if (detection.archetypes?.length) {
      console.log(`  ${theme.dim("Project type:")} ${detection.archetypes.join(", ")}`);
    }
  } else {
    console.log("");
    console.log(`  ${theme.warn("No project signals detected.")} Falling back to general skills.`);
  }

  // Step 2: Discover
  const tags = detection.skillTags.length > 0 ? detection.skillTags : ["general"];
  const discoverSpinner = p.spinner();
  discoverSpinner.start("Discovering skills from ecosystem...");
  let discovered;
  try {
    discovered = await discoverSkills(tags);
  } catch {
    discoverSpinner.stop("Discovery failed");
    console.log(theme.warn("Could not reach skills.sh. Check your internet connection."));
    return;
  }
  discoverSpinner.stop(`Found ${discovered.length} skills`);

  if (discovered.length === 0) {
    console.log(theme.warn("No matching skills found."));
    return;
  }

  // Step 3: Review & Select
  const options = discovered.map((s) => ({
    label: s.name,
    description: `${s.installName}${s.isDefault ? " [recommended]" : ""}${s.description ? " — " + s.description : ""}`,
    value: s.name,
  }));
  const preselected = discovered.filter((s) => s.isDefault || s.relevance >= 2).map((s) => s.name);

  console.log("");
  const selectedNames = await checkboxMenu("Select skills to install", options, { preselected });
  if (!selectedNames || selectedNames.length === 0) {
    console.log(theme.warn("No skills selected. Exiting."));
    process.exit(0);
  }

  const selectedSkills = discovered.filter((s) => selectedNames.includes(s.name));

  // Step 4: Scope
  if (!scopeSetByFlag) {
    console.log("");
    const scopeResult = await selectScopeMenu();
    if (scopeResult) scope = scopeResult;
  }

  // Step 5: Confirm
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

  // Step 6: Install
  const cwd = process.cwd();
  const installSpinner = p.spinner();
  installSpinner.start(`Installing skills (0/${selectedSkills.length})...`);
  const result = await installDiscoveredSkills(selectedSkills, scope, cwd);
  installSpinner.stop(`Installed ${result.success} skills${result.failed > 0 ? ` (${result.failed} failed)` : ""}`);

  // Step 7: CLAUDE.md
  if (result.success > 0) {
    const installed = await getInstalledSkillMetadata(cwd);
    await updateClaudeMd(installed, scope);
  }
}

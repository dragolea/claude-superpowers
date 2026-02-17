import { theme } from "../ui/format.js";
import { getInstalledSkillMetadata } from "../skills-bridge/installed.js";

export async function cmdList(): Promise<void> {
  const cwd = process.cwd();
  const skills = await getInstalledSkillMetadata(cwd);

  if (skills.length === 0) {
    console.log("");
    console.log(theme.warn("No skills installed in this project."));
    console.log(theme.dim("Run npx superpower-installer to install skills."));
    console.log("");
    return;
  }

  console.log("");
  console.log(theme.bold(`Installed Skills (${skills.length})`));
  console.log("");

  for (const skill of skills) {
    console.log(`  ${theme.bold(skill.name)}`);
    console.log(`  ${theme.dim(skill.description)}`);
    console.log(`  ${theme.dim(skill.path)}`);
    console.log("");
  }
}

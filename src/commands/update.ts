import * as p from "@clack/prompts";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { theme } from "../ui/format.js";
import { getInstalledSkillMetadata } from "../skills-bridge/installed.js";

const execFileAsync = promisify(execFile);

export async function cmdUpdate(): Promise<void> {
  const cwd = process.cwd();
  const skills = await getInstalledSkillMetadata(cwd);

  if (skills.length === 0) {
    console.log(theme.warn("No skills installed. Nothing to update."));
    return;
  }

  console.log(theme.bold(`Updating ${skills.length} installed skills...`));
  console.log("");

  const s = p.spinner();
  s.start("Updating skills...");

  try {
    await execFileAsync("npx", ["skills", "update"], { cwd, timeout: 120000 });
    s.stop("Skills updated");
  } catch {
    s.stop("Update completed with warnings");
    console.log(theme.dim("Some skills may not have been updated. Run 'npx skills check' for details."));
  }
}

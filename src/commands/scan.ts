import * as p from "@clack/prompts";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { theme } from "../ui/format.js";
import { detectProject } from "../detect/patterns.js";
import { detectProjectAI } from "../detect/ai.js";
import type { DetectionResult } from "../detect/patterns.js";

const execFileAsync = promisify(execFile);

async function isClaudeCliAvailable(): Promise<boolean> {
  try {
    await execFileAsync("claude", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

export async function runDetection(): Promise<DetectionResult> {
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;
  if (isTTY && (await isClaudeCliAvailable())) {
    const useAI = await p.confirm({
      message: "Scan project with AI? (better detection)",
      initialValue: true,
    });
    if (!p.isCancel(useAI) && useAI) {
      const aiResult = await detectProjectAI();
      if (aiResult && aiResult.techs.length > 0) return aiResult;
    }
  }
  return detectProject();
}

export async function cmdScan(): Promise<void> {
  const result = await runDetection();
  if (result.techs.length === 0) {
    console.log("");
    console.log(theme.warn("No project signals detected in current directory."));
    console.log(theme.dim("Run from a project root with package.json, go.mod, etc."));
    console.log("");
    return;
  }
  console.log("");
  console.log(theme.heading("Project scan results"));
  console.log("");
  console.log(`  ${theme.bold("Detected:")} ${result.techs.join(", ")}`);
  console.log("");
  console.log(`  ${theme.bold("Skill tags:")}`);
  for (const tag of result.skillTags) {
    console.log(`    ${theme.success("+")} ${tag}`);
  }
  if (result.archetypes?.length) {
    console.log("");
    console.log(`  ${theme.bold("Archetypes:")}`);
    for (const arch of result.archetypes) {
      console.log(`    ${theme.success("+")} ${arch}`);
    }
  }
  console.log("");
}

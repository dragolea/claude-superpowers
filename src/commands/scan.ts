import * as p from "@clack/prompts";
import { theme } from "../ui/format.js";
import { detectProject } from "../detect/patterns.js";
import { detectProjectAI } from "../detect/ai.js";
import { isClaudeCliAvailable } from "../install/agents.js";
import type { DetectionResult } from "../detect/patterns.js";

/**
 * Run project detection: smart mode (AI if available, pattern fallback).
 */
export async function runDetection(): Promise<DetectionResult> {
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;

  // Check if claude CLI is available for AI detection
  if (isTTY && (await isClaudeCliAvailable())) {
    const useAI = await p.confirm({
      message: "Scan project with AI? (better detection)",
      initialValue: true,
    });

    if (!p.isCancel(useAI) && useAI) {
      const aiResult = await detectProjectAI();
      if (aiResult && aiResult.techs.length > 0) {
        return aiResult;
      }
    }
  }

  // Fallback: pattern-based detection
  return detectProject();
}

export async function cmdScan(): Promise<void> {
  const result = await runDetection();

  if (result.techs.length === 0) {
    console.log("");
    console.log(theme.warn("No project signals detected in current directory."));
    console.log(
      theme.dim("Run from a project root with package.json, go.mod, etc."),
    );
    console.log("");
    return;
  }

  console.log("");
  console.log(theme.heading("Project scan results"));
  console.log("");

  console.log(`  ${theme.bold("Detected:")} ${result.techs.join(", ")}`);
  console.log("");

  console.log(`  ${theme.bold("Skill categories:")}`);
  for (const cat of result.skillCats) {
    console.log(`    ${theme.success("+")} ${cat}`);
  }
  console.log("");

  console.log(`  ${theme.bold("Agent categories:")}`);
  for (const cat of result.agentCats) {
    console.log(`    ${theme.success("+")} ${cat}`);
  }
  console.log("");
}

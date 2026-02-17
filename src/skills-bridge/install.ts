/**
 * Install discovered skills by shelling out to `npx skills add`.
 *
 * We use the CLI instead of the programmatic API because
 * `installRemoteSkillForAgent` requires pre-populated content that
 * the search API does not provide. The CLI handles the full
 * clone + install flow.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type { DiscoveredSkill, InstallScope } from "../types.js";

const execFileAsync = promisify(execFile);

export interface InstallResult {
  success: boolean;
  error?: string;
}

export interface BulkInstallResult {
  total: number;
  success: number;
  failed: number;
  results: Array<{ name: string; result: InstallResult }>;
}

/**
 * Install a single skill by shelling out to:
 *   npx skills add <source> --skill <name> -a claude-code -y [-g]
 *
 * @param skill - The discovered skill to install
 * @param scope - "project" for local install, "user" for global (-g flag)
 * @param cwd   - Working directory for the child process
 */
export async function installDiscoveredSkill(
  skill: DiscoveredSkill,
  scope: InstallScope,
  cwd: string,
): Promise<InstallResult> {
  const isGlobal = scope === "user";
  const args = [
    "skills",
    "add",
    skill.installName,
    "--skill",
    skill.name,
    "-a",
    "claude-code",
    "-y",
  ];
  if (isGlobal) args.push("-g");

  try {
    await execFileAsync("npx", args, { cwd, timeout: 60_000 });
    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Install multiple skills sequentially, collecting results.
 */
export async function installDiscoveredSkills(
  skills: DiscoveredSkill[],
  scope: InstallScope,
  cwd: string,
): Promise<BulkInstallResult> {
  const results: Array<{ name: string; result: InstallResult }> = [];
  let successCount = 0;
  let failedCount = 0;

  for (const skill of skills) {
    const result = await installDiscoveredSkill(skill, scope, cwd);
    results.push({ name: skill.name, result });
    if (result.success) {
      successCount += 1;
    } else {
      failedCount += 1;
    }
  }

  return {
    total: skills.length,
    success: successCount,
    failed: failedCount,
    results,
  };
}

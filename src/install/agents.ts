import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { theme, formatInstallSummary } from "../ui/format.js";
import {
  getPluginByName,
  getMarketplaceRepo,
  getAllMarketplaceIds,
} from "../registry/agents.js";
import type { AgentsRegistry, InstallScope } from "../registry/types.js";

const execFileAsync = promisify(execFile);

export async function isClaudeCliAvailable(): Promise<boolean> {
  try {
    await execFileAsync("claude", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

export function printClaudeCliError(): void {
  console.log("");
  console.log(
    theme.error("Error: Claude CLI is required for agent/plugin installation."),
  );
  console.log("");
  console.log(
    `Install it from: ${theme.bold("https://docs.anthropic.com/en/docs/claude-code/overview")}`,
  );
  console.log(
    `  ${theme.dim("npm install -g @anthropic-ai/claude-code")}`,
  );
  console.log("");
  console.log(
    theme.dim(
      "Note: Skills can still be installed without the CLI (npx superpower-installer without --agents).",
    ),
  );
}

async function ensureMarketplace(
  marketplaceId: string,
  repo: string,
): Promise<void> {
  try {
    const { stdout } = await execFileAsync("claude", [
      "plugin",
      "marketplace",
      "list",
    ]);
    if (stdout.includes(repo)) return;
  } catch {
    // If listing fails, try to add anyway
  }

  console.log(`  ${theme.dim(`Adding marketplace: ${repo}`)}`);
  try {
    await execFileAsync("claude", ["plugin", "marketplace", "add", repo]);
  } catch {
    console.log(
      `  ${theme.warn(`Warning: Could not add marketplace ${repo}`)}`,
    );
  }
}

export async function ensureAllMarketplaces(
  registry: AgentsRegistry,
  marketplaceIds?: string[],
): Promise<void> {
  const ids = marketplaceIds ?? getAllMarketplaceIds(registry);
  console.log(theme.dim("Ensuring plugin marketplaces are configured..."));

  for (const id of ids) {
    const repo = getMarketplaceRepo(registry, id);
    await ensureMarketplace(id, repo);
  }
  console.log("");
}

async function installPlugin(
  pluginName: string,
  marketplace: string,
  agentCount: number,
  scope: InstallScope,
): Promise<boolean> {
  try {
    await execFileAsync("claude", [
      "plugin",
      "install",
      `${pluginName}@${marketplace}`,
      "--scope",
      scope,
    ]);
    console.log(
      `  ${theme.success("+")} ${pluginName}@${marketplace} ${theme.dim(`(${agentCount} agents)`)}`,
    );
    return true;
  } catch {
    console.log(
      `  ${theme.error("x")} ${pluginName}@${marketplace} ${theme.dim("(install failed)")}`,
    );
    return false;
  }
}

export async function installPlugins(
  pluginNames: string[],
  registry: AgentsRegistry,
  scope: InstallScope,
): Promise<void> {
  const total = pluginNames.length;
  let success = 0;
  let failed = 0;
  let totalAgents = 0;

  // Collect unique marketplaces
  const marketplaceIds = new Set<string>();
  for (const name of pluginNames) {
    const plugin = getPluginByName(registry, name);
    if (plugin) marketplaceIds.add(plugin.marketplace);
  }

  await ensureAllMarketplaces(registry, [...marketplaceIds]);

  console.log("");
  console.log(theme.bold(`Installing ${total} plugins (scope: ${scope})`));
  console.log("");

  for (const name of pluginNames) {
    const plugin = getPluginByName(registry, name);
    if (!plugin) {
      console.log(
        `  ${theme.error("x")} ${name} ${theme.dim("(not in registry)")}`,
      );
      failed++;
      continue;
    }

    const ok = await installPlugin(
      name,
      plugin.marketplace,
      plugin.agent_count,
      scope,
    );
    if (ok) {
      success++;
      totalAgents += plugin.agent_count;
    } else {
      failed++;
    }
  }

  console.log(
    formatInstallSummary({
      type: "plugins",
      success,
      failed,
      scope,
      totalAgents,
    }),
  );
}

export async function updatePlugins(
  registry: AgentsRegistry,
): Promise<void> {
  console.log(theme.bold("Updating installed plugins..."));
  console.log("");

  await ensureAllMarketplaces(registry);

  let success = 0;
  let failed = 0;

  for (const plugin of registry.plugins) {
    try {
      await execFileAsync("claude", [
        "plugin",
        "update",
        `${plugin.name}@${plugin.marketplace}`,
      ]);
      console.log(
        `  ${theme.success("+")} ${plugin.name}@${plugin.marketplace} ${theme.dim("(updated)")}`,
      );
      success++;
    } catch {
      failed++;
    }
  }

  console.log("");
  console.log(theme.separator());
  console.log(`  ${theme.success("Updated:")} ${success} plugins`);
  if (failed > 0) {
    console.log(
      `  ${theme.dim("Skipped:")} ${failed} plugins (not installed or unchanged)`,
    );
  }
  console.log(theme.separator());
  console.log("");
}

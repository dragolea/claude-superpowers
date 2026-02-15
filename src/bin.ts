import { Command } from "commander";
import { getVersion, printBanner } from "./ui/banner.js";
import { cmdList, cmdAgentsList } from "./commands/list.js";
import { cmdPreset, cmdAgentsPreset } from "./commands/preset.js";
import { cmdSearch, cmdAgentsSearch } from "./commands/search.js";
import { cmdUpdate, cmdAgentsUpdate } from "./commands/update.js";
import { cmdScan } from "./commands/scan.js";
import { cmdInteractive, cmdAgentsInteractive } from "./commands/interactive.js";
import type { InstallScope } from "./registry/types.js";

const program = new Command();

// Global state
let installScope: InstallScope = "project";
let scopeSetByFlag = false;

program
  .name("superpower-installer")
  .description(
    "Interactive installer for Claude Code skills and agent plugins",
  )
  .version(getVersion(), "-v, --version")
  .option(
    "--scope <scope>",
    "Installation scope: project, user, or local",
    (value: string) => {
      if (!["project", "user", "local"].includes(value)) {
        console.error(`Error: invalid scope '${value}'. Use: user, project, local`);
        process.exit(1);
      }
      installScope = value as InstallScope;
      scopeSetByFlag = true;
      return value;
    },
  )
  .option("-l, --list", "List all available skills")
  .option("-p, --preset <name>", "Install a named preset")
  .option("-s, --search [term]", "Search & pick individual skills")
  .option("-u, --update", "Re-download installed skills")
  .option("--scan", "Detect project tech stack")
  .option("--agents", "Agent/plugin mode");

program.action(async (opts) => {
  try {
    const isAgentMode = opts.agents === true;

    if (isAgentMode) {
      if (opts.list) {
        await cmdAgentsList();
      } else if (opts.preset) {
        await cmdAgentsPreset(opts.preset, installScope);
      } else if (opts.search !== undefined) {
        const term = typeof opts.search === "string" ? opts.search : "";
        await cmdAgentsSearch(term, installScope, scopeSetByFlag);
      } else if (opts.update) {
        await cmdAgentsUpdate();
      } else {
        await cmdAgentsInteractive(installScope, scopeSetByFlag);
      }
    } else {
      if (opts.list) {
        await cmdList(installScope);
      } else if (opts.preset) {
        await cmdPreset(opts.preset, installScope);
      } else if (opts.search !== undefined) {
        const term = typeof opts.search === "string" ? opts.search : "";
        await cmdSearch(term, installScope, scopeSetByFlag);
      } else if (opts.update) {
        await cmdUpdate(installScope);
      } else if (opts.scan) {
        await cmdScan();
      } else {
        await cmdInteractive(installScope, scopeSetByFlag);
      }
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    }
    process.exit(1);
  }
});

program.parse();

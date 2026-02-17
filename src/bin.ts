import { Command } from "commander";
import { getVersion } from "./ui/banner.js";
import { cmdList } from "./commands/list.js";
import { cmdSearch } from "./commands/search.js";
import { cmdUpdate } from "./commands/update.js";
import { cmdScan } from "./commands/scan.js";
import { cmdInteractive } from "./commands/interactive.js";
import type { InstallScope } from "./types.js";

const program = new Command();

let installScope: InstallScope = "project";
let scopeSetByFlag = false;

program
  .name("superpower-installer")
  .description("Smart skill installer for Claude Code — scans your project, discovers skills")
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
  .option("-l, --list", "List installed skills")
  .option("-s, --search [term]", "Search & install skills from ecosystem")
  .option("-u, --update", "Update installed skills")
  .option("--scan", "Detect project tech stack");

program.action(async (opts) => {
  try {
    if (opts.list) {
      await cmdList();
    } else if (opts.search !== undefined) {
      const term = typeof opts.search === "string" ? opts.search : "";
      await cmdSearch(term, installScope, scopeSetByFlag);
    } else if (opts.update) {
      await cmdUpdate();
    } else if (opts.scan) {
      await cmdScan();
    } else {
      await cmdInteractive(installScope, scopeSetByFlag);
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    }
    process.exit(1);
  }
});

program.parse();

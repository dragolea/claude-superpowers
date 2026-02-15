import pc from "picocolors";

const VERSION = "2.0.0";

export function printBanner(): void {
  console.log("");
  console.log(pc.bold(pc.cyan(`   _____ _                 _        `)));
  console.log(pc.bold(pc.cyan(`  / ____| |               | |       `)));
  console.log(pc.bold(pc.cyan(` | |    | | __ _ _   _  __| | ___   `)));
  console.log(pc.bold(pc.cyan(` | |    | |/ _\` | | | |/ _\` |/ _ \\  `)));
  console.log(pc.bold(pc.cyan(` | |____| | (_| | |_| | (_| |  __/  `)));
  console.log(pc.bold(pc.cyan(`  \\_____|_|\\__,_|\\__,_|\\__,_|\\___|  `)));
  console.log(pc.bold(pc.cyan(`                                     `)));
  console.log(`  ${pc.yellow("S U P E R P O W E R S")}`);
  console.log(`  ${pc.dim(`v${VERSION} — Curated skill installer`)}`);
  console.log("");
}

export function getVersion(): string {
  return VERSION;
}

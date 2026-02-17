import pc from "picocolors";

// Color theme — matches the bash script's palette
export const theme = {
  error: pc.red,
  success: pc.green,
  warn: pc.yellow,
  info: pc.blue,
  accent: pc.cyan,
  bold: pc.bold,
  dim: pc.dim,
  heading: (s: string) => pc.bold(pc.cyan(s)),
  separator: () => pc.bold("────────────────────────────────────"),
};

export function formatSkillLine(
  name: string,
  description: string,
  installed = false,
): string {
  const tag = installed ? theme.success(" (installed)") : "";
  return `    ${theme.bold(name)}${tag}\n    ${theme.dim(description)}`;
}

export function formatInstallSummary(opts: {
  success: number;
  failed: number;
  scope: string;
  skillsDir?: string;
}): string {
  const lines: string[] = ["", theme.separator()];

  lines.push(`  ${theme.success("Installed:")} ${opts.success} skills`);

  if (opts.failed > 0) {
    lines.push(`  ${theme.error("Failed:")}    ${opts.failed} skills`);
  }

  lines.push(theme.separator());
  lines.push("");
  lines.push(`  ${theme.dim("Scope:")}     ${opts.scope}`);

  if (opts.skillsDir) {
    lines.push(`Skills installed to: ${theme.bold(opts.skillsDir + "/")}`);
    if (opts.scope === "local") {
      lines.push(
        `Entries added to ${theme.bold(".gitignore")} ${theme.dim("(local scope)")}`,
      );
    }
    lines.push(
      `Run ${theme.dim("npx superpower-installer --update")} to refresh later.`,
    );
  }

  lines.push("");
  return lines.join("\n");
}

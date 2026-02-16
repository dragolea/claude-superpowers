import { homedir } from "node:os";
import type { InstallScope } from "../registry/types.js";

export function resolveSkillsDir(scope: InstallScope): string {
  switch (scope) {
    case "user":
      return `${homedir()}/.claude/skills`;
    case "project":
    case "local":
      return ".claude/skills";
  }
}

export function resolveClaudeMdPath(scope: InstallScope): string {
  switch (scope) {
    case "user":
      return `${homedir()}/.claude/CLAUDE.md`;
    case "project":
      return "CLAUDE.md";
    case "local":
      return "CLAUDE.local.md";
  }
}

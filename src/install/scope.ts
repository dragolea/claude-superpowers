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

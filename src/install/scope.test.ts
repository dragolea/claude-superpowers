import { describe, it, expect } from "vitest";
import { homedir } from "node:os";
import { resolveSkillsDir, resolveClaudeMdPath } from "./scope.js";

describe("resolveSkillsDir", () => {
  it("returns user home path for user scope", () => {
    expect(resolveSkillsDir("user")).toBe(`${homedir()}/.claude/skills`);
  });

  it("returns local path for project scope", () => {
    expect(resolveSkillsDir("project")).toBe(".claude/skills");
  });

  it("returns local path for local scope", () => {
    expect(resolveSkillsDir("local")).toBe(".claude/skills");
  });
});

describe("resolveClaudeMdPath", () => {
  it("returns user home path for user scope", () => {
    expect(resolveClaudeMdPath("user")).toBe(`${homedir()}/.claude/CLAUDE.md`);
  });

  it("returns CLAUDE.md for project scope", () => {
    expect(resolveClaudeMdPath("project")).toBe("CLAUDE.md");
  });

  it("returns CLAUDE.local.md for local scope", () => {
    expect(resolveClaudeMdPath("local")).toBe("CLAUDE.local.md");
  });
});

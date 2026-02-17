import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateClaudeMdSection, updateClaudeMd } from "../../src/install/claude-md.js";
import type { SkillMetadata } from "../../src/types.js";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

vi.mock("../../src/install/scope.js", () => ({
  resolveClaudeMdPath: vi.fn(() => "/fake/CLAUDE.md"),
}));

vi.mock("../../src/ui/format.js", () => ({
  theme: {
    success: (s: string) => s,
    warn: (s: string) => s,
    bold: (s: string) => s,
    dim: (s: string) => s,
  },
}));

import { readFile, writeFile, mkdir } from "node:fs/promises";

const mockReadFile = vi.mocked(readFile);
const mockWriteFile = vi.mocked(writeFile);
const mockMkdir = vi.mocked(mkdir);

beforeEach(() => {
  vi.clearAllMocks();
  mockMkdir.mockResolvedValue(undefined);
  mockWriteFile.mockResolvedValue(undefined);
});

// ---- generateClaudeMdSection ----

describe("generateClaudeMdSection", () => {
  it("returns empty string for empty input", () => {
    const output = generateClaudeMdSection([]);
    expect(output).toBe("");
  });

  it("generates section with markers, heading, and skill entries", () => {
    const skills: SkillMetadata[] = [
      { name: "foo", description: "bar", path: "/skills/foo/SKILL.md" },
    ];
    const output = generateClaudeMdSection(skills);

    expect(output).toContain("<!-- superpower-skills-start -->");
    expect(output).toContain("<!-- superpower-skills-end -->");
    expect(output).toContain("# Superpowers Skills");
    expect(output).toContain("ALWAYS check if a superpowers skill applies before starting any task.");
    expect(output).toContain("- Use foo — bar");
  });

  it("generates multiple skill entries", () => {
    const skills: SkillMetadata[] = [
      { name: "debugging", description: "Four-phase root cause analysis", path: "/a" },
      { name: "tdd", description: "RED-GREEN-REFACTOR cycle", path: "/b" },
      { name: "brainstorming", description: "Collaborative design exploration", path: "/c" },
    ];
    const output = generateClaudeMdSection(skills);

    expect(output).toContain("- Use debugging — Four-phase root cause analysis");
    expect(output).toContain("- Use tdd — RED-GREEN-REFACTOR cycle");
    expect(output).toContain("- Use brainstorming — Collaborative design exploration");
  });

  it("starts with marker and ends with marker", () => {
    const skills: SkillMetadata[] = [
      { name: "foo", description: "bar", path: "/a" },
    ];
    const output = generateClaudeMdSection(skills);

    expect(output.startsWith("<!-- superpower-skills-start -->")).toBe(true);
    expect(output.endsWith("<!-- superpower-skills-end -->")).toBe(true);
  });
});

// ---- updateClaudeMd ----

describe("updateClaudeMd", () => {
  it("does nothing for empty skills array", async () => {
    await updateClaudeMd([], "project");
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("replaces existing section between markers", async () => {
    const existing =
      "# My Project\n\nSome content.\n\n" +
      "<!-- superpower-skills-start -->\nold content\n<!-- superpower-skills-end -->" +
      "\n\n# Footer\n";

    mockReadFile.mockResolvedValue(existing as any);

    const skills: SkillMetadata[] = [
      { name: "new-skill", description: "New description", path: "/a" },
    ];

    await updateClaudeMd(skills, "project");

    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    const written = mockWriteFile.mock.calls[0][1] as string;
    expect(written).toContain("# My Project");
    expect(written).toContain("- Use new-skill — New description");
    expect(written).toContain("# Footer");
    expect(written).not.toContain("old content");
  });

  it("appends to existing file without markers", async () => {
    mockReadFile.mockResolvedValue("# Existing content\n\nSome stuff." as any);

    const skills: SkillMetadata[] = [
      { name: "foo", description: "bar", path: "/a" },
    ];

    await updateClaudeMd(skills, "project");

    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    const written = mockWriteFile.mock.calls[0][1] as string;
    expect(written).toContain("# Existing content");
    expect(written).toContain("<!-- superpower-skills-start -->");
    expect(written).toContain("- Use foo — bar");
  });

  it("creates new file when none exists", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));

    const skills: SkillMetadata[] = [
      { name: "foo", description: "bar", path: "/a" },
    ];

    await updateClaudeMd(skills, "project");

    expect(mockWriteFile).toHaveBeenCalledTimes(1);
    const written = mockWriteFile.mock.calls[0][1] as string;
    expect(written).toContain("<!-- superpower-skills-start -->");
    expect(written).toContain("- Use foo — bar");
    expect(written).toContain("<!-- superpower-skills-end -->");
    expect(written.endsWith("\n")).toBe(true);
  });

  it("creates parent directory before writing", async () => {
    mockReadFile.mockRejectedValue(new Error("ENOENT"));

    const skills: SkillMetadata[] = [
      { name: "foo", description: "bar", path: "/a" },
    ];

    await updateClaudeMd(skills, "user");

    expect(mockMkdir).toHaveBeenCalledWith(
      expect.any(String),
      { recursive: true },
    );
  });
});

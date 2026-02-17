import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
}));

import { readdir, readFile } from "node:fs/promises";
import { getInstalledSkillMetadata } from "../../src/skills-bridge/installed.js";

const mockReaddir = vi.mocked(readdir);
const mockReadFile = vi.mocked(readFile);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- Helpers ----

function makeSkillMd(name: string, description: string): string {
  return `---\nname: ${name}\ndescription: ${description}\n---\n# ${name}\n\nContent here.`;
}

// ---- Tests ----

describe("getInstalledSkillMetadata", () => {
  it("returns skills from .claude/skills/ directory", async () => {
    mockReaddir.mockResolvedValueOnce(["frontend-design", "typescript-pro"] as any);
    mockReadFile
      .mockResolvedValueOnce(makeSkillMd("frontend-design", "Design beautiful UIs") as any)
      .mockResolvedValueOnce(makeSkillMd("typescript-pro", "Advanced TypeScript patterns") as any);

    const result = await getInstalledSkillMetadata("/project");

    expect(result).toEqual([
      {
        name: "frontend-design",
        description: "Design beautiful UIs",
        path: "/project/.claude/skills/frontend-design/SKILL.md",
      },
      {
        name: "typescript-pro",
        description: "Advanced TypeScript patterns",
        path: "/project/.claude/skills/typescript-pro/SKILL.md",
      },
    ]);
  });

  it("returns empty array when skills directory does not exist", async () => {
    mockReaddir.mockRejectedValueOnce(new Error("ENOENT: no such file or directory"));

    const result = await getInstalledSkillMetadata("/project");

    expect(result).toEqual([]);
  });

  it("uses directory name as fallback when frontmatter has no name", async () => {
    mockReaddir.mockResolvedValueOnce(["my-skill"] as any);
    mockReadFile.mockResolvedValueOnce("---\ndescription: A skill\n---\nContent" as any);

    const result = await getInstalledSkillMetadata("/project");

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("my-skill");
    expect(result[0]!.description).toBe("A skill");
  });

  it("uses empty description when frontmatter has no description", async () => {
    mockReaddir.mockResolvedValueOnce(["bare-skill"] as any);
    mockReadFile.mockResolvedValueOnce("---\nname: bare-skill\n---\nContent" as any);

    const result = await getInstalledSkillMetadata("/project");

    expect(result).toHaveLength(1);
    expect(result[0]!.description).toBe("");
  });

  it("skips entries without SKILL.md", async () => {
    mockReaddir.mockResolvedValueOnce(["good-skill", "bad-dir"] as any);
    mockReadFile
      .mockResolvedValueOnce(makeSkillMd("good-skill", "Works") as any)
      .mockRejectedValueOnce(new Error("ENOENT: no such file or directory"));

    const result = await getInstalledSkillMetadata("/project");

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("good-skill");
  });

  it("handles SKILL.md without frontmatter", async () => {
    mockReaddir.mockResolvedValueOnce(["no-fm"] as any);
    mockReadFile.mockResolvedValueOnce("# Just markdown, no frontmatter" as any);

    const result = await getInstalledSkillMetadata("/project");

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("no-fm"); // falls back to dir name
    expect(result[0]!.description).toBe("");
  });

  it("reads from .claude/skills/ path", async () => {
    mockReaddir.mockResolvedValueOnce([] as any);

    await getInstalledSkillMetadata("/my/project");

    expect(mockReaddir).toHaveBeenCalledWith("/my/project/.claude/skills");
  });
});

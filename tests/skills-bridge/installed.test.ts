import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("skills/src/installer.ts", () => ({
  listInstalledSkills: vi.fn(async () => []),
}));

import { listInstalledSkills } from "skills/src/installer.ts";
import { getInstalledSkillMetadata } from "../../src/skills-bridge/installed.js";

const mockListInstalledSkills = vi.mocked(listInstalledSkills);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getInstalledSkillMetadata", () => {
  it("maps installed skills to SkillMetadata", async () => {
    mockListInstalledSkills.mockResolvedValueOnce([
      {
        name: "frontend-design",
        description: "Design beautiful UIs",
        path: "/project/.agents/skills/frontend-design/SKILL.md",
        canonicalPath: "/project/.agents/skills/frontend-design",
        scope: "project",
        agents: ["claude-code" as any],
      },
      {
        name: "typescript-pro",
        description: "Advanced TypeScript patterns",
        path: "/project/.agents/skills/typescript-pro/SKILL.md",
        canonicalPath: "/project/.agents/skills/typescript-pro",
        scope: "project",
        agents: ["claude-code" as any, "cursor" as any],
      },
    ]);

    const result = await getInstalledSkillMetadata("/project");

    expect(result).toEqual([
      {
        name: "frontend-design",
        description: "Design beautiful UIs",
        path: "/project/.agents/skills/frontend-design/SKILL.md",
      },
      {
        name: "typescript-pro",
        description: "Advanced TypeScript patterns",
        path: "/project/.agents/skills/typescript-pro/SKILL.md",
      },
    ]);
  });

  it("returns empty array when no skills are installed", async () => {
    mockListInstalledSkills.mockResolvedValueOnce([]);

    const result = await getInstalledSkillMetadata("/project");

    expect(result).toEqual([]);
  });

  it("passes cwd to listInstalledSkills", async () => {
    mockListInstalledSkills.mockResolvedValueOnce([]);

    await getInstalledSkillMetadata("/my/project");

    expect(mockListInstalledSkills).toHaveBeenCalledWith({
      cwd: "/my/project",
    });
  });
});

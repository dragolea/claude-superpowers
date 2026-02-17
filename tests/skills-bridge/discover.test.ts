import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SearchSkill } from "skills/src/find.ts";

vi.mock("skills/src/find.ts", () => ({
  searchSkillsAPI: vi.fn(async () => []),
}));

import { searchSkillsAPI } from "skills/src/find.ts";
import { discoverSkillsForTags } from "../../src/skills-bridge/discover.js";

const mockSearchSkillsAPI = vi.mocked(searchSkillsAPI);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- Helpers ----

function makeSearchSkill(overrides: Partial<SearchSkill> = {}): SearchSkill {
  return {
    name: "test-skill",
    slug: "owner-repo-test-skill",
    source: "owner/repo",
    installs: 100,
    ...overrides,
  };
}

// ---- Tests ----

describe("discoverSkillsForTags", () => {
  it("returns empty array for empty tags", async () => {
    const result = await discoverSkillsForTags([]);
    expect(result).toEqual([]);
    expect(mockSearchSkillsAPI).not.toHaveBeenCalled();
  });

  it("returns mapped skills for a single tag", async () => {
    mockSearchSkillsAPI.mockResolvedValueOnce([
      makeSearchSkill({
        name: "frontend-design",
        slug: "vercel-labs-agent-skills-frontend-design",
        source: "vercel-labs/agent-skills",
        installs: 5000,
      }),
    ]);

    const result = await discoverSkillsForTags(["react"]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: "frontend-design",
      description: "",
      installName: "vercel-labs/agent-skills",
      sourceUrl: "https://skills.sh/vercel-labs-agent-skills-frontend-design",
      relevance: 1,
      matchedTags: ["react"],
    });
  });

  it("deduplicates skills that appear across multiple tags", async () => {
    const sharedSkill = makeSearchSkill({
      name: "typescript-pro",
      slug: "acme-ts-pro",
      source: "acme/ts",
    });

    mockSearchSkillsAPI
      .mockResolvedValueOnce([sharedSkill]) // tag "typescript"
      .mockResolvedValueOnce([sharedSkill]); // tag "node"

    const result = await discoverSkillsForTags(["typescript", "node"]);

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("typescript-pro");
    expect(result[0]!.relevance).toBe(2);
    expect(result[0]!.matchedTags).toEqual(["typescript", "node"]);
  });

  it("ranks multi-tag matches higher than single-tag matches", async () => {
    const popular = makeSearchSkill({
      name: "popular-skill",
      slug: "org-popular",
      source: "org/popular",
    });
    const niche = makeSearchSkill({
      name: "niche-skill",
      slug: "org-niche",
      source: "org/niche",
    });

    // "popular-skill" appears in both tags; "niche-skill" only in one
    mockSearchSkillsAPI
      .mockResolvedValueOnce([popular, niche])
      .mockResolvedValueOnce([popular]);

    const result = await discoverSkillsForTags(["tag-a", "tag-b"]);

    expect(result).toHaveLength(2);
    // popular should be first (relevance 2 > 1)
    expect(result[0]!.name).toBe("popular-skill");
    expect(result[0]!.relevance).toBe(2);
    expect(result[1]!.name).toBe("niche-skill");
    expect(result[1]!.relevance).toBe(1);
  });

  it("sorts alphabetically when relevance is equal", async () => {
    mockSearchSkillsAPI.mockResolvedValueOnce([
      makeSearchSkill({ name: "zeta-skill", slug: "z-slug", source: "org/z" }),
      makeSearchSkill({ name: "alpha-skill", slug: "a-slug", source: "org/a" }),
      makeSearchSkill({ name: "mid-skill", slug: "m-slug", source: "org/m" }),
    ]);

    const result = await discoverSkillsForTags(["tag"]);

    expect(result.map((s) => s.name)).toEqual([
      "alpha-skill",
      "mid-skill",
      "zeta-skill",
    ]);
  });

  it("handles API errors per tag gracefully", async () => {
    // searchSkillsAPI returns [] on error (never throws), so simulate that
    mockSearchSkillsAPI
      .mockResolvedValueOnce([]) // first tag returns nothing (API error)
      .mockResolvedValueOnce([
        makeSearchSkill({ name: "ok-skill", slug: "ok-slug", source: "org/ok" }),
      ]);

    const result = await discoverSkillsForTags(["broken-tag", "good-tag"]);

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("ok-skill");
  });

  it("does not duplicate matched tags when same tag produces same skill", async () => {
    const skill = makeSearchSkill({
      name: "dupe-check",
      slug: "dupe-slug",
      source: "org/dupe",
    });

    // Simulate same tag searched somehow producing the skill twice
    // (shouldn't happen normally, but protects against edge cases)
    mockSearchSkillsAPI.mockResolvedValueOnce([skill, skill]);

    const result = await discoverSkillsForTags(["tag"]);

    expect(result).toHaveLength(1);
    // matchedTags should only contain "tag" once
    expect(result[0]!.matchedTags).toEqual(["tag"]);
  });

  it("calls searchSkillsAPI once per tag", async () => {
    mockSearchSkillsAPI.mockResolvedValue([]);

    await discoverSkillsForTags(["a", "b", "c"]);

    expect(mockSearchSkillsAPI).toHaveBeenCalledTimes(3);
    expect(mockSearchSkillsAPI).toHaveBeenCalledWith("a");
    expect(mockSearchSkillsAPI).toHaveBeenCalledWith("b");
    expect(mockSearchSkillsAPI).toHaveBeenCalledWith("c");
  });
});

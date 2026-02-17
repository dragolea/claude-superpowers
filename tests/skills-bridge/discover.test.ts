import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SearchResult } from "../../src/skills-bridge/search-api.js";

vi.mock("../../src/skills-bridge/search-api.js", () => ({
  searchSkillsAPI: vi.fn(async () => []),
}));

import { searchSkillsAPI } from "../../src/skills-bridge/search-api.js";
import { discoverSkillsForTags, fetchDefaultSkills, discoverSkills } from "../../src/skills-bridge/discover.js";

const mockSearchSkillsAPI = vi.mocked(searchSkillsAPI);

beforeEach(() => {
  vi.clearAllMocks();
});

// ---- Helpers ----

function makeSearchResult(overrides: Partial<SearchResult> = {}): SearchResult {
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
      makeSearchResult({
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
      installs: 5000,
      isDefault: false,
    });
  });

  it("deduplicates skills that appear across multiple tags", async () => {
    const sharedSkill = makeSearchResult({
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
    const popular = makeSearchResult({
      name: "popular-skill",
      slug: "org-popular",
      source: "org/popular",
    });
    const niche = makeSearchResult({
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
      makeSearchResult({ name: "zeta-skill", slug: "z-slug", source: "org/z" }),
      makeSearchResult({ name: "alpha-skill", slug: "a-slug", source: "org/a" }),
      makeSearchResult({ name: "mid-skill", slug: "m-slug", source: "org/m" }),
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
        makeSearchResult({ name: "ok-skill", slug: "ok-slug", source: "org/ok" }),
      ]);

    const result = await discoverSkillsForTags(["broken-tag", "good-tag"]);

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("ok-skill");
  });

  it("does not duplicate matched tags when same tag produces same skill", async () => {
    const skill = makeSearchResult({
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

  it("deduplicates same-name skills across sources, keeping highest installs", async () => {
    const highInstalls = makeSearchResult({
      name: "typescript-pro",
      slug: "jeff-ts-pro",
      source: "jeffallan/claude-skills",
      installs: 428,
    });
    const lowInstalls = makeSearchResult({
      name: "typescript-pro",
      slug: "sickn33-ts-pro",
      source: "sickn33/antigravity-awesome-skills",
      installs: 78,
    });

    mockSearchSkillsAPI.mockResolvedValueOnce([lowInstalls, highInstalls]);

    const result = await discoverSkillsForTags(["typescript"]);

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("typescript-pro");
    expect(result[0]!.installName).toBe("jeffallan/claude-skills");
    expect(result[0]!.installs).toBe(428);
  });

  it("includes installs and isDefault fields in results", async () => {
    mockSearchSkillsAPI.mockResolvedValueOnce([
      makeSearchResult({ name: "my-skill", slug: "slug", source: "org/repo", installs: 999 }),
    ]);

    const result = await discoverSkillsForTags(["tag"]);

    expect(result[0]!.installs).toBe(999);
    expect(result[0]!.isDefault).toBe(false);
  });
});

describe("fetchDefaultSkills", () => {
  it("returns only obra/superpowers skills", async () => {
    mockSearchSkillsAPI.mockResolvedValueOnce([
      makeSearchResult({ name: "brainstorming", slug: "obra/superpowers/brainstorming", source: "obra/superpowers", installs: 21645 }),
      makeSearchResult({ name: "cobrapy", slug: "davila7/claude-code-templates/cobrapy", source: "davila7/claude-code-templates", installs: 91 }),
    ]);

    const result = await fetchDefaultSkills();

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("brainstorming");
    expect(result[0]!.isDefault).toBe(true);
    expect(result[0]!.installName).toBe("obra/superpowers");
  });

  it("returns empty array when API fails", async () => {
    mockSearchSkillsAPI.mockResolvedValueOnce([]);

    const result = await fetchDefaultSkills();

    expect(result).toEqual([]);
  });

  it("searches for 'obra/superpowers'", async () => {
    mockSearchSkillsAPI.mockResolvedValueOnce([]);

    await fetchDefaultSkills();

    expect(mockSearchSkillsAPI).toHaveBeenCalledWith("obra/superpowers", 50);
  });
});

describe("discoverSkills", () => {
  it("merges defaults with tag results", async () => {
    // First call: fetchDefaultSkills ("obra/superpowers")
    mockSearchSkillsAPI.mockResolvedValueOnce([
      makeSearchResult({ name: "brainstorming", slug: "obra/superpowers/brainstorming", source: "obra/superpowers", installs: 21645 }),
    ]);
    // Second call: discoverSkillsForTags (["react"])
    mockSearchSkillsAPI.mockResolvedValueOnce([
      makeSearchResult({ name: "frontend-design", slug: "vercel-labs/frontend-design", source: "vercel-labs/agent-skills", installs: 5000 }),
    ]);

    const result = await discoverSkills(["react"]);

    expect(result).toHaveLength(2);
    // defaults come first
    expect(result[0]!.name).toBe("brainstorming");
    expect(result[0]!.isDefault).toBe(true);
    expect(result[1]!.name).toBe("frontend-design");
    expect(result[1]!.isDefault).toBe(false);
  });

  it("deduplicates when tag result matches a default skill", async () => {
    // Default: brainstorming from obra
    mockSearchSkillsAPI.mockResolvedValueOnce([
      makeSearchResult({ name: "brainstorming", slug: "obra/superpowers/brainstorming", source: "obra/superpowers", installs: 21645 }),
    ]);
    // Tag result also finds brainstorming (from a fork)
    mockSearchSkillsAPI.mockResolvedValueOnce([
      makeSearchResult({ name: "brainstorming", slug: "wln/obra-superpowers/brainstorming", source: "wln/obra-superpowers", installs: 3 }),
    ]);

    const result = await discoverSkills(["workflow"]);

    expect(result).toHaveLength(1);
    expect(result[0]!.name).toBe("brainstorming");
    expect(result[0]!.isDefault).toBe(true);
    expect(result[0]!.installs).toBe(21645); // kept the higher one
    expect(result[0]!.matchedTags).toEqual(["workflow"]);
  });

  it("fetches defaults even with empty tags", async () => {
    mockSearchSkillsAPI.mockResolvedValueOnce([
      makeSearchResult({ name: "debugging", slug: "obra/superpowers/debugging", source: "obra/superpowers", installs: 11989 }),
    ]);

    const result = await discoverSkills([]);

    expect(result).toHaveLength(1);
    expect(result[0]!.isDefault).toBe(true);
  });
});

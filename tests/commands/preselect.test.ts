import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { shouldPreselectSkill, shouldPreselectPlugin, deriveTagsFromStack } from "../../src/commands/preselect.js";
import type { Skill, Plugin, SkillsRegistry } from "../../src/registry/types.js";

// ---- Helpers ----

function makeSkill(
  name: string,
  tags: string[],
  category = "core",
): Skill {
  return { name, description: `${name} desc`, source: "test", path: "test", tags, category };
}

function loadRealRegistry(): SkillsRegistry {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const registryPath = join(__dirname, "..", "..", "registry", "skills.json");
  return JSON.parse(readFileSync(registryPath, "utf-8"));
}

// ---- deriveTagsFromStack ----

describe("deriveTagsFromStack", () => {
  it("returns typescript + react tags for 'react'", () => {
    const result = deriveTagsFromStack("react");
    expect(result.skillTags).toEqual(["typescript", "react"]);
    expect(result.agentTags).toEqual(["typescript", "react"]);
  });

  it("returns typescript + nextjs + react tags for 'nextjs'", () => {
    const result = deriveTagsFromStack("nextjs");
    expect(result.skillTags).toContain("typescript");
    expect(result.skillTags).toContain("nextjs");
    expect(result.skillTags).toContain("react");
  });

  it("returns expo + react-native + typescript tags for 'expo'", () => {
    const result = deriveTagsFromStack("expo");
    expect(result.skillTags).toContain("expo");
    expect(result.skillTags).toContain("react-native");
    expect(result.skillTags).toContain("typescript");
  });

  it("returns flutter tags for 'flutter'", () => {
    const result = deriveTagsFromStack("flutter");
    expect(result.skillTags).toEqual(["flutter"]);
  });

  it("returns swift + ios tags for 'ios'", () => {
    const result = deriveTagsFromStack("ios");
    expect(result.skillTags).toEqual(["swift", "ios"]);
  });

  it("returns kotlin + java + android tags for 'android'", () => {
    const result = deriveTagsFromStack("android");
    expect(result.skillTags).toContain("kotlin");
    expect(result.skillTags).toContain("java");
    expect(result.skillTags).toContain("android");
  });

  it("returns python tags for 'python'", () => {
    const result = deriveTagsFromStack("python");
    expect(result.skillTags).toEqual(["python"]);
    expect(result.agentTags).toEqual(["python"]);
  });

  it("returns go tags for 'go'", () => {
    const result = deriveTagsFromStack("go");
    expect(result.skillTags).toEqual(["go"]);
  });

  it("returns rust tags for 'rust'", () => {
    const result = deriveTagsFromStack("rust");
    expect(result.skillTags).toEqual(["rust"]);
  });

  it("returns empty arrays for unknown stack label", () => {
    const result = deriveTagsFromStack("unknown-framework");
    expect(result.skillTags).toEqual([]);
    expect(result.agentTags).toEqual([]);
  });

  it("returns empty arrays for empty string", () => {
    const result = deriveTagsFromStack("");
    expect(result.skillTags).toEqual([]);
    expect(result.agentTags).toEqual([]);
  });
});

// ---- shouldPreselectSkill ----

describe("shouldPreselectSkill", () => {
  it("selects all skills when no tags are detected", () => {
    const skill = makeSkill("foo", ["web", "react"]);
    expect(shouldPreselectSkill(skill, [])).toBe(true);
  });

  it("always selects pure universal skills regardless of detected tags", () => {
    const skill = makeSkill("debug", ["universal"]);
    expect(shouldPreselectSkill(skill, ["python"])).toBe(true);
    expect(shouldPreselectSkill(skill, ["react", "web"])).toBe(true);
    expect(shouldPreselectSkill(skill, [])).toBe(true);
  });

  it("selects mixed universal+specific skill when specific tag matches", () => {
    const skill = makeSkill("ts-pro", ["universal", "typescript"]);
    expect(shouldPreselectSkill(skill, ["typescript", "react"])).toBe(true);
  });

  it("does NOT select mixed universal+specific skill when specific tag mismatches", () => {
    const skill = makeSkill("ts-pro", ["universal", "typescript"]);
    expect(shouldPreselectSkill(skill, ["python"])).toBe(false);
  });

  it("selects skill with specific tags when at least one matches", () => {
    const skill = makeSkill("react-skill", ["web", "react"]);
    expect(shouldPreselectSkill(skill, ["react"])).toBe(true);
  });

  it("does NOT select skill with specific tags when none match", () => {
    const skill = makeSkill("react-skill", ["web", "react"]);
    expect(shouldPreselectSkill(skill, ["python", "backend"])).toBe(false);
  });

  it("handles skill with empty tags array (treated as pure universal)", () => {
    const skill = makeSkill("empty-tags", []);
    expect(shouldPreselectSkill(skill, ["typescript"])).toBe(true);
    expect(shouldPreselectSkill(skill, [])).toBe(true);
  });

  it("selects mobile skill when mobile tag detected", () => {
    const skill = makeSkill("rn-skill", ["mobile", "react-native", "expo"]);
    expect(shouldPreselectSkill(skill, ["mobile", "react-native"])).toBe(true);
  });

  it("does NOT select mobile skill when only web tags detected", () => {
    const skill = makeSkill("rn-skill", ["mobile", "react-native", "expo"]);
    expect(shouldPreselectSkill(skill, ["web", "react", "typescript"])).toBe(false);
  });
});

// ---- shouldPreselectPlugin ----

function makePlugin(
  name: string,
  tags: string[],
  category = "data-ai",
): Plugin {
  return { name, description: `${name} desc`, marketplace: "test", agent_count: 1, tags, category };
}

describe("shouldPreselectPlugin", () => {
  it("returns false for all plugins when no detected tags", () => {
    const plugin = makePlugin("db-plugin", ["database", "migrations"]);
    expect(shouldPreselectPlugin(plugin, [])).toBe(false);
  });

  it("returns true when plugin tag matches detected tag", () => {
    const plugin = makePlugin("db-plugin", ["database", "migrations"]);
    expect(shouldPreselectPlugin(plugin, ["database", "ai"])).toBe(true);
  });

  it("returns false for plugin with no tags", () => {
    const plugin = makePlugin("empty-plugin", []);
    expect(shouldPreselectPlugin(plugin, ["database"])).toBe(false);
  });

  it("returns true for partial match (any tag matches)", () => {
    const plugin = makePlugin("multi-plugin", ["ai", "ml", "pipelines"]);
    expect(shouldPreselectPlugin(plugin, ["pipelines"])).toBe(true);
  });

  it("returns false when no plugin tags match detected tags", () => {
    const plugin = makePlugin("blockchain-plugin", ["blockchain", "web3"]);
    expect(shouldPreselectPlugin(plugin, ["database", "ai"])).toBe(false);
  });
});

// ---- Integration: deriveTagsFromStack → shouldPreselectSkill ----

describe("integration: stack detection → preselection", () => {
  it("react stack selects web+react skills but not mobile-only", () => {
    const { skillTags } = deriveTagsFromStack("react");
    const webSkill = makeSkill("web-react", ["web", "react"]);
    const mobileSkill = makeSkill("flutter-skill", ["mobile", "flutter"]);
    const universalSkill = makeSkill("debug", ["universal"]);

    expect(shouldPreselectSkill(webSkill, skillTags)).toBe(true);
    expect(shouldPreselectSkill(mobileSkill, skillTags)).toBe(false);
    expect(shouldPreselectSkill(universalSkill, skillTags)).toBe(true);
  });

  it("python stack selects python skills but not web-only", () => {
    const { skillTags } = deriveTagsFromStack("python");
    const pySkill = makeSkill("py-skill", ["backend", "python"]);
    const webSkill = makeSkill("web-only", ["web", "react"]);
    const universalSkill = makeSkill("debug", ["universal"]);

    expect(shouldPreselectSkill(pySkill, skillTags)).toBe(true);
    expect(shouldPreselectSkill(webSkill, skillTags)).toBe(false);
    expect(shouldPreselectSkill(universalSkill, skillTags)).toBe(true);
  });

  it("unknown stack selects everything (no detected tags)", () => {
    const { skillTags } = deriveTagsFromStack("unknown");
    expect(skillTags).toEqual([]);

    const anySkill = makeSkill("anything", ["mobile", "flutter"]);
    expect(shouldPreselectSkill(anySkill, skillTags)).toBe(true);
  });
});

// ---- Full registry integration ----

describe("full registry integration", () => {
  const registry = loadRealRegistry();

  it("react + typescript detection preselects core/web skills, not mobile-only", () => {
    const detectedTags = ["typescript", "react", "web"];
    const allSkills = registry.skills;

    const preselected = allSkills.filter((s) =>
      shouldPreselectSkill(s, detectedTags),
    );
    const notSelected = allSkills.filter(
      (s) => !shouldPreselectSkill(s, detectedTags),
    );

    // All core skills are universal → should be preselected
    const coreSkills = allSkills.filter((s) => s.category === "core");
    for (const skill of coreSkills) {
      expect(preselected).toContainEqual(skill);
    }

    // Skills with only "web" or "react" tags should be selected
    const webReactSkills = allSkills.filter(
      (s) => s.tags.includes("react") || s.tags.includes("web"),
    );
    for (const skill of webReactSkills) {
      expect(preselected).toContainEqual(skill);
    }

    // Skills with only mobile/flutter tags should NOT be selected
    const pureFlutterSkills = allSkills.filter(
      (s) =>
        s.tags.includes("flutter") &&
        !s.tags.includes("universal") &&
        !s.tags.some((t) => detectedTags.includes(t)),
    );
    for (const skill of pureFlutterSkills) {
      expect(notSelected).toContainEqual(skill);
    }
  });

  it("python detection preselects backend/python skills, not react/web-only", () => {
    const detectedTags = ["python", "backend"];
    const allSkills = registry.skills;

    const preselected = allSkills.filter((s) =>
      shouldPreselectSkill(s, detectedTags),
    );

    // Python skills should be selected
    const pySkills = allSkills.filter((s) => s.tags.includes("python"));
    for (const skill of pySkills) {
      expect(preselected).toContainEqual(skill);
    }

    // Pure react-only skills should not be selected
    const pureReactSkills = allSkills.filter(
      (s) =>
        s.tags.includes("react") &&
        !s.tags.includes("universal") &&
        !s.tags.some((t) => detectedTags.includes(t)),
    );
    for (const skill of pureReactSkills) {
      expect(shouldPreselectSkill(skill, detectedTags)).toBe(false);
    }
  });

  it("no detected tags preselects everything", () => {
    const allSkills = registry.skills;
    for (const skill of allSkills) {
      expect(shouldPreselectSkill(skill, [])).toBe(true);
    }
  });
});

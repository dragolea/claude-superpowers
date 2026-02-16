import { describe, it, expect } from "vitest";
import {
  getSkillsByCategories,
  getSkillByName,
  getAllCategories,
  getCategoryName,
  getCategoryDesc,
  isCategoryRecommended,
  getPresetCategories,
} from "../../src/registry/skills.js";
import type { SkillsRegistry } from "../../src/registry/types.js";

// ---- Test fixture ----

const registry: SkillsRegistry = {
  version: "1.0.0",
  categories: {
    core: {
      name: "Core",
      description: "Essential skills",
      recommended: true,
    },
    web: {
      name: "Web Development",
      description: "Frontend frameworks",
      recommended: false,
    },
    backend: {
      name: "Backend",
      description: "Server frameworks",
      recommended: false,
    },
  },
  presets: {
    minimal: {
      name: "Minimal",
      description: "Core only",
      categories: ["core"],
    },
    fullstack: {
      name: "Full Stack",
      description: "Web + backend",
      categories: ["core", "web", "backend"],
    },
  },
  skills: [
    {
      name: "debugging",
      description: "Debug skills",
      source: "test",
      path: "debug",
      tags: ["universal"],
      category: "core",
    },
    {
      name: "tdd",
      description: "Test-driven development",
      source: "test",
      path: "tdd",
      tags: ["universal"],
      category: "core",
    },
    {
      name: "react-skill",
      description: "React expertise",
      source: "test",
      path: "react",
      tags: ["web", "react"],
      category: "web",
    },
    {
      name: "vue-skill",
      description: "Vue expertise",
      source: "test",
      path: "vue",
      tags: ["web", "vue"],
      category: "web",
    },
    {
      name: "api-design",
      description: "API design patterns",
      source: "test",
      path: "api",
      tags: ["backend"],
      category: "backend",
    },
  ],
};

// ---- getSkillsByCategories ----

describe("getSkillsByCategories", () => {
  it("returns skills for a single category", () => {
    const skills = getSkillsByCategories(registry, ["core"]);
    expect(skills).toHaveLength(2);
    expect(skills.map((s) => s.name)).toEqual(["debugging", "tdd"]);
  });

  it("returns skills for multiple categories", () => {
    const skills = getSkillsByCategories(registry, ["core", "web"]);
    expect(skills).toHaveLength(4);
    expect(skills.map((s) => s.name)).toContain("debugging");
    expect(skills.map((s) => s.name)).toContain("react-skill");
  });

  it("returns empty array for empty categories", () => {
    const skills = getSkillsByCategories(registry, []);
    expect(skills).toHaveLength(0);
  });

  it("returns empty array for unknown category", () => {
    const skills = getSkillsByCategories(registry, ["nonexistent"]);
    expect(skills).toHaveLength(0);
  });
});

// ---- getSkillByName ----

describe("getSkillByName", () => {
  it("finds existing skill", () => {
    const skill = getSkillByName(registry, "debugging");
    expect(skill).toBeDefined();
    expect(skill!.name).toBe("debugging");
    expect(skill!.category).toBe("core");
  });

  it("returns undefined for unknown name", () => {
    const skill = getSkillByName(registry, "nonexistent");
    expect(skill).toBeUndefined();
  });
});

// ---- getAllCategories ----

describe("getAllCategories", () => {
  it("returns all category IDs", () => {
    const cats = getAllCategories(registry);
    expect(cats).toEqual(["core", "web", "backend"]);
  });
});

// ---- getCategoryName ----

describe("getCategoryName", () => {
  it("returns category name for known ID", () => {
    expect(getCategoryName(registry, "core")).toBe("Core");
    expect(getCategoryName(registry, "web")).toBe("Web Development");
  });

  it("returns catId as fallback for unknown category", () => {
    expect(getCategoryName(registry, "unknown")).toBe("unknown");
  });
});

// ---- getCategoryDesc ----

describe("getCategoryDesc", () => {
  it("returns description for known category", () => {
    expect(getCategoryDesc(registry, "core")).toBe("Essential skills");
  });

  it("returns empty string for unknown category", () => {
    expect(getCategoryDesc(registry, "unknown")).toBe("");
  });
});

// ---- isCategoryRecommended ----

describe("isCategoryRecommended", () => {
  it("returns true for recommended category", () => {
    expect(isCategoryRecommended(registry, "core")).toBe(true);
  });

  it("returns false for non-recommended category", () => {
    expect(isCategoryRecommended(registry, "web")).toBe(false);
  });

  it("returns false for unknown category", () => {
    expect(isCategoryRecommended(registry, "unknown")).toBe(false);
  });
});

// ---- getPresetCategories ----

describe("getPresetCategories", () => {
  it("returns categories for known preset", () => {
    expect(getPresetCategories(registry, "minimal")).toEqual(["core"]);
  });

  it("returns multiple categories for fullstack preset", () => {
    expect(getPresetCategories(registry, "fullstack")).toEqual([
      "core",
      "web",
      "backend",
    ]);
  });

  it("returns null for unknown preset", () => {
    expect(getPresetCategories(registry, "nonexistent")).toBeNull();
  });
});

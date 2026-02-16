import { describe, it, expect } from "vitest";
import {
  getPluginsByCategories,
  getPluginByName,
  getAllPluginCategories,
  getPluginCategoryName,
  getPluginCategoryDesc,
  isPluginCategoryRecommended,
  getPluginPresetCategories,
} from "./agents.js";
import type { AgentsRegistry } from "./types.js";

// ---- Test fixture ----

const registry: AgentsRegistry = {
  version: "1.0.0",
  marketplaces: {
    "test-marketplace": {
      name: "Test Marketplace",
      repo: "test/repo",
    },
  },
  categories: {
    "data-ai": {
      name: "Data & AI",
      description: "AI/ML plugins",
      recommended: false,
    },
    specialized: {
      name: "Specialized",
      description: "Domain-specific plugins",
      recommended: false,
    },
    design: {
      name: "Design",
      description: "UI/UX plugins",
      recommended: true,
    },
  },
  presets: {
    "data-ai": {
      name: "Data & AI",
      description: "AI plugins",
      categories: ["data-ai"],
    },
    full: {
      name: "Everything",
      description: "All plugins",
      categories: ["data-ai", "specialized", "design"],
    },
  },
  plugins: [
    {
      name: "llm-dev",
      marketplace: "test-marketplace",
      description: "LLM development",
      agent_count: 5,
      tags: ["llm", "ai"],
      category: "data-ai",
    },
    {
      name: "data-pipeline",
      marketplace: "test-marketplace",
      description: "Data pipelines",
      agent_count: 3,
      tags: ["data", "pipelines"],
      category: "data-ai",
    },
    {
      name: "blockchain",
      marketplace: "test-marketplace",
      description: "Blockchain tools",
      agent_count: 4,
      tags: ["blockchain", "web3"],
      category: "specialized",
    },
    {
      name: "ui-design",
      marketplace: "test-marketplace",
      description: "UI design",
      agent_count: 9,
      tags: ["design", "ui"],
      category: "design",
    },
    // Duplicate name in different position (tests deduplication)
    {
      name: "llm-dev",
      marketplace: "test-marketplace",
      description: "LLM development (dupe)",
      agent_count: 5,
      tags: ["llm", "ai"],
      category: "data-ai",
    },
  ],
};

// ---- getPluginsByCategories ----

describe("getPluginsByCategories", () => {
  it("returns plugins for a single category", () => {
    const plugins = getPluginsByCategories(registry, ["data-ai"]);
    expect(plugins).toHaveLength(2);
    expect(plugins.map((p) => p.name)).toEqual(["llm-dev", "data-pipeline"]);
  });

  it("returns plugins for multiple categories", () => {
    const plugins = getPluginsByCategories(registry, [
      "data-ai",
      "specialized",
    ]);
    expect(plugins).toHaveLength(3);
    expect(plugins.map((p) => p.name)).toContain("blockchain");
  });

  it("deduplicates plugins with same name", () => {
    const plugins = getPluginsByCategories(registry, ["data-ai"]);
    const names = plugins.map((p) => p.name);
    // "llm-dev" appears twice in the registry but should only appear once
    expect(names.filter((n) => n === "llm-dev")).toHaveLength(1);
  });

  it("returns empty array for empty categories", () => {
    const plugins = getPluginsByCategories(registry, []);
    expect(plugins).toHaveLength(0);
  });

  it("returns empty array for unknown category", () => {
    const plugins = getPluginsByCategories(registry, ["nonexistent"]);
    expect(plugins).toHaveLength(0);
  });
});

// ---- getPluginByName ----

describe("getPluginByName", () => {
  it("finds existing plugin", () => {
    const plugin = getPluginByName(registry, "blockchain");
    expect(plugin).toBeDefined();
    expect(plugin!.name).toBe("blockchain");
    expect(plugin!.category).toBe("specialized");
  });

  it("returns undefined for unknown name", () => {
    const plugin = getPluginByName(registry, "nonexistent");
    expect(plugin).toBeUndefined();
  });
});

// ---- getAllPluginCategories ----

describe("getAllPluginCategories", () => {
  it("returns all category IDs", () => {
    const cats = getAllPluginCategories(registry);
    expect(cats).toEqual(["data-ai", "specialized", "design"]);
  });
});

// ---- getPluginCategoryName ----

describe("getPluginCategoryName", () => {
  it("returns name for known category", () => {
    expect(getPluginCategoryName(registry, "data-ai")).toBe("Data & AI");
  });

  it("returns catId as fallback for unknown category", () => {
    expect(getPluginCategoryName(registry, "unknown")).toBe("unknown");
  });
});

// ---- getPluginCategoryDesc ----

describe("getPluginCategoryDesc", () => {
  it("returns description for known category", () => {
    expect(getPluginCategoryDesc(registry, "specialized")).toBe(
      "Domain-specific plugins",
    );
  });

  it("returns empty string for unknown category", () => {
    expect(getPluginCategoryDesc(registry, "unknown")).toBe("");
  });
});

// ---- isPluginCategoryRecommended ----

describe("isPluginCategoryRecommended", () => {
  it("returns true for recommended category", () => {
    expect(isPluginCategoryRecommended(registry, "design")).toBe(true);
  });

  it("returns false for non-recommended category", () => {
    expect(isPluginCategoryRecommended(registry, "data-ai")).toBe(false);
  });

  it("returns false for unknown category", () => {
    expect(isPluginCategoryRecommended(registry, "unknown")).toBe(false);
  });
});

// ---- getPluginPresetCategories ----

describe("getPluginPresetCategories", () => {
  it("returns categories for known preset", () => {
    expect(getPluginPresetCategories(registry, "data-ai")).toEqual(["data-ai"]);
  });

  it("returns multiple categories for full preset", () => {
    expect(getPluginPresetCategories(registry, "full")).toEqual([
      "data-ai",
      "specialized",
      "design",
    ]);
  });

  it("returns null for unknown preset", () => {
    expect(getPluginPresetCategories(registry, "nonexistent")).toBeNull();
  });
});

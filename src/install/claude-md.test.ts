import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { generateClaudeMdSection } from "./claude-md.js";
import type { SkillsRegistry } from "../registry/types.js";

// ---- Test fixture ----

const registry: SkillsRegistry = {
  version: "1.0.0",
  categories: {
    core: {
      name: "Core",
      description: "Essential skills",
      recommended: true,
    },
    workflow: {
      name: "Workflow",
      description: "Planning and execution",
      recommended: true,
    },
    web: {
      name: "Web Development",
      description: "Frontend frameworks",
      recommended: false,
    },
    security: {
      name: "Security",
      description: "Security skills",
      recommended: false,
    },
    languages: {
      name: "Languages",
      description: "Language-specific skills",
      recommended: false,
    },
  },
  presets: {},
  skills: [
    {
      name: "debugging",
      description: "Four-phase root cause analysis",
      source: "test",
      path: "debug",
      tags: ["universal"],
      category: "core",
    },
    {
      name: "tdd",
      description: "RED-GREEN-REFACTOR cycle",
      source: "test",
      path: "tdd",
      tags: ["universal"],
      category: "core",
    },
    {
      name: "brainstorming",
      description: "Collaborative design exploration",
      source: "test",
      path: "brainstorm",
      tags: ["universal"],
      category: "workflow",
    },
    {
      name: "react-skill",
      description: "React component patterns",
      source: "test",
      path: "react",
      tags: ["web", "react"],
      category: "web",
    },
    {
      name: "security-reviewer",
      description: "Security audits and SAST scans",
      source: "test",
      path: "security",
      tags: ["universal"],
      category: "security",
    },
    {
      name: "typescript-pro",
      description: "Advanced TypeScript patterns",
      source: "test",
      path: "ts",
      tags: ["universal", "typescript"],
      category: "languages",
    },
  ],
};

// ---- Tests ----

describe("generateClaudeMdSection", () => {
  it("generates ALWAYS use format for core skills", () => {
    const output = generateClaudeMdSection(["debugging"], registry);
    expect(output).toContain("ALWAYS use debugging");
    expect(output).toContain("Four-phase root cause analysis");
  });

  it("generates Use X for format for workflow skills", () => {
    const output = generateClaudeMdSection(["brainstorming"], registry);
    expect(output).toContain("Use brainstorming for");
    expect(output).toContain("collaborative design exploration");
  });

  it("generates web skill format", () => {
    const output = generateClaudeMdSection(["react-skill"], registry);
    expect(output).toContain("Use react-skill when working on web projects");
  });

  it("generates security skill format", () => {
    const output = generateClaudeMdSection(["security-reviewer"], registry);
    expect(output).toContain("Use security-reviewer for security analysis");
  });

  it("generates language skill format", () => {
    const output = generateClaudeMdSection(["typescript-pro"], registry);
    expect(output).toContain("Use typescript-pro");
    expect(output).toContain("Advanced TypeScript patterns");
  });

  it("groups skills by category with proper headers", () => {
    const output = generateClaudeMdSection(
      ["debugging", "brainstorming", "react-skill"],
      registry,
    );

    expect(output).toContain("## Core");
    expect(output).toContain("## Workflow");
    expect(output).toContain("## Web Development");
  });

  it("maintains registry category order", () => {
    const output = generateClaudeMdSection(
      ["react-skill", "debugging", "brainstorming"],
      registry,
    );

    const coreIdx = output.indexOf("## Core");
    const workflowIdx = output.indexOf("## Workflow");
    const webIdx = output.indexOf("## Web Development");

    expect(coreIdx).toBeLessThan(workflowIdx);
    expect(workflowIdx).toBeLessThan(webIdx);
  });

  it("returns empty string for empty input", () => {
    const output = generateClaudeMdSection([], registry);
    expect(output).toBe("");
  });

  it("skips unknown skill names", () => {
    const output = generateClaudeMdSection(["nonexistent"], registry);
    expect(output).toBe("");
  });

  it("skips unknown skills while keeping valid ones", () => {
    const output = generateClaudeMdSection(
      ["debugging", "nonexistent"],
      registry,
    );
    expect(output).toContain("debugging");
    expect(output).not.toContain("nonexistent");
  });

  it("includes HTML markers in output", () => {
    const output = generateClaudeMdSection(["debugging"], registry);
    expect(output).toContain("<!-- superpower-skills-start -->");
    expect(output).toContain("<!-- superpower-skills-end -->");
  });

  it("includes header text", () => {
    const output = generateClaudeMdSection(["debugging"], registry);
    expect(output).toContain("# Superpowers Skills");
    expect(output).toContain(
      "ALWAYS check if a superpowers skill applies before starting any task.",
    );
  });
});

// ---- Integration with real registry ----

describe("integration with real skills.json", () => {
  function loadRealRegistry(): SkillsRegistry {
    const __dirname = dirname(fileURLToPath(import.meta.url));
    const registryPath = join(__dirname, "..", "..", "registry", "skills.json");
    return JSON.parse(readFileSync(registryPath, "utf-8"));
  }

  const realRegistry = loadRealRegistry();

  it("generates valid output for real core skills", () => {
    const coreSkillNames = realRegistry.skills
      .filter((s) => s.category === "core")
      .map((s) => s.name);

    const output = generateClaudeMdSection(coreSkillNames, realRegistry);

    expect(output).toContain("## Core");
    expect(output).toContain("<!-- superpower-skills-start -->");
    for (const name of coreSkillNames) {
      expect(output).toContain(name);
    }
  });

  it("generates valid output for all skills in registry", () => {
    const allNames = realRegistry.skills.map((s) => s.name);
    const output = generateClaudeMdSection(allNames, realRegistry);

    expect(output.length).toBeGreaterThan(0);
    expect(output).toContain("<!-- superpower-skills-start -->");
    expect(output).toContain("<!-- superpower-skills-end -->");

    // Should have categories from registry
    const expectedCategories = Object.keys(realRegistry.categories);
    for (const catId of expectedCategories) {
      const catSkills = realRegistry.skills.filter(
        (s) => s.category === catId,
      );
      if (catSkills.length > 0) {
        const catName = realRegistry.categories[catId].name;
        expect(output).toContain(`## ${catName}`);
      }
    }
  });
});

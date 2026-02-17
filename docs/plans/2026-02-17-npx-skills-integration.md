# npx skills Ecosystem Integration — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace local skill/agent registries with the `skills` npm package ecosystem, keeping scanning/detection and CLAUDE.md generation as differentiators.

**Architecture:** Scan project → detect tags → discover skills via skills.sh API → install via skills package → generate CLAUDE.md from installed SKILL.md files. Drop all agent/plugin support.

**Tech Stack:** TypeScript, `skills` (github:vercel-labs/skills), tsup/esbuild, @clack/prompts, vitest

**Design doc:** `docs/plans/2026-02-17-npx-skills-integration-design.md`

---

## Phase 1: Foundation — Git Dependency + Verify Build

### Task 1: Add skills as git dependency and verify import

**Files:**
- Modify: `package.json`
- Modify: `tsup.config.ts` (if needed)

**Step 1: Add the skills dependency**

```bash
npm install skills@github:vercel-labs/skills
```

**Step 2: Verify the source files are available**

```bash
ls node_modules/skills/src/find.ts
ls node_modules/skills/src/installer.ts
ls node_modules/skills/src/skills.ts
ls node_modules/skills/src/types.ts
ls node_modules/skills/src/agents.ts
```

Expected: All files exist.

**Step 3: Create a smoke-test import file**

Create `src/_verify-skills-import.ts`:

```typescript
// Temporary file to verify skills package imports work with tsup
import type { Skill } from "skills/src/types.js";

export async function verifyImport(): Promise<void> {
  const { searchSkillsAPI } = await import("skills/src/find.js");
  const { installSkillForAgent, listInstalledSkills } = await import("skills/src/installer.js");
  const { parseSkillMd, discoverSkills } = await import("skills/src/skills.js");
  console.log("All imports resolved");
}
```

**Step 4: Try building**

```bash
npm run build
```

If this fails because tsup can't resolve `skills/src/...`, update `tsup.config.ts` to handle the package. Possible fixes:
- Add an alias in tsup config
- Change `noExternal` to explicitly include skills
- If all else fails: vendor the 5 modules instead (see Risk Mitigation in design doc)

**Step 5: Delete the smoke-test file**

```bash
rm src/_verify-skills-import.ts
```

**Step 6: Commit**

```bash
git add package.json package-lock.json tsup.config.ts
git commit -m "feat: add skills package as git dependency"
```

---

## Phase 2: New Types

### Task 2: Create bridge types

**Files:**
- Create: `src/types.ts`

**Step 1: Write the new shared types**

Create `src/types.ts`:

```typescript
/**
 * Shared types for the superpower-installer.
 * Replaces the old registry/types.ts.
 */

export type InstallScope = "project" | "user" | "local";

/**
 * A skill discovered via the skills.sh search API.
 */
export interface DiscoveredSkill {
  /** Skill name (e.g., "frontend-design") */
  name: string;
  /** Short description */
  description: string;
  /** Install identifier (e.g., "vercel-labs/agent-skills") */
  installName: string;
  /** Source URL for the skill */
  sourceUrl: string;
  /** Number of detection tags that matched this skill */
  relevance: number;
  /** The tags that matched */
  matchedTags: string[];
}

/**
 * Metadata extracted from an installed SKILL.md file.
 * Used for CLAUDE.md generation.
 */
export interface SkillMetadata {
  /** Skill name from frontmatter */
  name: string;
  /** Skill description from frontmatter */
  description: string;
  /** Path to the SKILL.md file */
  path: string;
}
```

**Step 2: Commit**

```bash
git add src/types.ts
git commit -m "feat: add new shared types for skills bridge"
```

---

## Phase 3: Skills Bridge — Adapter Layer

### Task 3: Create skills-bridge/discover.ts

**Files:**
- Create: `src/skills-bridge/discover.ts`
- Create: `tests/skills-bridge/discover.test.ts`

**Step 1: Write the failing test**

Create `tests/skills-bridge/discover.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the skills package search API
vi.mock("skills/src/find.js", () => ({
  searchSkillsAPI: vi.fn(),
}));

import { discoverSkillsForTags } from "../../src/skills-bridge/discover.js";
import { searchSkillsAPI } from "skills/src/find.js";

const mockSearch = vi.mocked(searchSkillsAPI);

beforeEach(() => {
  mockSearch.mockReset();
});

describe("discoverSkillsForTags", () => {
  it("returns empty array for empty tags", async () => {
    const result = await discoverSkillsForTags([]);
    expect(result).toEqual([]);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("searches for each tag and deduplicates results", async () => {
    mockSearch
      .mockResolvedValueOnce([
        { name: "frontend-design", description: "Frontend skill", installName: "vercel-labs/agent-skills", sourceUrl: "https://github.com/vercel-labs/agent-skills" },
        { name: "typescript-pro", description: "TS skill", installName: "obra/skills", sourceUrl: "https://github.com/obra/skills" },
      ])
      .mockResolvedValueOnce([
        { name: "frontend-design", description: "Frontend skill", installName: "vercel-labs/agent-skills", sourceUrl: "https://github.com/vercel-labs/agent-skills" },
        { name: "react-patterns", description: "React skill", installName: "jeffallan/skills", sourceUrl: "https://github.com/jeffallan/skills" },
      ]);

    const result = await discoverSkillsForTags(["typescript", "react"]);

    expect(mockSearch).toHaveBeenCalledTimes(2);
    expect(mockSearch).toHaveBeenCalledWith("typescript");
    expect(mockSearch).toHaveBeenCalledWith("react");

    // Should deduplicate frontend-design (appeared in both)
    expect(result).toHaveLength(3);

    // frontend-design should have highest relevance (matched 2 tags)
    const frontendSkill = result.find((s) => s.name === "frontend-design");
    expect(frontendSkill?.relevance).toBe(2);
    expect(frontendSkill?.matchedTags).toEqual(["typescript", "react"]);
  });

  it("sorts results by relevance descending", async () => {
    mockSearch
      .mockResolvedValueOnce([
        { name: "skill-a", description: "A", installName: "repo/a", sourceUrl: "url-a" },
        { name: "skill-b", description: "B", installName: "repo/b", sourceUrl: "url-b" },
      ])
      .mockResolvedValueOnce([
        { name: "skill-b", description: "B", installName: "repo/b", sourceUrl: "url-b" },
      ]);

    const result = await discoverSkillsForTags(["tag1", "tag2"]);

    // skill-b matched both tags, skill-a matched one
    expect(result[0].name).toBe("skill-b");
    expect(result[0].relevance).toBe(2);
    expect(result[1].name).toBe("skill-a");
    expect(result[1].relevance).toBe(1);
  });

  it("handles API errors gracefully for individual tags", async () => {
    mockSearch
      .mockResolvedValueOnce([
        { name: "skill-a", description: "A", installName: "repo/a", sourceUrl: "url-a" },
      ])
      .mockRejectedValueOnce(new Error("API error"));

    const result = await discoverSkillsForTags(["tag1", "tag2"]);

    // Should still return results from the successful tag
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("skill-a");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/skills-bridge/discover.test.ts
```

Expected: FAIL — module `../../src/skills-bridge/discover.js` not found.

**Step 3: Write the implementation**

Create `src/skills-bridge/discover.ts`:

```typescript
import { searchSkillsAPI } from "skills/src/find.js";
import type { DiscoveredSkill } from "../types.js";

/**
 * Search the skills.sh ecosystem for skills matching the given detection tags.
 * Searches each tag in parallel, deduplicates, and ranks by relevance.
 */
export async function discoverSkillsForTags(
  tags: string[],
): Promise<DiscoveredSkill[]> {
  if (tags.length === 0) return [];

  // Search for each tag in parallel
  const searchResults = await Promise.allSettled(
    tags.map(async (tag) => {
      const results = await searchSkillsAPI(tag);
      return { tag, results };
    }),
  );

  // Build a map of unique skills with relevance tracking
  const skillMap = new Map<string, DiscoveredSkill>();

  for (const result of searchResults) {
    if (result.status !== "fulfilled") continue;

    const { tag, results } = result.value;
    for (const skill of results) {
      const key = `${skill.installName}:${skill.name}`;

      if (skillMap.has(key)) {
        const existing = skillMap.get(key)!;
        existing.relevance++;
        existing.matchedTags.push(tag);
      } else {
        skillMap.set(key, {
          name: skill.name,
          description: skill.description,
          installName: skill.installName,
          sourceUrl: skill.sourceUrl,
          relevance: 1,
          matchedTags: [tag],
        });
      }
    }
  }

  // Sort by relevance (descending), then alphabetically
  return [...skillMap.values()].sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    return a.name.localeCompare(b.name);
  });
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/skills-bridge/discover.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/skills-bridge/discover.ts tests/skills-bridge/discover.test.ts
git commit -m "feat: add skills-bridge discover module with tag-based search"
```

---

### Task 4: Create skills-bridge/install.ts

**Files:**
- Create: `src/skills-bridge/install.ts`
- Create: `tests/skills-bridge/install.test.ts`

**Step 1: Write the failing test**

Create `tests/skills-bridge/install.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("skills/src/installer.js", () => ({
  installRemoteSkillForAgent: vi.fn(),
}));

import { installDiscoveredSkill, installDiscoveredSkills } from "../../src/skills-bridge/install.js";
import { installRemoteSkillForAgent } from "skills/src/installer.js";
import type { DiscoveredSkill } from "../../src/types.js";

const mockInstall = vi.mocked(installRemoteSkillForAgent);

beforeEach(() => {
  mockInstall.mockReset();
});

const makeSkill = (name: string): DiscoveredSkill => ({
  name,
  description: `${name} description`,
  installName: `repo/${name}`,
  sourceUrl: `https://github.com/repo/${name}`,
  relevance: 1,
  matchedTags: ["test"],
});

describe("installDiscoveredSkill", () => {
  it("calls installRemoteSkillForAgent with correct args for project scope", async () => {
    mockInstall.mockResolvedValue({ success: true, path: ".claude/skills/test-skill/SKILL.md", mode: "symlink" });

    const result = await installDiscoveredSkill(makeSkill("test-skill"), "project", "/my/project");

    expect(mockInstall).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "test-skill",
        content: expect.any(String),
        installName: "repo/test-skill",
        sourceUrl: "https://github.com/repo/test-skill",
      }),
      "claude-code",
      expect.objectContaining({ global: false, cwd: "/my/project" }),
    );
    expect(result.success).toBe(true);
  });

  it("uses global flag for user scope", async () => {
    mockInstall.mockResolvedValue({ success: true, path: "~/.claude/skills/test-skill/SKILL.md", mode: "symlink" });

    await installDiscoveredSkill(makeSkill("test-skill"), "user", "/my/project");

    expect(mockInstall).toHaveBeenCalledWith(
      expect.anything(),
      "claude-code",
      expect.objectContaining({ global: true }),
    );
  });
});

describe("installDiscoveredSkills", () => {
  it("installs multiple skills and returns summary", async () => {
    mockInstall
      .mockResolvedValueOnce({ success: true, path: "path/a", mode: "symlink" })
      .mockResolvedValueOnce({ success: false, error: "failed" });

    const result = await installDiscoveredSkills(
      [makeSkill("skill-a"), makeSkill("skill-b")],
      "project",
      "/my/project",
    );

    expect(result.success).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.total).toBe(2);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/skills-bridge/install.test.ts
```

Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create `src/skills-bridge/install.ts`:

```typescript
import { installRemoteSkillForAgent } from "skills/src/installer.js";
import type { DiscoveredSkill, InstallScope } from "../types.js";

export interface InstallResult {
  success: boolean;
  path?: string;
  error?: string;
}

export interface BulkInstallResult {
  total: number;
  success: number;
  failed: number;
  results: Array<{ name: string; result: InstallResult }>;
}

/**
 * Install a single discovered skill for claude-code.
 */
export async function installDiscoveredSkill(
  skill: DiscoveredSkill,
  scope: InstallScope,
  cwd: string,
): Promise<InstallResult> {
  const isGlobal = scope === "user";

  const remoteSkill = {
    name: skill.name,
    description: skill.description,
    content: "", // Will be fetched by the installer
    installName: skill.installName,
    sourceUrl: skill.sourceUrl,
  };

  try {
    const result = await installRemoteSkillForAgent(
      remoteSkill,
      "claude-code",
      { global: isGlobal, cwd },
    );

    return {
      success: result.success,
      path: result.path,
      error: result.error,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Install multiple discovered skills and return a summary.
 */
export async function installDiscoveredSkills(
  skills: DiscoveredSkill[],
  scope: InstallScope,
  cwd: string,
): Promise<BulkInstallResult> {
  const results: Array<{ name: string; result: InstallResult }> = [];
  let success = 0;
  let failed = 0;

  for (const skill of skills) {
    const result = await installDiscoveredSkill(skill, scope, cwd);
    results.push({ name: skill.name, result });
    if (result.success) success++;
    else failed++;
  }

  return { total: skills.length, success, failed, results };
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/skills-bridge/install.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/skills-bridge/install.ts tests/skills-bridge/install.test.ts
git commit -m "feat: add skills-bridge install module"
```

---

### Task 5: Create skills-bridge/installed.ts

**Files:**
- Create: `src/skills-bridge/installed.ts`
- Create: `tests/skills-bridge/installed.test.ts`

**Step 1: Write the failing test**

Create `tests/skills-bridge/installed.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("skills/src/installer.js", () => ({
  listInstalledSkills: vi.fn(),
}));

vi.mock("skills/src/skills.js", () => ({
  parseSkillMd: vi.fn(),
}));

import { getInstalledSkillMetadata } from "../../src/skills-bridge/installed.js";
import { listInstalledSkills } from "skills/src/installer.js";
import { parseSkillMd } from "skills/src/skills.js";

const mockList = vi.mocked(listInstalledSkills);
const mockParse = vi.mocked(parseSkillMd);

beforeEach(() => {
  mockList.mockReset();
  mockParse.mockReset();
});

describe("getInstalledSkillMetadata", () => {
  it("returns metadata for installed skills", async () => {
    mockList.mockResolvedValue([
      { name: "skill-a", path: "/project/.claude/skills/skill-a/SKILL.md", agent: "claude-code", global: false },
      { name: "skill-b", path: "/project/.claude/skills/skill-b/SKILL.md", agent: "claude-code", global: false },
    ]);

    mockParse
      .mockResolvedValueOnce({ name: "skill-a", description: "Skill A description", path: "/project/.claude/skills/skill-a/SKILL.md" })
      .mockResolvedValueOnce({ name: "skill-b", description: "Skill B description", path: "/project/.claude/skills/skill-b/SKILL.md" });

    const result = await getInstalledSkillMetadata("/project");

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      name: "skill-a",
      description: "Skill A description",
      path: "/project/.claude/skills/skill-a/SKILL.md",
    });
  });

  it("returns empty array when no skills installed", async () => {
    mockList.mockResolvedValue([]);

    const result = await getInstalledSkillMetadata("/project");

    expect(result).toEqual([]);
  });

  it("skips skills that fail to parse", async () => {
    mockList.mockResolvedValue([
      { name: "skill-a", path: "/project/.claude/skills/skill-a/SKILL.md", agent: "claude-code", global: false },
    ]);

    mockParse.mockResolvedValue(null);

    const result = await getInstalledSkillMetadata("/project");

    expect(result).toEqual([]);
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/skills-bridge/installed.test.ts
```

Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create `src/skills-bridge/installed.ts`:

```typescript
import { listInstalledSkills } from "skills/src/installer.js";
import { parseSkillMd } from "skills/src/skills.js";
import type { SkillMetadata } from "../types.js";

/**
 * Get metadata for all installed skills by reading their SKILL.md files.
 */
export async function getInstalledSkillMetadata(
  cwd: string,
): Promise<SkillMetadata[]> {
  const installed = await listInstalledSkills({ cwd, agentFilter: "claude-code" });

  const metadata: SkillMetadata[] = [];

  for (const skill of installed) {
    const parsed = await parseSkillMd(skill.path);
    if (!parsed) continue;

    metadata.push({
      name: parsed.name,
      description: parsed.description,
      path: skill.path,
    });
  }

  return metadata;
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/skills-bridge/installed.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/skills-bridge/installed.ts tests/skills-bridge/installed.test.ts
git commit -m "feat: add skills-bridge installed module for reading SKILL.md metadata"
```

---

### Task 6: Create skills-bridge/index.ts barrel export

**Files:**
- Create: `src/skills-bridge/index.ts`

**Step 1: Create barrel export**

Create `src/skills-bridge/index.ts`:

```typescript
export { discoverSkillsForTags } from "./discover.js";
export { installDiscoveredSkill, installDiscoveredSkills } from "./install.js";
export type { InstallResult, BulkInstallResult } from "./install.js";
export { getInstalledSkillMetadata } from "./installed.js";
```

**Step 2: Run all bridge tests**

```bash
npx vitest run tests/skills-bridge/
```

Expected: All PASS

**Step 3: Commit**

```bash
git add src/skills-bridge/index.ts
git commit -m "feat: add skills-bridge barrel export"
```

---

## Phase 4: Simplify Detection

### Task 7: Remove agent fields from DetectionResult

**Files:**
- Modify: `src/detect/patterns.ts`
- Modify: `tests/detect/patterns.test.ts`

**Step 1: Update the DetectionResult interface**

In `src/detect/patterns.ts`, change the `DetectionResult` interface to remove agent fields:

```typescript
export interface DetectionResult {
  techs: string[];
  skillTags: string[];
  archetypes?: string[];
  confidence?: Record<string, "high" | "medium">;
}
```

Remove: `skillCats`, `agentCats`, `agentTags` fields. The old `skillCats` was used for category pre-selection in the registry-based wizard — no longer needed since we search by tags directly. `agentCats` and `agentTags` are agent-related.

**Step 2: Update detectProject() function**

Remove all references to `sc` (skillCats), `ac` (agentCats), `at` (agentTags). Only keep `t` (techs) and `st` (skillTags).

Specifically:
- Remove `const sc = result.skillCats;`
- Remove `const ac = result.agentCats;`
- Remove `const at = result.agentTags;`
- Remove all `uniquePush(sc, ...)` calls
- Remove all `uniquePush(ac, ...)` calls
- Remove all `uniquePush(at, ...)` calls
- Remove the `enrichFromArchetypes` function (it only enriched agentCats/agentTags)
- Update `deriveArchetypes` to only use `skillTags` and `techs` (remove references to `agentTags`)

**Step 3: Update the tests**

In `tests/detect/patterns.test.ts`, update all test expectations to remove `skillCats`, `agentCats`, and `agentTags` from the expected results. Keep `techs`, `skillTags`, `archetypes`.

**Step 4: Run tests**

```bash
npx vitest run tests/detect/patterns.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/detect/patterns.ts tests/detect/patterns.test.ts
git commit -m "refactor: remove agent fields from DetectionResult"
```

---

### Task 8: Simplify AI detection

**Files:**
- Modify: `src/detect/ai.ts`
- Modify: `tests/detect/ai.test.ts`

**Step 1: Update the AI prompt and validation**

In `src/detect/ai.ts`, update the Claude prompt to only return `techs`, `skill_tags`, `archetypes`, and `confidence`. Remove `skill_cats`, `agent_cats`, `agent_tags` from the prompt and validation.

Update the `VALID_*` sets: remove `VALID_SKILL_CATS`, `VALID_AGENT_CATS`, `VALID_AGENT_TAGS`. Keep `VALID_SKILL_TAGS`.

Update the result mapping to only populate the new slimmer `DetectionResult`.

**Step 2: Update tests**

Remove expectations for `skillCats`, `agentCats`, `agentTags`.

**Step 3: Run tests**

```bash
npx vitest run tests/detect/ai.test.ts
```

Expected: PASS

**Step 4: Commit**

```bash
git add src/detect/ai.ts tests/detect/ai.test.ts
git commit -m "refactor: simplify AI detection to remove agent fields"
```

---

## Phase 5: Rewrite CLAUDE.md Generation

### Task 9: Rewrite claude-md.ts to use SkillMetadata

**Files:**
- Modify: `src/install/claude-md.ts`
- Modify: `tests/install/claude-md.test.ts`

**Step 1: Write the failing test**

Rewrite `tests/install/claude-md.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("node:fs/promises", () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  mkdir: vi.fn(),
}));

import { generateClaudeMdSection, updateClaudeMd } from "../../src/install/claude-md.js";
import type { SkillMetadata } from "../../src/types.js";

describe("generateClaudeMdSection", () => {
  it("generates markdown section from skill metadata", () => {
    const skills: SkillMetadata[] = [
      { name: "systematic-debugging", description: "Four-phase root cause analysis", path: "/p/.claude/skills/systematic-debugging/SKILL.md" },
      { name: "frontend-design", description: "UI component design patterns", path: "/p/.claude/skills/frontend-design/SKILL.md" },
    ];

    const result = generateClaudeMdSection(skills);

    expect(result).toContain("<!-- superpower-skills-start -->");
    expect(result).toContain("<!-- superpower-skills-end -->");
    expect(result).toContain("# Superpowers Skills");
    expect(result).toContain("- Use systematic-debugging");
    expect(result).toContain("Four-phase root cause analysis");
    expect(result).toContain("- Use frontend-design");
  });

  it("returns empty string for empty skills list", () => {
    expect(generateClaudeMdSection([])).toBe("");
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npx vitest run tests/install/claude-md.test.ts
```

Expected: FAIL — old function signature expects different args.

**Step 3: Rewrite claude-md.ts**

```typescript
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { theme } from "../ui/format.js";
import { resolveClaudeMdPath } from "./scope.js";
import type { SkillMetadata, InstallScope } from "../types.js";

const MARKER_START = "<!-- superpower-skills-start -->";
const MARKER_END = "<!-- superpower-skills-end -->";

/**
 * Generate the CLAUDE.md superpowers section from installed skill metadata.
 */
export function generateClaudeMdSection(skills: SkillMetadata[]): string {
  if (skills.length === 0) return "";

  const lines: string[] = [
    MARKER_START,
    "# Superpowers Skills",
    "",
    "ALWAYS check if a superpowers skill applies before starting any task.",
    "",
  ];

  for (const skill of skills) {
    lines.push(`- Use ${skill.name} — ${skill.description}`);
  }

  lines.push(MARKER_END);
  return lines.join("\n");
}

/**
 * Update the CLAUDE.md file with the superpowers skills section.
 */
export async function updateClaudeMd(
  skills: SkillMetadata[],
  scope: InstallScope,
): Promise<void> {
  if (skills.length === 0) return;

  const section = generateClaudeMdSection(skills);
  if (!section) return;

  const filePath = resolveClaudeMdPath(scope);

  try {
    await mkdir(dirname(filePath), { recursive: true });

    let existing = "";
    try {
      existing = await readFile(filePath, "utf-8");
    } catch {
      // File doesn't exist yet
    }

    let updated: string;
    const startIdx = existing.indexOf(MARKER_START);
    const endIdx = existing.indexOf(MARKER_END);

    if (startIdx !== -1 && endIdx !== -1) {
      updated =
        existing.slice(0, startIdx) +
        section +
        existing.slice(endIdx + MARKER_END.length);
    } else if (existing.length > 0) {
      updated = existing.trimEnd() + "\n\n" + section + "\n";
    } else {
      updated = section + "\n";
    }

    await writeFile(filePath, updated);
    console.log(
      `  ${theme.success("+")} Updated ${theme.bold(filePath)} with skill rules`,
    );
  } catch {
    console.log(
      `  ${theme.warn("!")} Could not update ${filePath} ${theme.dim("(write failed)")}`,
    );
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npx vitest run tests/install/claude-md.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/install/claude-md.ts tests/install/claude-md.test.ts
git commit -m "refactor: rewrite CLAUDE.md generation to use SkillMetadata"
```

---

### Task 10: Update scope.ts to use new types

**Files:**
- Modify: `src/install/scope.ts`

**Step 1: Update imports**

Change `import type { InstallScope } from "../registry/types.js"` to `import type { InstallScope } from "../types.js"`.

**Step 2: Run scope tests**

```bash
npx vitest run tests/install/scope.test.ts
```

Expected: PASS (no logic change)

**Step 3: Commit**

```bash
git add src/install/scope.ts
git commit -m "refactor: update scope.ts imports to new types module"
```

---

## Phase 6: Rewrite Commands

### Task 11: Rewrite scan.ts

**Files:**
- Modify: `src/commands/scan.ts`

**Step 1: Rewrite scan.ts**

Remove the dependency on `isClaudeCliAvailable` from agents. The scan command should still work — it runs detection and prints results. Update it to use the new `DetectionResult` shape (no `skillCats`, `agentCats`):

```typescript
import * as p from "@clack/prompts";
import { theme } from "../ui/format.js";
import { detectProject } from "../detect/patterns.js";
import { detectProjectAI } from "../detect/ai.js";
import type { DetectionResult } from "../detect/patterns.js";

/**
 * Check if Claude CLI is available (moved here from agents.ts).
 */
async function isClaudeCliAvailable(): Promise<boolean> {
  const { execFile } = await import("node:child_process");
  const { promisify } = await import("node:util");
  const execFileAsync = promisify(execFile);
  try {
    await execFileAsync("claude", ["--version"]);
    return true;
  } catch {
    return false;
  }
}

/**
 * Run project detection: AI if available, pattern fallback.
 */
export async function runDetection(): Promise<DetectionResult> {
  const isTTY = process.stdin.isTTY && process.stdout.isTTY;

  if (isTTY && (await isClaudeCliAvailable())) {
    const useAI = await p.confirm({
      message: "Scan project with AI? (better detection)",
      initialValue: true,
    });

    if (!p.isCancel(useAI) && useAI) {
      const aiResult = await detectProjectAI();
      if (aiResult && aiResult.techs.length > 0) {
        return aiResult;
      }
    }
  }

  return detectProject();
}

export async function cmdScan(): Promise<void> {
  const result = await runDetection();

  if (result.techs.length === 0) {
    console.log("");
    console.log(theme.warn("No project signals detected in current directory."));
    console.log(theme.dim("Run from a project root with package.json, go.mod, etc."));
    console.log("");
    return;
  }

  console.log("");
  console.log(theme.heading("Project scan results"));
  console.log("");
  console.log(`  ${theme.bold("Detected:")} ${result.techs.join(", ")}`);
  console.log("");
  console.log(`  ${theme.bold("Skill tags:")}`);
  for (const tag of result.skillTags) {
    console.log(`    ${theme.success("+")} ${tag}`);
  }
  if (result.archetypes?.length) {
    console.log("");
    console.log(`  ${theme.bold("Archetypes:")}`);
    for (const arch of result.archetypes) {
      console.log(`    ${theme.success("+")} ${arch}`);
    }
  }
  console.log("");
}
```

**Step 2: Build to check for type errors**

```bash
npm run typecheck
```

**Step 3: Commit**

```bash
git add src/commands/scan.ts
git commit -m "refactor: rewrite scan command to remove agent dependencies"
```

---

### Task 12: Rewrite interactive.ts — New wizard flow

**Files:**
- Modify: `src/commands/interactive.ts`

This is the biggest change. The new flow is:

1. Scan project → tags
2. Discover skills from tags (via skills.sh API)
3. Show discovered skills as checkboxes (pre-checked by relevance)
4. Choose scope
5. Confirm & install
6. Generate CLAUDE.md

**Step 1: Rewrite interactive.ts**

```typescript
import * as p from "@clack/prompts";
import { theme } from "../ui/format.js";
import { printBanner } from "../ui/banner.js";
import { discoverSkillsForTags } from "../skills-bridge/discover.js";
import { installDiscoveredSkills } from "../skills-bridge/install.js";
import { getInstalledSkillMetadata } from "../skills-bridge/installed.js";
import { updateClaudeMd } from "../install/claude-md.js";
import { checkboxMenu } from "../prompts/checkbox.js";
import { selectScopeMenu } from "./search.js";
import { runDetection } from "./scan.js";
import type { InstallScope } from "../types.js";
import type { DiscoveredSkill } from "../types.js";

async function runSkillWizard(
  scope: InstallScope,
  scopeSetByFlag: boolean,
): Promise<void> {
  // Step 1: Scan project
  const detection = await runDetection();

  if (detection.techs.length > 0) {
    console.log("");
    console.log(
      `  ${theme.success("Detected:")} ${theme.bold(detection.techs.join(", "))}`,
    );
    if (detection.archetypes?.length) {
      console.log(`  ${theme.dim("Project type:")} ${detection.archetypes.join(", ")}`);
    }
  } else {
    console.log("");
    console.log(
      `  ${theme.warn("No project signals detected.")} Falling back to general skills.`,
    );
  }

  // Step 2: Discover skills from tags
  const tags = detection.skillTags.length > 0 ? detection.skillTags : ["general"];

  const discoverSpinner = p.spinner();
  discoverSpinner.start("Discovering skills from ecosystem...");

  let discovered: DiscoveredSkill[];
  try {
    discovered = await discoverSkillsForTags(tags);
  } catch {
    discoverSpinner.stop("Discovery failed");
    console.log(theme.warn("Could not reach skills.sh. Check your internet connection."));
    return;
  }

  discoverSpinner.stop(`Found ${discovered.length} skills`);

  if (discovered.length === 0) {
    console.log(theme.warn("No matching skills found. Try a different project or broader tags."));
    return;
  }

  // Step 3: Review & Select
  const options = discovered.map((s) => ({
    label: s.name,
    description: `${s.description} (${s.installName})`,
    value: s.name,
  }));

  // Pre-select skills that matched 2+ tags
  const preselected = discovered
    .filter((s) => s.relevance >= 2)
    .map((s) => s.name);

  console.log("");
  const selectedNames = await checkboxMenu(
    "Select skills to install",
    options,
    { preselected },
  );

  if (!selectedNames || selectedNames.length === 0) {
    console.log(theme.warn("No skills selected. Exiting."));
    process.exit(0);
  }

  const selectedSkills = discovered.filter((s) => selectedNames.includes(s.name));

  // Step 4: Scope choice
  if (!scopeSetByFlag) {
    console.log("");
    const scopeResult = await selectScopeMenu();
    if (scopeResult) scope = scopeResult;
  }

  // Step 5: Confirm
  console.log("");
  console.log(theme.bold(`Skills to install (${selectedSkills.length}):`));
  console.log(theme.dim(`  Scope: ${scope}`));
  console.log("");
  for (const skill of selectedSkills) {
    console.log(
      `  ${theme.success("+")} ${theme.bold(skill.name)}  ${theme.dim(skill.description)}`,
    );
  }
  console.log("");

  const confirm = await p.confirm({
    message: "Install these skills?",
  });

  if (p.isCancel(confirm) || !confirm) {
    console.log(theme.warn("Installation cancelled."));
    process.exit(0);
  }

  // Step 6: Install
  const cwd = process.cwd();
  const installSpinner = p.spinner();
  installSpinner.start(`Installing skills (0/${selectedSkills.length})...`);

  const result = await installDiscoveredSkills(selectedSkills, scope, cwd);

  installSpinner.stop(
    `Installed ${result.success} skills${result.failed > 0 ? ` (${result.failed} failed)` : ""}`,
  );

  // Step 7: Generate CLAUDE.md
  if (result.success > 0) {
    const installed = await getInstalledSkillMetadata(cwd);
    await updateClaudeMd(installed, scope);
  }
}

export async function cmdInteractive(
  scope: InstallScope,
  scopeSetByFlag: boolean,
): Promise<void> {
  printBanner();
  await runSkillWizard(scope, scopeSetByFlag);
}
```

**Step 2: Build to check for type errors**

```bash
npm run typecheck
```

**Step 3: Commit**

```bash
git add src/commands/interactive.ts
git commit -m "refactor: rewrite interactive wizard to use skills ecosystem"
```

---

### Task 13: Rewrite search.ts — Remove agent search

**Files:**
- Modify: `src/commands/search.ts`

**Step 1: Rewrite search.ts**

Keep `cmdSearch` (now searches via skills.sh API instead of local registry), `selectScopeMenu`. Remove `cmdAgentsSearch`, `selectAgentScopeMenu`.

```typescript
import * as p from "@clack/prompts";
import { theme } from "../ui/format.js";
import { printBanner } from "../ui/banner.js";
import { discoverSkillsForTags } from "../skills-bridge/discover.js";
import { installDiscoveredSkills } from "../skills-bridge/install.js";
import { getInstalledSkillMetadata } from "../skills-bridge/installed.js";
import { updateClaudeMd } from "../install/claude-md.js";
import { searchCheckboxMenu } from "../prompts/search-checkbox.js";
import { selectMenu } from "../prompts/select.js";
import type { InstallScope } from "../types.js";

export async function cmdSearch(
  initialFilter: string,
  scope: InstallScope,
  scopeSetByFlag: boolean,
): Promise<void> {
  printBanner();

  // Discover skills using the search term as a tag
  const tags = initialFilter ? [initialFilter] : ["general"];
  const s = p.spinner();
  s.start("Searching skills ecosystem...");

  let discovered;
  try {
    discovered = await discoverSkillsForTags(tags);
  } catch {
    s.stop("Search failed");
    console.log(theme.warn("Could not reach skills.sh."));
    return;
  }

  s.stop(`Found ${discovered.length} skills`);

  if (discovered.length === 0) {
    console.log(theme.warn("No skills found matching your search."));
    process.exit(0);
  }

  const items = discovered.map((sk) => ({
    name: sk.name,
    description: `${sk.description} (${sk.installName})`,
  }));

  console.log("");
  const selected = await searchCheckboxMenu(
    `Select skills (${discovered.length} found)`,
    items,
    initialFilter,
  );

  if (!selected || selected.length === 0) {
    if (selected === null) {
      console.log("");
      console.log(theme.warn("Search cancelled."));
    } else {
      console.log(theme.warn("No skills selected. Exiting."));
    }
    process.exit(0);
  }

  // Scope selection
  if (!scopeSetByFlag) {
    const scopeResult = await selectScopeMenu();
    if (scopeResult) scope = scopeResult;
  }

  const selectedSkills = discovered.filter((s) => selected.includes(s.name));

  // Confirmation
  console.log("");
  console.log(theme.bold(`Skills to install (${selectedSkills.length}):`));
  console.log(theme.dim(`  Scope: ${scope}`));
  console.log("");
  for (const skill of selectedSkills) {
    console.log(
      `  ${theme.success("+")} ${theme.bold(skill.name)}  ${theme.dim(skill.description)}`,
    );
  }
  console.log("");

  const confirm = await p.confirm({ message: "Install these skills?" });
  if (p.isCancel(confirm) || !confirm) {
    console.log(theme.warn("Installation cancelled."));
    process.exit(0);
  }

  const cwd = process.cwd();
  const result = await installDiscoveredSkills(selectedSkills, scope, cwd);

  if (result.success > 0) {
    const installed = await getInstalledSkillMetadata(cwd);
    await updateClaudeMd(installed, scope);
  }
}

export async function selectScopeMenu(): Promise<InstallScope | null> {
  const result = await selectMenu("Where should these be installed?", [
    {
      label: "Project scope",
      description: ".claude/ — shared with all collaborators via git",
      value: "project",
    },
    {
      label: "User scope",
      description: "~/.claude/ — available in all your projects",
      value: "user",
    },
    {
      label: "Local scope",
      description: ".claude/ + .gitignore — this repo only, not committed",
      value: "local",
    },
  ]);
  return result as InstallScope | null;
}
```

**Step 2: Commit**

```bash
git add src/commands/search.ts
git commit -m "refactor: rewrite search command to use skills ecosystem"
```

---

### Task 14: Rewrite list.ts — List installed skills

**Files:**
- Modify: `src/commands/list.ts`

**Step 1: Rewrite list.ts**

Instead of listing from registry, list installed skills from filesystem:

```typescript
import { theme } from "../ui/format.js";
import { getInstalledSkillMetadata } from "../skills-bridge/installed.js";

export async function cmdList(): Promise<void> {
  const cwd = process.cwd();
  const skills = await getInstalledSkillMetadata(cwd);

  if (skills.length === 0) {
    console.log("");
    console.log(theme.warn("No skills installed in this project."));
    console.log(theme.dim("Run npx superpower-installer to install skills."));
    console.log("");
    return;
  }

  console.log("");
  console.log(theme.bold(`Installed Skills (${skills.length})`));
  console.log("");

  for (const skill of skills) {
    console.log(`  ${theme.bold(skill.name)}`);
    console.log(`  ${theme.dim(skill.description)}`);
    console.log(`  ${theme.dim(skill.path)}`);
    console.log("");
  }
}
```

**Step 2: Commit**

```bash
git add src/commands/list.ts
git commit -m "refactor: rewrite list command to show installed skills"
```

---

### Task 15: Rewrite update.ts — Update installed skills

**Files:**
- Modify: `src/commands/update.ts`

**Step 1: Rewrite update.ts**

Use `npx skills update` or the skills package's check/update mechanism:

```typescript
import * as p from "@clack/prompts";
import { theme } from "../ui/format.js";
import { getInstalledSkillMetadata } from "../skills-bridge/installed.js";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export async function cmdUpdate(): Promise<void> {
  const cwd = process.cwd();
  const skills = await getInstalledSkillMetadata(cwd);

  if (skills.length === 0) {
    console.log(theme.warn("No skills installed. Nothing to update."));
    return;
  }

  console.log(theme.bold(`Updating ${skills.length} installed skills...`));
  console.log("");

  const s = p.spinner();
  s.start("Updating skills...");

  try {
    await execFileAsync("npx", ["skills", "update"], { cwd });
    s.stop("Skills updated");
  } catch {
    s.stop("Update completed with warnings");
    console.log(theme.dim("Some skills may not have been updated. Run 'npx skills check' for details."));
  }
}
```

**Step 2: Commit**

```bash
git add src/commands/update.ts
git commit -m "refactor: rewrite update command to delegate to npx skills"
```

---

### Task 16: Simplify preselect.ts

**Files:**
- Modify: `src/commands/preselect.ts`
- Modify: `tests/commands/preselect.test.ts`

**Step 1: Simplify preselect.ts**

Remove `deriveTagsFromStack`, `shouldPreselectSkill`, `shouldPreselectPlugin` — these were all registry-based. The wizard no longer uses project-type/stack menus. Pre-selection is now by relevance score (handled in interactive.ts).

If this module is still imported anywhere after the rewrite, keep it minimal. Otherwise delete it.

Check: After Tasks 11-15, this module should not be imported anywhere. Delete it:

```bash
rm src/commands/preselect.ts tests/commands/preselect.test.ts
```

**Step 2: Commit**

```bash
git add -A
git commit -m "refactor: remove preselect module (replaced by relevance-based selection)"
```

---

## Phase 7: Rewrite CLI Entry Point

### Task 17: Simplify bin.ts

**Files:**
- Modify: `src/bin.ts`

**Step 1: Rewrite bin.ts**

Remove `--agents`, `--preset`, agent-mode routing. Keep `--list`, `--search`, `--update`, `--scan`, and default interactive mode:

```typescript
import { Command } from "commander";
import { getVersion } from "./ui/banner.js";
import { cmdList } from "./commands/list.js";
import { cmdSearch } from "./commands/search.js";
import { cmdUpdate } from "./commands/update.js";
import { cmdScan } from "./commands/scan.js";
import { cmdInteractive } from "./commands/interactive.js";
import type { InstallScope } from "./types.js";

const program = new Command();

let installScope: InstallScope = "project";
let scopeSetByFlag = false;

program
  .name("superpower-installer")
  .description("Interactive installer for Claude Code skills")
  .version(getVersion(), "-v, --version")
  .option(
    "--scope <scope>",
    "Installation scope: project, user, or local",
    (value: string) => {
      if (!["project", "user", "local"].includes(value)) {
        console.error(`Error: invalid scope '${value}'. Use: user, project, local`);
        process.exit(1);
      }
      installScope = value as InstallScope;
      scopeSetByFlag = true;
      return value;
    },
  )
  .option("-l, --list", "List installed skills")
  .option("-s, --search [term]", "Search & install skills from ecosystem")
  .option("-u, --update", "Update installed skills")
  .option("--scan", "Detect project tech stack");

program.action(async (opts) => {
  try {
    if (opts.list) {
      await cmdList();
    } else if (opts.search !== undefined) {
      const term = typeof opts.search === "string" ? opts.search : "";
      await cmdSearch(term, installScope, scopeSetByFlag);
    } else if (opts.update) {
      await cmdUpdate();
    } else if (opts.scan) {
      await cmdScan();
    } else {
      await cmdInteractive(installScope, scopeSetByFlag);
    }
  } catch (err) {
    if (err instanceof Error) {
      console.error(`Error: ${err.message}`);
    }
    process.exit(1);
  }
});

program.parse();
```

**Step 2: Build to verify**

```bash
npm run typecheck
```

**Step 3: Commit**

```bash
git add src/bin.ts
git commit -m "refactor: simplify CLI — remove agents, presets, use skills ecosystem"
```

---

## Phase 8: Delete Old Code

### Task 18: Delete registry files and old modules

**Files:**
- Delete: `registry/skills.json`
- Delete: `registry/agents.json`
- Delete: `registry/sources.json`
- Delete: `src/registry/loader.ts`
- Delete: `src/registry/types.ts`
- Delete: `src/registry/skills.ts`
- Delete: `src/registry/agents.ts`
- Delete: `src/install/skills.ts`
- Delete: `src/install/agents.ts`
- Delete: `src/commands/preset.ts`

**Step 1: Delete files**

```bash
rm -rf registry/
rm -rf src/registry/
rm src/install/skills.ts
rm src/install/agents.ts
rm src/commands/preset.ts
```

**Step 2: Delete old tests**

```bash
rm tests/registry/skills.test.ts
rm tests/registry/agents.test.ts
rm -rf tests/registry/
```

**Step 3: Update package.json**

Remove `"registry"` from the `"files"` array. Update description:

```json
{
  "description": "Smart skill installer for Claude Code — scans your project, discovers skills",
  "files": ["dist"]
}
```

**Step 4: Update banner.ts**

Update the tagline in `src/ui/banner.ts`:

```typescript
console.log(`  ${pc.dim(`v${VERSION} — Smart skill installer for Claude Code`)}`);
```

**Step 5: Build to verify no broken imports**

```bash
npm run typecheck && npm run build
```

**Step 6: Commit**

```bash
git add -A
git commit -m "refactor: remove local registries, agent code, and preset command"
```

---

## Phase 9: Update Remaining Tests

### Task 19: Update scope.test.ts imports

**Files:**
- Modify: `tests/install/scope.test.ts`

**Step 1: Update imports**

If `scope.test.ts` imports from `../../src/registry/types.js`, change to `../../src/types.js`.

**Step 2: Run tests**

```bash
npx vitest run tests/install/scope.test.ts
```

Expected: PASS

**Step 3: Commit**

```bash
git add tests/install/scope.test.ts
git commit -m "test: update scope test imports"
```

---

### Task 20: Run full test suite and fix any remaining issues

**Step 1: Run all tests**

```bash
npm run test
```

**Step 2: Fix any failing tests**

Address each failure — likely import path changes or removed modules.

**Step 3: Run typecheck**

```bash
npm run typecheck
```

**Step 4: Run build**

```bash
npm run build
```

**Step 5: Commit**

```bash
git add -A
git commit -m "test: fix remaining test failures after migration"
```

---

## Phase 10: Smoke Test

### Task 21: Manual smoke test

**Step 1: Run the CLI**

```bash
node dist/bin.js --scan
```

Expected: Detects project tech stack and shows tags.

**Step 2: Run interactive mode**

```bash
node dist/bin.js
```

Expected: Shows banner → scans → discovers skills from skills.sh → shows checkbox → can select and install.

**Step 3: Run search**

```bash
node dist/bin.js --search typescript
```

Expected: Searches skills.sh for "typescript" skills, shows results.

**Step 4: Run list**

```bash
node dist/bin.js --list
```

Expected: Shows installed skills (or "none installed" message).

**Step 5: Commit final state**

```bash
git add -A
git commit -m "feat: complete migration to npx skills ecosystem"
```

---

## Summary

| Phase | Tasks | What Happens |
|-------|-------|-------------|
| 1 | 1 | Add skills dependency, verify build |
| 2 | 2 | Create new shared types |
| 3 | 3-6 | Build skills-bridge adapter layer (discover, install, installed) |
| 4 | 7-8 | Simplify detection (remove agent fields) |
| 5 | 9-10 | Rewrite CLAUDE.md generation |
| 6 | 11-16 | Rewrite all commands |
| 7 | 17 | Simplify CLI entry point |
| 8 | 18 | Delete old code |
| 9 | 19-20 | Fix tests |
| 10 | 21 | Smoke test |

**Total: 21 tasks, ~15 commits**

# Obra Defaults & Cross-Source Dedup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add obra/superpowers as pre-checked default skills and deduplicate cross-source skills by name (keeping highest installs).

**Architecture:** Extend the discovery pipeline with a `fetchDefaultSkills()` function that queries skills.sh for obra skills. Change the dedup key from `source:name` to `name` so cross-source duplicates merge, keeping the highest-installs variant. Add `installs` and `isDefault` fields to `DiscoveredSkill`. Wire defaults into the interactive wizard as pre-checked entries.

**Tech Stack:** TypeScript, Vitest, skills.sh API

---

### Task 1: Add `installs` and `isDefault` to DiscoveredSkill

**Files:**
- Modify: `src/types.ts:11-24`

**Step 1: Update the type**

Add two new fields to `DiscoveredSkill` in `src/types.ts`:

```typescript
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
  /** Install count from skills.sh API — used for dedup ranking */
  installs: number;
  /** Whether this is a default/recommended skill (obra/superpowers) */
  isDefault: boolean;
}
```

**Step 2: Run typecheck to see all downstream breakages**

Run: `npx tsc --noEmit 2>&1 | head -30`
Expected: errors in discover.ts, discover.test.ts, install.test.ts (missing `installs` and `isDefault` properties)

**Step 3: Commit**

```bash
git add src/types.ts
git commit -m "feat: add installs and isDefault fields to DiscoveredSkill"
```

---

### Task 2: Update discover.ts — name-based dedup + installs tracking

**Files:**
- Modify: `src/skills-bridge/discover.ts`

**Step 1: Write failing tests for name-based dedup**

Add these tests to `tests/skills-bridge/discover.test.ts`:

```typescript
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

it("includes installs field in results", async () => {
  mockSearchSkillsAPI.mockResolvedValueOnce([
    makeSearchResult({ name: "my-skill", slug: "slug", source: "org/repo", installs: 999 }),
  ]);

  const result = await discoverSkillsForTags(["tag"]);

  expect(result[0]!.installs).toBe(999);
  expect(result[0]!.isDefault).toBe(false);
});
```

**Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/skills-bridge/discover.test.ts`
Expected: FAIL — `installs` and `isDefault` not in results, dedup by `source:name` doesn't merge

**Step 3: Update discover.ts**

Replace the full `discoverSkillsForTags` function in `src/skills-bridge/discover.ts`:

```typescript
import { searchSkillsAPI } from "./search-api.js";
import type { DiscoveredSkill } from "../types.js";

const DEFAULT_SOURCE = "obra/superpowers";

/**
 * Fetch default (obra/superpowers) skills from the skills.sh API.
 * Searches for "obra" and filters to the obra/superpowers source.
 */
export async function fetchDefaultSkills(): Promise<DiscoveredSkill[]> {
  const results = await searchSkillsAPI("obra/superpowers");

  return results
    .filter((r) => r.source === DEFAULT_SOURCE)
    .map((r) => ({
      name: r.name,
      description: "",
      installName: r.source,
      sourceUrl: `https://skills.sh/${r.slug}`,
      relevance: 0,
      matchedTags: [],
      installs: r.installs,
      isDefault: true,
    }));
}

/**
 * Search the skills.sh API for each tag, deduplicate results by skill name
 * (keeping the variant with the most installs), and rank by relevance.
 */
export async function discoverSkillsForTags(
  tags: string[],
): Promise<DiscoveredSkill[]> {
  if (tags.length === 0) return [];

  const skillMap = new Map<string, DiscoveredSkill>();

  for (const tag of tags) {
    const results = await searchSkillsAPI(tag);

    for (const result of results) {
      const key = result.name;
      const existing = skillMap.get(key);

      if (existing) {
        // Bump relevance for tag match
        if (!existing.matchedTags.includes(tag)) {
          existing.relevance += 1;
          existing.matchedTags.push(tag);
        }
        // Keep the higher-installs variant's source info
        if (result.installs > existing.installs) {
          existing.installName = result.source;
          existing.sourceUrl = `https://skills.sh/${result.slug}`;
          existing.installs = result.installs;
        }
      } else {
        skillMap.set(key, {
          name: result.name,
          description: "",
          installName: result.source,
          sourceUrl: `https://skills.sh/${result.slug}`,
          relevance: 1,
          matchedTags: [tag],
          installs: result.installs,
          isDefault: false,
        });
      }
    }
  }

  return Array.from(skillMap.values()).sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    if (b.installs !== a.installs) return b.installs - a.installs;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Discover skills: fetch defaults (obra/superpowers) + tag-based results,
 * merge and deduplicate by name.
 */
export async function discoverSkills(
  tags: string[],
): Promise<DiscoveredSkill[]> {
  const [defaults, tagResults] = await Promise.all([
    fetchDefaultSkills(),
    discoverSkillsForTags(tags),
  ]);

  // Merge: start with defaults, then add tag results
  const merged = new Map<string, DiscoveredSkill>();

  for (const skill of defaults) {
    merged.set(skill.name, skill);
  }

  for (const skill of tagResults) {
    const existing = merged.get(skill.name);
    if (existing) {
      // Default exists — merge tag info into it
      existing.relevance += skill.relevance;
      for (const tag of skill.matchedTags) {
        if (!existing.matchedTags.includes(tag)) {
          existing.matchedTags.push(tag);
        }
      }
      if (skill.installs > existing.installs) {
        existing.installs = skill.installs;
      }
    } else {
      merged.set(skill.name, skill);
    }
  }

  // Sort: defaults first, then by relevance, then installs
  return Array.from(merged.values()).sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    if (b.installs !== a.installs) return b.installs - a.installs;
    return a.name.localeCompare(b.name);
  });
}
```

**Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/skills-bridge/discover.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/skills-bridge/discover.ts tests/skills-bridge/discover.test.ts
git commit -m "feat: name-based dedup keeping highest installs + fetchDefaultSkills"
```

---

### Task 3: Update existing discover tests for new fields

**Files:**
- Modify: `tests/skills-bridge/discover.test.ts`

**Step 1: Fix existing test expectations to include `installs` and `isDefault`**

Update the `makeSearchResult` default and fix existing `toEqual` assertions. The main change: every `toEqual` on a `DiscoveredSkill` now needs `installs` and `isDefault: false`. For example, the "returns mapped skills for a single tag" test:

```typescript
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
```

Update all `toEqual` assertions in the file to include `installs` and `isDefault: false`.

**Step 2: Run tests**

Run: `npx vitest run tests/skills-bridge/discover.test.ts`
Expected: PASS — all existing + new tests green

**Step 3: Commit**

```bash
git add tests/skills-bridge/discover.test.ts
git commit -m "test: update discover tests for installs and isDefault fields"
```

---

### Task 4: Add tests for fetchDefaultSkills and discoverSkills

**Files:**
- Modify: `tests/skills-bridge/discover.test.ts`

**Step 1: Write tests for fetchDefaultSkills**

```typescript
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

    expect(mockSearchSkillsAPI).toHaveBeenCalledWith("obra/superpowers");
  });
});
```

**Step 2: Write tests for discoverSkills**

```typescript
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
```

**Step 2: Update imports at top of test file**

```typescript
import { discoverSkillsForTags, fetchDefaultSkills, discoverSkills } from "../../src/skills-bridge/discover.js";
```

**Step 3: Run tests**

Run: `npx vitest run tests/skills-bridge/discover.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add tests/skills-bridge/discover.test.ts
git commit -m "test: add tests for fetchDefaultSkills and discoverSkills"
```

---

### Task 5: Fix install.test.ts for new DiscoveredSkill fields

**Files:**
- Modify: `tests/skills-bridge/install.test.ts:23-33`

**Step 1: Update makeSkill helper**

Add `installs` and `isDefault` to the helper:

```typescript
function makeSkill(overrides: Partial<DiscoveredSkill> = {}): DiscoveredSkill {
  return {
    name: "test-skill",
    description: "",
    installName: "org/repo",
    sourceUrl: "https://skills.sh/org-repo-test-skill",
    relevance: 1,
    matchedTags: ["tag"],
    installs: 100,
    isDefault: false,
    ...overrides,
  };
}
```

**Step 2: Run tests**

Run: `npx vitest run tests/skills-bridge/install.test.ts`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/skills-bridge/install.test.ts
git commit -m "test: update install.test.ts for new DiscoveredSkill fields"
```

---

### Task 6: Update interactive.ts — pre-check defaults + display

**Files:**
- Modify: `src/commands/interactive.ts`

**Step 1: Switch to discoverSkills and update pre-selection**

Replace the import and discovery call:

```typescript
import { discoverSkills } from "../skills-bridge/discover.js";
```

Replace `discoverSkillsForTags(tags)` with `discoverSkills(tags)`.

Update the preselected filter (line 57):

```typescript
const preselected = discovered.filter((s) => s.isDefault || s.relevance >= 2).map((s) => s.name);
```

Update the description in options (line 52-56) to show `[recommended]` for defaults:

```typescript
const options = discovered.map((s) => ({
  label: s.name,
  description: `${s.installName}${s.isDefault ? " [recommended]" : ""}${s.description ? " — " + s.description : ""}`,
  value: s.name,
}));
```

**Step 2: Run build to verify no type errors**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Manual smoke test**

Run: `node dist/bin.js`
Expected: obra/superpowers skills appear pre-checked with `[recommended]` label

**Step 4: Commit**

```bash
git add src/commands/interactive.ts
git commit -m "feat: pre-check obra defaults and show [recommended] in wizard"
```

---

### Task 7: Update search.ts — use deduped pipeline

**Files:**
- Modify: `src/commands/search.ts`

**Step 1: No change needed**

`search.ts` calls `discoverSkillsForTags` which already has name-based dedup. Search doesn't inject defaults (intentional). No code changes required.

Verify: `npx tsc --noEmit` — should pass.

---

### Task 8: Update barrel export

**Files:**
- Modify: `src/skills-bridge/index.ts`

**Step 1: Add new exports**

```typescript
export { discoverSkillsForTags, fetchDefaultSkills, discoverSkills } from "./discover.js";
```

**Step 2: Commit**

```bash
git add src/skills-bridge/index.ts
git commit -m "feat: export fetchDefaultSkills and discoverSkills from barrel"
```

---

### Task 9: Full verification

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: all tests pass

**Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors

**Step 3: Build**

Run: `npm run build`
Expected: clean build

**Step 4: Smoke test**

Run: `node dist/bin.js --version && node dist/bin.js --list`
Expected: version prints, list works

**Step 5: Commit any remaining changes**

```bash
git add -A
git commit -m "chore: obra defaults and cross-source dedup complete"
```

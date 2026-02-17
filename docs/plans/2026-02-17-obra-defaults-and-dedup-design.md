# Obra Defaults & Cross-Source Dedup

**Date:** 2026-02-17
**Status:** Approved

## Problem

1. The skills.sh ecosystem has many duplicate skills across sources (e.g., `typescript-pro` from 3+ publishers). Users see noise when discovering skills.
2. Obra's superpowers skills (14 core workflow skills, 5,900–21,600 installs each) are the highest-quality general-purpose skills. They should be offered as defaults.

## Decisions

- **Obra defaults**: Dynamically fetch from `skills.sh/api/search?q=obra&limit=50`, filter by `source === "obra/superpowers"`. Pre-checked in the interactive wizard.
- **Dedup strategy**: Group by skill name (`skillId`). When multiple sources publish the same name, keep the one with the most installs.
- **No description comparison**: The search API doesn't return descriptions. Name-based dedup catches the main cases.

## Design

### Type changes (`src/types.ts`)

`DiscoveredSkill` gains two fields:

```typescript
installs: number;    // install count from API, used for dedup
isDefault: boolean;  // true for obra/superpowers skills
```

### Discovery pipeline (`src/skills-bridge/discover.ts`)

New function `fetchDefaultSkills()`:
1. Search `q=obra&limit=50`
2. Filter results to `source === "obra/superpowers"`
3. Map to `DiscoveredSkill[]` with `isDefault: true`

Updated dedup logic in main discovery:
- Change dedup key from `source:name` to just `name`
- When merging duplicates, keep the entry with the highest `installs`
- Accumulate `matchedTags` and `relevance` as before

New top-level function `discoverSkills(tags: string[])`:
1. Fetch default skills (obra/superpowers)
2. Fetch tag-based skills (existing per-tag search)
3. Merge both sets
4. Dedup by name, keep highest installs
5. Sort: defaults first, then by relevance, then by installs

### Interactive wizard (`src/commands/interactive.ts`)

- Pre-select skills where `isDefault === true` OR `relevance >= 2`
- Order: default skills first (by installs desc), then project-specific (by relevance desc, installs desc)
- Default skills display `[recommended]` in their description

### Search command (`src/commands/search.ts`)

- Uses the same deduped pipeline — benefits from name-based dedup automatically
- No default skill injection (search is explicit)

### Unchanged modules

- `install.ts` — still shells out to `npx skills add`
- `installed.ts` — still scans `.claude/skills/`
- `scan.ts` — detection logic is separate
- `search-api.ts` — fetch wrapper unchanged
- `claude-md.ts` — works with `SkillMetadata[]`

## Test plan

- `discover.test.ts`: default skills fetching, name-based dedup (highest installs wins), merging defaults with tag results, `isDefault` flag
- Manual smoke test: interactive wizard shows defaults pre-checked

# Design: Integrate with npx skills Ecosystem

**Date:** 2026-02-17
**Status:** Approved

## Problem

Maintaining a local registry of 77 skills and 130+ agents is unsustainable. The `skills` npm package (Vercel Labs) has become the open standard for AI agent skill discovery and installation, backed by Anthropic. We should leverage this ecosystem instead of maintaining our own registries.

## Decision

**Approach:** Import `skills` package as a git dependency and use its clean programmatic modules directly — `searchSkillsAPI()`, `installRemoteSkillForAgent()`, `parseSkillMd()`, etc.

**Core value preserved:** Project scanning & detection (pattern + AI) — this is what differentiates us from running `npx skills find` manually.

## Architecture

```
npx superpower-installer
         │
    ┌────▼─────────────────────────┐
    │   SCAN ENGINE (kept)         │
    │   patterns.ts + ai.ts        │
    │   → produces: tags[]          │
    └────┬─────────────────────────┘
         │
    ┌────▼─────────────────────────┐
    │   SKILLS BRIDGE (new)         │
    │   searchSkillsAPI(tag)       │
    │   → fetches from skills.sh    │
    │   → returns: SearchSkill[]    │
    └────┬─────────────────────────┘
         │
    ┌────▼─────────────────────────┐
    │   INTERACTIVE WIZARD (kept)   │
    │   Present discovered skills   │
    │   User picks from results     │
    └────┬─────────────────────────┘
         │
    ┌────▼─────────────────────────┐
    │   INSTALLER (from skills pkg) │
    │   installRemoteSkillForAgent()│
    │   → writes to .claude/skills/ │
    └────┬─────────────────────────┘
         │
    ┌────▼─────────────────────────┐
    │   CLAUDE.MD GEN (kept)        │
    │   Reads installed SKILL.md    │
    │   → generates rules section   │
    └──────────────────────────────┘
```

## What Stays

| Component | Files | Reason |
|-----------|-------|--------|
| Pattern detection | `src/detect/patterns.ts` | Core differentiator — 77+ pattern checks |
| AI detection | `src/detect/ai.ts` | Core differentiator — Claude-powered scanning |
| Interactive wizard | `src/commands/interactive.ts` | UX layer (modified flow) |
| CLAUDE.md generation | `src/install/claude-md.ts` | Generates contextual rules (modified) |
| TUI components | `src/prompts/`, `src/ui/` | Reused as-is |

## What Goes

| Component | Files | Reason |
|-----------|-------|--------|
| Skills registry | `registry/skills.json` | Replaced by `searchSkillsAPI()` |
| Agents registry | `registry/agents.json` | Agents dropped entirely |
| Sources registry | `registry/sources.json` | Skills ecosystem handles sources |
| Registry module | `src/registry/` | No local registries to load |
| Skills installer | `src/install/skills.ts` | Replaced by skills package installer |
| Agents installer | `src/install/agents.ts` | Agents dropped |
| Presets command | `src/commands/preset.ts` | Presets were registry-based |
| Agent wizard steps | Parts of `interactive.ts` | No agent support |

## What's New

### `src/skills-bridge/` — Adapter Layer

Thin wrappers around clean functions from the `skills` package source:

#### `discover.ts` — Tag-based discovery

```typescript
import { searchSkillsAPI } from 'skills/src/find.ts';

export async function discoverSkillsForTags(tags: string[]): Promise<DiscoveredSkill[]> {
  // 1. Search for each tag in parallel via skills.sh API
  // 2. Deduplicate by installName + skill name
  // 3. Rank by relevance (how many tags matched)
  // 4. Return unified list
}
```

#### `install.ts` — Skill installation

```typescript
import { installRemoteSkillForAgent } from 'skills/src/installer.ts';

export async function installSkill(
  skill: DiscoveredSkill,
  cwd: string,
  scope: Scope
): Promise<InstallResult> {
  // 1. Fetch skill content from source
  // 2. Call installRemoteSkillForAgent(remoteSkill, 'claude-code', opts)
  // 3. Return result
}
```

#### `installed.ts` — Read installed skills

```typescript
import { listInstalledSkills } from 'skills/src/installer.ts';
import { parseSkillMd } from 'skills/src/skills.ts';

export async function getInstalledSkillMetadata(cwd: string): Promise<SkillMetadata[]> {
  // 1. List installed skills
  // 2. Parse each SKILL.md for name + description
  // 3. Return metadata for CLAUDE.md generation
}
```

### Dependency: `skills` as git dependency

```json
{
  "dependencies": {
    "skills": "github:vercel-labs/skills#<pinned-commit>"
  }
}
```

The `skills` package has no `exports` field (CLI-only), but we import directly from its TypeScript source. Our tsup/esbuild bundler compiles the TS at build time.

## Modified Wizard Flow

**Before:** Project type → Tech stack → Categories → Per-skill picker → Scope → Install

**After:**

| Step | Type | Description |
|------|------|-------------|
| 1. Scan | Automatic | Pattern + AI detection → `tags[]` |
| 2. Discover | Automatic (spinner) | `searchSkillsAPI(tag)` for each tag, deduplicate, rank |
| 3. Review & Select | Interactive | Checkboxes with pre-checked high-relevance skills |
| 4. Scope | Interactive | project / user / local |
| 5. Install | Automatic | Install via skills package + generate CLAUDE.md |

## Modified CLAUDE.md Generation

Instead of category-based templates from the registry, read installed SKILL.md frontmatter:

```typescript
export function generateClaudeMdSection(skills: SkillMetadata[]): string {
  // Read name + description from each installed SKILL.md
  // Generate: "- Use {name} — {description}"
  // Group by inferred category from metadata tags if available
  // Keep <!-- superpower-skills-start/end --> markers
}
```

## Skills Package — Programmatic API Surface

These functions from the `skills` source are clean (no process.exit, no stdout, no interactive prompts):

| Module | Function | Returns |
|--------|----------|---------|
| `find.ts` | `searchSkillsAPI(query)` | `Promise<SearchSkill[]>` |
| `installer.ts` | `installSkillForAgent(skill, agent, opts)` | `Promise<InstallResult>` |
| `installer.ts` | `installRemoteSkillForAgent(skill, agent, opts)` | `Promise<InstallResult>` |
| `installer.ts` | `listInstalledSkills(opts)` | `Promise<InstalledSkill[]>` |
| `installer.ts` | `isSkillInstalled(name, agent, opts)` | `Promise<boolean>` |
| `skills.ts` | `parseSkillMd(path, opts)` | `Promise<Skill \| null>` |
| `skills.ts` | `discoverSkills(basePath, subpath, opts)` | `Promise<Skill[]>` |
| `agents.ts` | `detectInstalledAgents()` | `Promise<AgentType[]>` |

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Git dependency breaks on upstream changes | Pin to specific commit hash |
| tsup can't bundle TS from node_modules | Fallback: vendor the 5 clean modules (~500 lines) |
| skills.sh API rate limits or goes down | Cache search results locally, provide offline fallback |
| searchSkillsAPI returns irrelevant results | Rank by multi-tag match count, let user deselect |
| SKILL.md format varies across sources | Use `parseSkillMd()` from skills package — handles variations |

## Out of Scope

- Agent plugin support (dropped entirely)
- Preset bundles (were registry-based, may revisit later)
- Offline-first mode (can be added as enhancement)

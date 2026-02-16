# CLAUDE.md Generation After Skill Installation

## Problem

Claude Code sometimes ignores installed skills because nothing in CLAUDE.md tells it to use them. Skills are installed as SKILL.md files in `.claude/skills/`, but without explicit CLAUDE.md rules, Claude may not prioritize them.

## Solution

Automatically generate a managed section in CLAUDE.md after skill installation. The section lists installed skills grouped by category with imperative rules telling Claude when to use each skill.

## File Placement

| Scope     | CLAUDE.md Path          | Git-tracked? |
|-----------|-------------------------|--------------|
| `project` | `./CLAUDE.md`           | Yes          |
| `user`    | `~/.claude/CLAUDE.md`   | N/A          |
| `local`   | `./CLAUDE.local.md`     | No           |

## Marker-Based Section Management

Content wrapped in HTML comment markers:

```
<!-- superpower-skills-start -->
...generated content...
<!-- superpower-skills-end -->
```

Update strategy:
- If markers exist: replace content between them
- If file exists but no markers: append section at end
- If file doesn't exist: create with just the section

User content outside markers is never touched.

## Rule Generation

New module: `src/install/claude-md.ts`

### Category-to-rule mapping

Each skill category has a rule template. Skills are grouped by category, and each gets a one-liner rule:

- **Core**: `ALWAYS use {name} — {description}` (strongest directives)
- **Workflow**: `Use {name} for {description}` (process guidance)
- **Git**: `Use {name} for {description}`
- **Languages/frameworks**: `Use {name} when working with {relevant tech}`
- **Fallback**: `Use {name} — {description}` (for unmapped categories)

### Example output

```markdown
<!-- superpower-skills-start -->
# Superpowers Skills

ALWAYS check if a superpowers skill applies before starting any task.

## Core
- ALWAYS use systematic-debugging when investigating failures
- ALWAYS use test-driven-development when implementing features
- ALWAYS use verification-before-completion before claiming work is done

## Workflow
- Use brainstorming before building new features or making design decisions
- Use writing-plans for multi-step implementation tasks
- When multiple independent tasks exist, use dispatching-parallel-agents

## Languages
- Use typescript-pro when building TypeScript applications requiring advanced types
<!-- superpower-skills-end -->
```

## Integration

Called as the final step in `installSkills()`:

```
installSkills()
  ├── download each skill...
  ├── print summary
  └── updateClaudeMd(skillNames, skillsRegistry, scope)
```

Only for skills, not agents (agents are auto-discovered by Claude CLI).

Prints: `Updated CLAUDE.md with skill rules`

## Edge Cases

1. **Re-running installer**: Marker section fully replaced. No duplicates.
2. **User edits outside markers**: Preserved.
3. **Empty skill list**: Skip CLAUDE.md generation.
4. **Unknown category**: Falls back to generic template.
5. **Write failure**: Log warning, don't fail installation.

## Files to Create/Modify

- **Create**: `src/install/claude-md.ts` — generation logic + file update
- **Modify**: `src/install/skills.ts` — call `updateClaudeMd()` after install
- **Modify**: `src/install/scope.ts` — add `resolveClaudeMdPath(scope)` helper

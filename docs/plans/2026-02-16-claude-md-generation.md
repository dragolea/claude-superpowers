# CLAUDE.md Generation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** After skill installation, automatically generate/update a managed section in CLAUDE.md that tells Claude when to use each installed skill.

**Architecture:** New module `src/install/claude-md.ts` handles all generation logic. It resolves the CLAUDE.md path per scope, generates rules grouped by category using templates, and writes a marker-delimited section. Called as the last step of `installSkills()`.

**Tech Stack:** Node.js fs/promises, existing SkillsRegistry types, no new dependencies.

---

### Task 1: Add `resolveClaudeMdPath()` to scope.ts

**Files:**
- Modify: `src/install/scope.ts:1-12`

**Step 1: Add the new function**

Add `resolveClaudeMdPath` below the existing `resolveSkillsDir`:

```typescript
export function resolveClaudeMdPath(scope: InstallScope): string {
  switch (scope) {
    case "user":
      return `${homedir()}/.claude/CLAUDE.md`;
    case "project":
      return "CLAUDE.md";
    case "local":
      return "CLAUDE.local.md";
  }
}
```

**Step 2: Verify typecheck passes**

Run: `cd /Users/dragolea/Developer/personal-projects/claude-superpowers && npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/install/scope.ts
git commit -m "feat: add resolveClaudeMdPath scope resolver"
```

---

### Task 2: Create `src/install/claude-md.ts` — marker constants and section generator

**Files:**
- Create: `src/install/claude-md.ts`

**Step 1: Create the file with marker constants, category rule templates, and `generateClaudeMdSection()`**

```typescript
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { theme } from "../ui/format.js";
import { getSkillByName, getCategoryName } from "../registry/skills.js";
import { resolveClaudeMdPath } from "./scope.js";
import type { SkillsRegistry, InstallScope } from "../registry/types.js";

const MARKER_START = "<!-- superpower-skills-start -->";
const MARKER_END = "<!-- superpower-skills-end -->";

/**
 * Category rule templates.
 * `template` receives (skillName, skillDescription) and returns a markdown bullet.
 */
const categoryTemplates: Record<
  string,
  (name: string, desc: string) => string
> = {
  core: (name, desc) => `- ALWAYS use ${name} — ${desc}`,
  workflow: (name, desc) => `- Use ${name} for ${desc.toLowerCase()}`,
  git: (name, desc) => `- Use ${name} for ${desc.toLowerCase()}`,
  web: (name, desc) => `- Use ${name} when working on web projects — ${desc.toLowerCase()}`,
  mobile: (name, desc) => `- Use ${name} when working on mobile apps — ${desc.toLowerCase()}`,
  backend: (name, desc) => `- Use ${name} for backend/API work — ${desc.toLowerCase()}`,
  languages: (name, desc) => `- Use ${name} — ${desc}`,
  devops: (name, desc) => `- Use ${name} for DevOps tasks — ${desc.toLowerCase()}`,
  security: (name, desc) => `- Use ${name} for security analysis — ${desc.toLowerCase()}`,
  design: (name, desc) => `- Use ${name} — ${desc}`,
  documents: (name, desc) => `- Use ${name} — ${desc}`,
  meta: (name, desc) => `- Use ${name} — ${desc}`,
};

function defaultTemplate(name: string, desc: string): string {
  return `- Use ${name} — ${desc}`;
}

export function generateClaudeMdSection(
  skillNames: string[],
  skillsRegistry: SkillsRegistry,
): string {
  // Group installed skills by category
  const byCategory = new Map<string, { name: string; description: string }[]>();

  for (const skillName of skillNames) {
    const skill = getSkillByName(skillsRegistry, skillName);
    if (!skill) continue;

    const cat = skill.category;
    if (!byCategory.has(cat)) {
      byCategory.set(cat, []);
    }
    byCategory.get(cat)!.push({ name: skill.name, description: skill.description });
  }

  if (byCategory.size === 0) return "";

  // Maintain registry category order
  const categoryOrder = Object.keys(skillsRegistry.categories);
  const sortedCategories = [...byCategory.keys()].sort(
    (a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b),
  );

  const lines: string[] = [
    MARKER_START,
    "# Superpowers Skills",
    "",
    "ALWAYS check if a superpowers skill applies before starting any task.",
  ];

  for (const catId of sortedCategories) {
    const skills = byCategory.get(catId)!;
    const catName = getCategoryName(skillsRegistry, catId);
    const templateFn = categoryTemplates[catId] ?? defaultTemplate;

    lines.push("");
    lines.push(`## ${catName}`);
    for (const { name, description } of skills) {
      lines.push(templateFn(name, description));
    }
  }

  lines.push(MARKER_END);
  return lines.join("\n");
}
```

**Step 2: Verify typecheck passes**

Run: `cd /Users/dragolea/Developer/personal-projects/claude-superpowers && npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/install/claude-md.ts
git commit -m "feat: add CLAUDE.md section generator with category templates"
```

---

### Task 3: Add `updateClaudeMd()` function to `src/install/claude-md.ts`

**Files:**
- Modify: `src/install/claude-md.ts`

**Step 1: Add the `updateClaudeMd` function at the bottom of the file**

```typescript
export async function updateClaudeMd(
  skillNames: string[],
  skillsRegistry: SkillsRegistry,
  scope: InstallScope,
): Promise<void> {
  if (skillNames.length === 0) return;

  const section = generateClaudeMdSection(skillNames, skillsRegistry);
  if (!section) return;

  const filePath = resolveClaudeMdPath(scope);

  try {
    // Ensure parent directory exists (for ~/.claude/CLAUDE.md)
    await mkdir(dirname(filePath), { recursive: true });

    let existing = "";
    try {
      existing = await readFile(filePath, "utf-8");
    } catch {
      // File doesn't exist yet — that's fine
    }

    let updated: string;
    const startIdx = existing.indexOf(MARKER_START);
    const endIdx = existing.indexOf(MARKER_END);

    if (startIdx !== -1 && endIdx !== -1) {
      // Replace existing section
      updated =
        existing.slice(0, startIdx) +
        section +
        existing.slice(endIdx + MARKER_END.length);
    } else if (existing.length > 0) {
      // Append to existing file
      updated = existing.trimEnd() + "\n\n" + section + "\n";
    } else {
      // New file
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

**Step 2: Verify typecheck passes**

Run: `cd /Users/dragolea/Developer/personal-projects/claude-superpowers && npx tsc --noEmit`
Expected: no errors

**Step 3: Commit**

```bash
git add src/install/claude-md.ts
git commit -m "feat: add updateClaudeMd for marker-based section management"
```

---

### Task 4: Integrate into `installSkills()`

**Files:**
- Modify: `src/install/skills.ts:1-92`

**Step 1: Add the import**

Add to the imports at the top of `src/install/skills.ts`:

```typescript
import { updateClaudeMd } from "./claude-md.js";
```

**Step 2: Call `updateClaudeMd` after the install summary**

At the end of `installSkills()`, after the `console.log(formatInstallSummary(...))` call (line 83-91), add:

```typescript
  // Generate/update CLAUDE.md with skill rules
  if (success > 0) {
    await updateClaudeMd(skillNames, skillsRegistry, scope);
  }
```

The full function should end like:

```typescript
  s.stop(`Installed ${success} skills${failed > 0 ? ` (${failed} failed)` : ""}`);

  console.log(
    formatInstallSummary({
      type: "skills",
      success,
      failed,
      scope,
      skillsDir,
    }),
  );

  // Generate/update CLAUDE.md with skill rules
  if (success > 0) {
    await updateClaudeMd(skillNames, skillsRegistry, scope);
  }
}
```

Note: We pass `skillNames` (all requested), not just successful ones, because the function's `getSkillByName` lookup will naturally skip any that aren't in the registry. For re-runs, this means previously installed skills still appear in CLAUDE.md even if they weren't re-downloaded this time — which is correct behavior.

**Step 3: Verify typecheck passes**

Run: `cd /Users/dragolea/Developer/personal-projects/claude-superpowers && npx tsc --noEmit`
Expected: no errors

**Step 4: Commit**

```bash
git add src/install/skills.ts
git commit -m "feat: generate CLAUDE.md rules after skill installation"
```

---

### Task 5: Build and manual smoke test

**Files:**
- None (verification only)

**Step 1: Build the project**

Run: `cd /Users/dragolea/Developer/personal-projects/claude-superpowers && npm run build`
Expected: successful build, no errors

**Step 2: Verify the output bundle includes the new module**

Run: `grep -l "superpower-skills-start" dist/bin.js`
Expected: match found (marker string is bundled)

**Step 3: Dry-run test with preset**

Create a temporary directory and test:

```bash
cd /tmp && mkdir claude-md-test && cd claude-md-test && git init
node /Users/dragolea/Developer/personal-projects/claude-superpowers/dist/bin.js --preset core --scope project
```

Expected:
1. Skills install as before
2. A new `CLAUDE.md` is created with `<!-- superpower-skills-start -->` and `<!-- superpower-skills-end -->` markers
3. Core skills are listed with `ALWAYS use` prefix

**Step 4: Test idempotency — run the same preset again**

```bash
node /Users/dragolea/Developer/personal-projects/claude-superpowers/dist/bin.js --preset core --scope project
```

Expected: CLAUDE.md section is replaced, not duplicated. File has exactly one pair of markers.

**Step 5: Test append to existing CLAUDE.md**

```bash
echo "# My Project Rules\n\nDon't break things." > CLAUDE.md
node /Users/dragolea/Developer/personal-projects/claude-superpowers/dist/bin.js --preset core --scope project
```

Expected: CLAUDE.md contains "My Project Rules" at the top AND the superpowers section appended at the bottom.

**Step 6: Cleanup**

```bash
rm -rf /tmp/claude-md-test
```

**Step 7: Commit (if any fixes were needed)**

If any changes were needed, commit them. Otherwise skip.

---

### Task 6: Final commit — build output

**Step 1: Rebuild**

Run: `cd /Users/dragolea/Developer/personal-projects/claude-superpowers && npm run build`

**Step 2: Verify typecheck one last time**

Run: `npm run typecheck`
Expected: no errors

**Step 3: Commit build if dist is tracked**

Check if `dist/` is in `.gitignore`:
```bash
grep "dist" .gitignore
```

If dist is NOT tracked (in .gitignore), skip this commit. If it IS tracked, commit the updated build output.

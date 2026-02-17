/**
 * Query installed skills via the `skills` package.
 *
 * Wraps `listInstalledSkills` and maps the result to our
 * lighter `SkillMetadata` type used for CLAUDE.md generation.
 */

import { listInstalledSkills } from "skills/src/installer.ts";
import type { SkillMetadata } from "../types.js";

/**
 * Retrieve metadata for all skills installed in the given directory.
 *
 * @param cwd - Project root to scan for installed skills
 * @returns Array of skill metadata (name, description, path)
 */
export async function getInstalledSkillMetadata(
  cwd: string,
): Promise<SkillMetadata[]> {
  const installed = await listInstalledSkills({ cwd });
  return installed.map((skill) => ({
    name: skill.name,
    description: skill.description,
    path: skill.path,
  }));
}
